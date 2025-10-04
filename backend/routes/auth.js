import express from 'express';
import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';
import User from '../models/User.js';

const router = express.Router();

// Signup/Login
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, companyName, currency, country } = req.body;

    if (!email || !password || !name || !companyName) {
      return res.status(400).json({
        message: 'Missing required fields: email, password, name, companyName'
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const newCompany = await Company.create({
      name: companyName,
      currency,
      country,
    });

    const user = await User.create({
      email,
      password,
      name,
      role: 'admin',
      companyId: newCompany.id,
    });

    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Company, as: 'company', attributes: ['name', 'currency', 'country'] }
      ]
    });

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [{ model: Company, as: 'company' }]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is inactive. Please contact your administrator.' });
    }

    const token = jwt.sign(
      {
        userId: user.id, // Changed from 'id' to 'userId'
        role: user.role,
        companyId: user.companyId
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      companyId: user.companyId,
      isManagerApprover: user.isManagerApprover,
      company: user.company,
    };

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Look for userId in the decoded token (changed from id)
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Company,
        as: 'company'
      }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Add this route to get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userResponse = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      company: req.user.company,
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;