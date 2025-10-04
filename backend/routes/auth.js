import express from 'express';
import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';
import User from '../models/User.js';

const router = express.Router();

// Signup/Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, companyName, currency = 'USD', country = 'US' } = req.body;

    console.log('Registration attempt:', { email, name, companyName });

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
      isManagerApprover: true,
    });

    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'userCompany',
          attributes: ['id', 'name', 'currency', 'country']
        }
      ]
    });

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        companyId: user.companyId
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Registration successful for:', email);

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({
      where: { email },
      include: [
        {
          association: 'userCompany',
          attributes: ['id', 'name', 'currency', 'country']
        }
      ]
    });

    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log('User found, validating password...');

    // Check if user has validatePassword method
    if (typeof user.validatePassword !== 'function') {
      console.error('validatePassword method missing on user model');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const isMatch = await user.validatePassword(password);
    console.log('Password validation result:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'Your account is inactive. Please contact your administrator.'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        companyId: user.companyId
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      companyId: user.companyId,
      isManagerApprover: user.isManagerApprover,
      company: user.userCompany,
    };

    console.log('Login successful for:', email);

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token received for verification');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    console.log('Token decoded:', decoded);

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'userCompany',
          attributes: ['id', 'name', 'currency', 'country']
        }
      ]
    });

    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return res.status(401).json({ message: 'User not found' });
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.userCompany,
      isManagerApprover: user.isManagerApprover,
    };

    console.log('User data sent for ID:', user.id);

    res.json(userResponse);
  } catch (error) {
    console.error('Get user error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;