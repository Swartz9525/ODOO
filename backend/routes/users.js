import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get all users (Admin/Manager)
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const whereClause = { companyId: req.user.companyId };

    // Managers can only see their team members
    if (req.user.role === 'manager') {
      whereClause.managerId = req.user.id;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'userManager',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create user (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { email, password, name, role, managerId, isManagerApprover = false } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        message: 'Missing required fields: email, password, name, role'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email, companyId: req.user.companyId }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      email,
      password,
      name,
      role,
      managerId: managerId || null,
      isManagerApprover: role === 'manager' ? isManagerApprover : false,
      companyId: req.user.companyId,
      isActive: true,
    });

    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'userManager',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, role, managerId, isManagerApprover, isActive, password } = req.body;

    const user = await User.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {
      name: name || user.name,
      role: role || user.role,
      managerId: managerId !== undefined ? managerId : user.managerId,
      isActive: isActive !== undefined ? isActive : user.isActive,
    };

    // Only managers can be manager approvers
    if (role === 'manager' || user.role === 'manager') {
      updateData.isManagerApprover = isManagerApprover !== undefined ? isManagerApprover : user.isManagerApprover;
    } else {
      updateData.isManagerApprover = false;
    }

    // Only update password if provided
    if (password && password.trim() !== '') {
      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          message: 'Password must be at least 6 characters long'
        });
      }
      updateData.password = password;
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'userManager',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get managers for dropdown
router.get('/managers', authenticate, authorize('admin'), async (req, res) => {
  try {
    const managers = await User.findAll({
      where: {
        companyId: req.user.companyId,
        role: 'manager',
        isActive: true,
      },
      attributes: ['id', 'name', 'email'],
    });

    res.json(managers);
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;