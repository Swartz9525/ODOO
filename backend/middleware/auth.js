import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No valid token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. Token is missing.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'userCompany',
          attributes: ['id', 'name', 'currency', 'country']
        }
      ]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token is invalid or user is inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired.' });
    }
    res.status(500).json({ message: 'Server authentication error.' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};