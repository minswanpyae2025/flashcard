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
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Database Setup (SQLite for development)
const sequelize = new Sequelize({
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

const Flashcard = sequelize.define('Flashcard', {
  question: { type: DataTypes.TEXT, allowNull: false },
  answer: { type: DataTypes.TEXT, allowNull: false },
  image_url: { type: DataTypes.STRING },
  module: { type: DataTypes.STRING },
  year: { type: DataTypes.STRING },
  tags: { type: DataTypes.STRING }
});

const QuizQuestion = sequelize.define('QuizQuestion', {
  question: { type: DataTypes.TEXT, allowNull: false },
  options: { type: DataTypes.JSON, allowNull: false }, // Store as JSON array ["A", "B", "C", "D"]
  correct_option: { type: DataTypes.INTEGER, allowNull: false }, // Index of correct option
  explanation: { type: DataTypes.TEXT },
  module: { type: DataTypes.STRING },
  year: { type: DataTypes.STRING },
  type: { type: DataTypes.ENUM('practice', 'exam'), defaultValue: 'practice' }
});

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
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
});

// Routes

// Auth Routes
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    // Set expiry to 6 months from now by default
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

    // Check expiry again just in case token is old but valid sig
    // Ideally we check DB, but optimizing: check token if we put expiry claim in it?
    // We didn't put expiry in token payload, but we can query user quickly or trust login check + token expiration.
    // For strictness, let's query user.
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

// Flashcard Routes
app.get('/flashcards', authenticateToken, async (req, res) => {
  const flashcards = await Flashcard.findAll();
  res.json(flashcards);
});

app.post('/flashcards', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const card = await Flashcard.create(req.body);
    res.status(201).json(card);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/flashcards/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const card = await Flashcard.findByPk(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    await card.update(req.body);
    res.json(card);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/flashcards/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
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

    const newCards = await Flashcard.findAll({
      where: {
        id: { [Sequelize.Op.notIn]: reviewedIds }
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

        const questions = await QuizQuestion.findAll({
            where,
            order: sequelize.random(),
            limit: parseInt(limit)
        });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/quiz/questions', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
        const question = await QuizQuestion.create(req.body);
        res.status(201).json(question);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/quiz/questions/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
        const question = await QuizQuestion.findByPk(req.params.id);
        if (!question) return res.status(404).json({ error: 'Question not found' });
        await question.update(req.body);
        res.json(question);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/quiz/questions/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
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
