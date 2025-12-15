const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './server/database.sqlite', // Adjust path relative to root
  logging: false
});

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('student', 'admin'), defaultValue: 'student' },
  access_expiry: { type: DataTypes.DATE },
  is_locked: { type: DataTypes.BOOLEAN, defaultValue: false }
});

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const [user, created] = await User.findOrCreate({
            where: { email: 'admin@test.com' },
            defaults: {
                name: 'Admin User',
                password: hashedPassword,
                role: 'admin'
            }
        });
        if (!created) {
            user.role = 'admin';
            await user.save();
        }
        console.log('Admin user ready: admin@test.com / admin123');
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

createAdmin();
