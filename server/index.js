const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { addMinutes, addDays } = require('date-fns');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || '*', // Allow configured client or all (for dev)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Database Setup (PostgreSQL for production, SQLite for development)
const isProduction = process.env.NODE_ENV === 'production';
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false
    });

// Models
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('student', 'admin'), defaultValue: 'student' },
  access_expiry: { type: DataTypes.DATE },
  is_locked: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const Device = sequelize.define('Device', {
  fingerprint: { type: DataTypes.STRING, allowNull: false },
  last_used: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

User.hasMany(Device);
Device.belongsTo(User);

// Taxonomy Models
const Category = sequelize.define('Category', {
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('flashcard', 'question'), allowNull: false }
});

const Tag = sequelize.define('Tag', {
  name: { type: DataTypes.STRING, allowNull: false }
});

const Flashcard = sequelize.define('Flashcard', {
  question: { type: DataTypes.TEXT, allowNull: false },
  answer: { type: DataTypes.TEXT, allowNull: false },
  image_url: { type: DataTypes.STRING },
  module: { type: DataTypes.STRING }, // Legacy support or alias to Category? Keeping for now but favoring CategoryId
  year: { type: DataTypes.STRING },
});

const QuizQuestion = sequelize.define('QuizQuestion', {
  question: { type: DataTypes.TEXT, allowNull: false },
  options: { type: DataTypes.JSON, allowNull: false },
  correct_option: { type: DataTypes.INTEGER, allowNull: false },
  explanation: { type: DataTypes.TEXT },
  module: { type: DataTypes.STRING }, // Legacy
  year: { type: DataTypes.STRING },
  type: { type: DataTypes.ENUM('practice', 'exam'), defaultValue: 'practice' }
});

// Associations for Taxonomy
Category.hasMany(Flashcard);
Flashcard.belongsTo(Category);

Category.hasMany(QuizQuestion);
QuizQuestion.belongsTo(Category);

const FlashcardTag = sequelize.define('FlashcardTag', {});
const QuestionTag = sequelize.define('QuestionTag', {});

Flashcard.belongsToMany(Tag, { through: FlashcardTag });
Tag.belongsToMany(Flashcard, { through: FlashcardTag });

QuizQuestion.belongsToMany(Tag, { through: QuestionTag });
Tag.belongsToMany(QuizQuestion, { through: QuestionTag });


const Attempt = sequelize.define('Attempt', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  question_id: { type: DataTypes.INTEGER, allowNull: false },
  selected_option: { type: DataTypes.INTEGER },
  is_correct: { type: DataTypes.BOOLEAN },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

User.hasMany(Attempt, { foreignKey: 'user_id' });
Attempt.belongsTo(User, { foreignKey: 'user_id' });
QuizQuestion.hasMany(Attempt, { foreignKey: 'question_id' });
Attempt.belongsTo(QuizQuestion, { foreignKey: 'question_id' });

// User Category Access
const UserCategory = sequelize.define('UserCategory', {});
User.belongsToMany(Category, { through: UserCategory });
Category.belongsToMany(User, { through: UserCategory });

const Report = sequelize.define('Report', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  targetType: { type: DataTypes.ENUM('question', 'flashcard'), allowNull: false },
  targetId: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.ENUM('Typo', 'Wrong Answer', 'Confusing'), allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('open', 'resolved'), defaultValue: 'open' }
});

User.hasMany(Report, { foreignKey: 'user_id' });
Report.belongsTo(User, { foreignKey: 'user_id' });
// Reports are polymorphic, so no strict foreign key constraints at DB level for targetId usually,
// or multiple FKs. We'll manage targetId manually in logic.

// SRS Review Model
const Review = sequelize.define('Review', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  card_id: { type: DataTypes.INTEGER, allowNull: false },
  ease_factor: { type: DataTypes.FLOAT, defaultValue: 2.5 },
  interval: { type: DataTypes.INTEGER, defaultValue: 0 }, // in days (or minutes for first steps)
  next_review_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  last_review_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });
Flashcard.hasMany(Review, { foreignKey: 'card_id' });
Review.belongsTo(Flashcard, { foreignKey: 'card_id' });

// Sync Database
// Use alter: true to update schema without data loss.
// In strict production, you might disable this and use migrations.
sequelize.sync({ alter: true }).then(async () => {
  console.log('Database synced');
});

// Routes

// Auth Routes
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const access_expiry = addDays(new Date(), 180);
    const user = await User.create({ name, email, password: hashedPassword, access_expiry });
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password, fingerprint } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_locked) {
      return res.status(403).json({ error: 'Account is locked' });
    }

    if (user.access_expiry && new Date() > new Date(user.access_expiry)) {
        return res.status(403).json({ error: 'Access expired' });
    }

    // Device Check
    let device = await Device.findOne({ where: { UserId: user.id, fingerprint } });
    if (!device) {
      const deviceCount = await Device.count({ where: { UserId: user.id } });
      if (deviceCount >= 2) {
        return res.status(403).json({ error: 'Max devices reached. Verify email to add new device.' });
      }
      await Device.create({ UserId: user.id, fingerprint });
    } else {
      device.update({ last_used: new Date() });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err) return res.sendStatus(403);
    try {
        const user = await User.findByPk(decoded.id);
        if (!user || (user.access_expiry && new Date() > new Date(user.access_expiry))) {
             return res.status(403).json({ error: 'Access expired or user not found' });
        }
        req.user = user;
        next();
    } catch (e) {
        return res.sendStatus(500);
    }
  });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
};

// --- ADMIN ROUTER ---
const adminRouter = express.Router();
adminRouter.use(authenticateToken);
adminRouter.use(isAdmin);

// User Management
adminRouter.get('/users', async (req, res) => {
    const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'access_expiry'],
        include: [Category]
    });
    res.json(users);
});

adminRouter.post('/users/:id/access', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { categoryIds } = req.body; // Array of IDs
        await user.setCategories(categoryIds);
        res.json({ message: 'Access updated' });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// Dashboard Stats
adminRouter.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.count();
        const activeFlags = await Report.count({ where: { status: 'open' } });
        const totalQuestions = await QuizQuestion.count();
        const totalFlashcards = await Flashcard.count();
        res.json({ totalUsers, activeFlags, totalQuestions, totalFlashcards });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Category CRUD
adminRouter.get('/categories', async (req, res) => {
    const categories = await Category.findAll();
    res.json(categories);
});
adminRouter.post('/categories', async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json(category);
    } catch (e) { res.status(400).json({ error: e.message }); }
});
adminRouter.put('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.status(404).json({ error: 'Not found' });
        await category.update(req.body);
        res.json(category);
    } catch (e) { res.status(400).json({ error: e.message }); }
});
adminRouter.delete('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.status(404).json({ error: 'Not found' });
        await category.destroy();
        res.json({ message: 'Deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Tag CRUD
adminRouter.get('/tags', async (req, res) => {
    const tags = await Tag.findAll();
    res.json(tags);
});
adminRouter.post('/tags', async (req, res) => {
    try {
        const tag = await Tag.create(req.body);
        res.status(201).json(tag);
    } catch (e) { res.status(400).json({ error: e.message }); }
});
adminRouter.put('/tags/:id', async (req, res) => {
    try {
        const tag = await Tag.findByPk(req.params.id);
        if (!tag) return res.status(404).json({ error: 'Not found' });
        await tag.update(req.body);
        res.json(tag);
    } catch (e) { res.status(400).json({ error: e.message }); }
});
adminRouter.delete('/tags/:id', async (req, res) => {
    try {
        const tag = await Tag.findByPk(req.params.id);
        if (!tag) return res.status(404).json({ error: 'Not found' });
        await tag.destroy();
        res.json({ message: 'Deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reports
adminRouter.get('/reports', async (req, res) => {
    try {
        const reports = await Report.findAll({
            where: req.query.status ? { status: req.query.status } : {},
            include: [User]
        });

        // Enrich reports with target content
        // In a real app with polymorphic associations, we might do separate lookups or dynamic includes.
        // For simplicity, we'll fetch them manually or let the frontend do it?
        // Better to fetch here to avoid N+1 on frontend if possible, but simplest is let frontend fetch target.
        // Or we can attach it here.
        const reportsWithContent = await Promise.all(reports.map(async (r) => {
            let content = null;
            if (r.targetType === 'question') {
                content = await QuizQuestion.findByPk(r.targetId);
            } else if (r.targetType === 'flashcard') {
                content = await Flashcard.findByPk(r.targetId);
            }
            return { ...r.toJSON(), content };
        }));

        res.json(reportsWithContent);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

adminRouter.put('/reports/:id/resolve', async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) return res.status(404).json({ error: 'Not found' });
        report.status = 'resolved';
        await report.save();
        res.json(report);
    } catch (e) { res.status(400).json({ error: e.message }); }
});

app.use('/api/admin', adminRouter);


// --- PUBLIC / STUDENT ROUTES ---

// Flashcard Routes
app.get('/flashcards', authenticateToken, async (req, res) => {
  // Access Control
  let where = {};
  if (req.user.role !== 'admin') {
      const user = await User.findByPk(req.user.id, { include: Category });
      const allowedCategoryIds = user.Categories ? user.Categories.map(c => c.id) : [];
      if (allowedCategoryIds.length === 0) {
          return res.json([]); // No access
      }
      where.CategoryId = allowedCategoryIds;
  }

  const flashcards = await Flashcard.findAll({
      where,
      include: [Category, Tag]
  });
  res.json(flashcards);
});

app.post('/flashcards', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { tags, ...data } = req.body;
    const card = await Flashcard.create(data);
    if (tags && tags.length > 0) {
        // Assume tags are array of IDs
        await card.setTags(tags);
    }
    res.status(201).json(card);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/flashcards/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const card = await Flashcard.findByPk(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const { tags, ...data } = req.body;
    await card.update(data);
    if (tags) {
        await card.setTags(tags);
    }
    res.json(card);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/flashcards/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const card = await Flashcard.findByPk(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    await card.destroy();
    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// SRS Reviews Routes
app.get('/reviews/due', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const reviews = await Review.findAll({
      where: {
        user_id: userId,
        next_review_date: {
          [Sequelize.Op.lte]: now
        }
      },
      include: [Flashcard]
    });

    const reviewedCardIds = await Review.findAll({ where: { user_id: userId }, attributes: ['card_id'] });
    const reviewedIds = reviewedCardIds.map(r => r.card_id);

    // Filter new cards by access
    let accessWhere = {};
    if (req.user.role !== 'admin') {
        const user = await User.findByPk(userId, { include: Category });
        const allowedIds = user.Categories ? user.Categories.map(c => c.id) : [];
        if (allowedIds.length === 0) return res.json([...reviews.map(r => ({ ...r.Flashcard.toJSON(), reviewId: r.id, type: 'review' }))]);
        accessWhere.CategoryId = allowedIds;
    }

    const newCards = await Flashcard.findAll({
      where: {
        id: { [Sequelize.Op.notIn]: reviewedIds },
        ...accessWhere
      },
      limit: 20
    });

    const dueReviews = reviews.map(r => ({ ...r.Flashcard.toJSON(), reviewId: r.id, type: 'review' }));
    const newReviews = newCards.map(c => ({ ...c.toJSON(), reviewId: null, type: 'new' }));

    res.json([...dueReviews, ...newReviews]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/reviews', authenticateToken, async (req, res) => {
  try {
    const { cardId, rating } = req.body;
    const userId = req.user.id;

    let review = await Review.findOne({ where: { user_id: userId, card_id: cardId } });

    let ease = review ? review.ease_factor : 2.5;
    let interval = review ? review.interval : 0;

    let nextReview = new Date();

    if (rating === 'again') {
        interval = 0;
        ease = Math.max(1.3, ease - 0.2);
        nextReview = addMinutes(new Date(), 10);
    } else if (rating === 'hard') {
        interval = 1;
        ease = Math.max(1.3, ease - 0.15);
        nextReview = addDays(new Date(), 1);
    } else if (rating === 'good') {
        if (interval === 0) interval = 1;
        else if (interval === 1) interval = 3;
        else interval = Math.ceil(interval * ease);

        nextReview = addDays(new Date(), interval);
    } else if (rating === 'easy') {
        if (interval === 0) interval = 4;
        else if (interval === 1) interval = 6;
        else interval = Math.ceil(interval * ease * 1.3);

        ease += 0.15;
        nextReview = addDays(new Date(), interval);
    }

    if (review) {
        review.interval = interval;
        review.ease_factor = ease;
        review.next_review_date = nextReview;
        review.last_review_date = new Date();
        await review.save();
    } else {
        await Review.create({
            user_id: userId,
            card_id: cardId,
            ease_factor: ease,
            interval: interval,
            next_review_date: nextReview,
            last_review_date: new Date()
        });
    }

    res.json({ message: 'Review recorded', nextReview });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Quiz Routes
app.get('/quiz/questions', authenticateToken, async (req, res) => {
    try {
        const { type = 'practice', limit = 10, module } = req.query;
        const where = { type };
        if (module) where.module = module;

        // Access Control
        if (req.user.role !== 'admin') {
            const user = await User.findByPk(req.user.id, { include: Category });
            const allowedCategoryIds = user.Categories ? user.Categories.map(c => c.id) : [];
            if (allowedCategoryIds.length === 0) return res.json([]);

            where.CategoryId = allowedCategoryIds;
        }

        const questions = await QuizQuestion.findAll({
            where,
            order: sequelize.random(),
            limit: parseInt(limit),
            include: [Category, Tag]
        });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/quiz/report', authenticateToken, async (req, res) => {
    try {
        const { questionId, reason, details } = req.body;
        // Map legacy report request to new polymorphic report
        // Assuming we are only reporting questions here based on route name
        await Report.create({
            user_id: req.user.id,
            targetType: 'question',
            targetId: questionId,
            reason,
            description: details
        });
        res.status(201).json({ message: 'Report submitted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// REMOVED NOTE ROUTES

app.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const totalAttempts = await Attempt.count({ where: { user_id: userId } });

        const attempts = await Attempt.findAll({
            where: { user_id: userId },
            include: [QuizQuestion]
        });

        const stats = {};

        attempts.forEach(attempt => {
            // Use new Category if available, else fallback to legacy string
            let categoryName = 'Unknown';
            if (attempt.QuizQuestion && attempt.QuizQuestion.Category) {
                categoryName = attempt.QuizQuestion.Category.name;
            } else if (attempt.QuizQuestion && attempt.QuizQuestion.module) {
                categoryName = attempt.QuizQuestion.module;
            }

            if (!stats[categoryName]) {
                stats[categoryName] = { total: 0, correct: 0 };
            }
            stats[categoryName].total++;
            if (attempt.is_correct) stats[categoryName].correct++;
        });

        const formattedStats = Object.keys(stats).map(module => ({
            module,
            total: stats[module].total,
            correct: stats[module].correct,
            accuracy: Math.round((stats[module].correct / stats[module].total) * 100)
        }));

        res.json({
            totalAttempts,
            byModule: formattedStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/quiz/questions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { tags, ...data } = req.body;
        const question = await QuizQuestion.create(data);
        if (tags) await question.setTags(tags);
        res.status(201).json(question);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/quiz/questions/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const question = await QuizQuestion.findByPk(req.params.id);
        if (!question) return res.status(404).json({ error: 'Question not found' });
        const { tags, ...data } = req.body;
        await question.update(data);
        if (tags) await question.setTags(tags);
        res.json(question);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/quiz/questions/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const question = await QuizQuestion.findByPk(req.params.id);
        if (!question) return res.status(404).json({ error: 'Question not found' });
        await question.destroy();
        res.json({ message: 'Question deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/quiz/submit', authenticateToken, async (req, res) => {
    try {
        const { questionId, selectedOption } = req.body;
        const question = await QuizQuestion.findByPk(questionId);
        if (!question) return res.status(404).json({ error: 'Question not found' });

        const isCorrect = question.correct_option === selectedOption;

        await Attempt.create({
            user_id: req.user.id,
            question_id: questionId,
            selected_option: selectedOption,
            is_correct: isCorrect
        });

        res.json({
            isCorrect,
            correctOption: question.correct_option,
            explanation: question.explanation
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
