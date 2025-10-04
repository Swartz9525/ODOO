import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
// import { Company, ApprovalFlow, ApprovalRule, User, Expense } from '../models/index.js';
import { Op } from 'sequelize';
import Company from '../models/Company.js';
import Expense from '../models/Expense.js';
import ApprovalFlow from '../models/ApprovalFlow.js';

const router = express.Router();

// Get company details
router.get('/', authenticate, async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.companyId);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update company details (Admin only)
router.put('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, currency, country } = req.body;

    const company = await Company.findByPk(req.user.companyId);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await company.update({
      name: name || company.name,
      currency: currency || company.currency,
      country: country || company.country,
    });

    res.json({ message: 'Company updated successfully', company });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get company statistics (Admin only)
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const totalEmployees = await User.count({
      where: {
        companyId: req.user.companyId,
        role: 'employee',
        isActive: true,
      },
    });

    const totalManagers = await User.count({
      where: {
        companyId: req.user.companyId,
        role: 'manager',
        isActive: true,
      },
    });

    const totalExpenses = await Expense.count({
      where: { companyId: req.user.companyId },
    });

    const pendingExpenses = await Expense.count({
      where: {
        companyId: req.user.companyId,
        status: 'pending',
      },
    });

    const approvedExpenses = await Expense.count({
      where: {
        companyId: req.user.companyId,
        status: 'approved',
      },
    });

    const totalExpenseAmount = await Expense.sum('convertedAmount', {
      where: {
        companyId: req.user.companyId,
        status: 'approved',
      },
    });

    res.json({
      totalEmployees,
      totalManagers,
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      totalExpenseAmount: totalExpenseAmount || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get approval flows for company
router.get('/approval-flows', authenticate, authorize('admin'), async (req, res) => {
  try {
    const approvalFlows = await ApprovalFlow.findAll({
      where: { companyId: req.user.companyId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['minAmount', 'ASC']],
    });

    res.json(approvalFlows);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create approval flow
router.post('/approval-flows', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, steps, minAmount, maxAmount, isActive = true } = req.body;

    // Validate steps
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ message: 'At least one approval step is required' });
    }

    // Validate approvers exist in company
    for (const step of steps) {
      const approver = await User.findOne({
        where: {
          id: step.approverId,
          companyId: req.user.companyId,
        },
      });

      if (!approver) {
        return res.status(400).json({
          message: `Approver with ID ${step.approverId} not found in company`
        });
      }
    }

    const approvalFlow = await ApprovalFlow.create({
      name,
      steps,
      minAmount: minAmount || 0,
      maxAmount: maxAmount || null,
      isActive,
      companyId: req.user.companyId,
    });

    const approvalFlowWithDetails = await ApprovalFlow.findByPk(approvalFlow.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.status(201).json(approvalFlowWithDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update approval flow
router.put('/approval-flows/:flowId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { flowId } = req.params;
    const { name, steps, minAmount, maxAmount, isActive } = req.body;

    const approvalFlow = await ApprovalFlow.findOne({
      where: {
        id: flowId,
        companyId: req.user.companyId,
      },
    });

    if (!approvalFlow) {
      return res.status(404).json({ message: 'Approval flow not found' });
    }

    // Validate steps if provided
    if (steps) {
      if (!Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({ message: 'At least one approval step is required' });
      }

      for (const step of steps) {
        const approver = await User.findOne({
          where: {
            id: step.approverId,
            companyId: req.user.companyId,
          },
        });

        if (!approver) {
          return res.status(400).json({
            message: `Approver with ID ${step.approverId} not found in company`
          });
        }
      }
    }

    await approvalFlow.update({
      name: name || approvalFlow.name,
      steps: steps || approvalFlow.steps,
      minAmount: minAmount !== undefined ? minAmount : approvalFlow.minAmount,
      maxAmount: maxAmount !== undefined ? maxAmount : approvalFlow.maxAmount,
      isActive: isActive !== undefined ? isActive : approvalFlow.isActive,
    });

    const updatedFlow = await ApprovalFlow.findByPk(approvalFlow.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.json(updatedFlow);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete approval flow
router.delete('/approval-flows/:flowId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { flowId } = req.params;

    const approvalFlow = await ApprovalFlow.findOne({
      where: {
        id: flowId,
        companyId: req.user.companyId,
      },
    });

    if (!approvalFlow) {
      return res.status(404).json({ message: 'Approval flow not found' });
    }

    await approvalFlow.destroy();

    res.json({ message: 'Approval flow deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get approval rules for company
router.get('/approval-rules', authenticate, authorize('admin'), async (req, res) => {
  try {
    const approvalRules = await ApprovalRule.findAll({
      where: { companyId: req.user.companyId },
      include: [
        {
          model: User,
          as: 'SpecificApprover',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['minAmount', 'ASC']],
    });

    res.json(approvalRules);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create approval rule
router.post('/approval-rules', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      ruleType,
      approvalPercentage,
      specificApproverId,
      minAmount,
      maxAmount,
      isActive = true
    } = req.body;

    // Validate rule type specific requirements
    if (ruleType === 'percentage' && (!approvalPercentage || approvalPercentage < 1 || approvalPercentage > 100)) {
      return res.status(400).json({
        message: 'Approval percentage must be between 1 and 100 for percentage rules'
      });
    }

    if ((ruleType === 'specific_approver' || ruleType === 'hybrid') && !specificApproverId) {
      return res.status(400).json({
        message: 'Specific approver is required for specific_approver and hybrid rules'
      });
    }

    // Validate specific approver exists in company
    if (specificApproverId) {
      const approver = await User.findOne({
        where: {
          id: specificApproverId,
          companyId: req.user.companyId,
        },
      });

      if (!approver) {
        return res.status(400).json({
          message: `Approver with ID ${specificApproverId} not found in company`
        });
      }
    }

    const approvalRule = await ApprovalRule.create({
      name,
      ruleType,
      approvalPercentage,
      specificApproverId,
      minAmount: minAmount || 0,
      maxAmount: maxAmount || null,
      isActive,
      companyId: req.user.companyId,
    });

    const ruleWithDetails = await ApprovalRule.findByPk(approvalRule.id, {
      include: [
        {
          model: User,
          as: 'SpecificApprover',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.status(201).json(ruleWithDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update approval rule
router.put('/approval-rules/:ruleId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { ruleId } = req.params;
    const {
      name,
      ruleType,
      approvalPercentage,
      specificApproverId,
      minAmount,
      maxAmount,
      isActive
    } = req.body;

    const approvalRule = await ApprovalRule.findOne({
      where: {
        id: ruleId,
        companyId: req.user.companyId,
      },
    });

    if (!approvalRule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    // Validate rule type specific requirements if ruleType is being updated
    if (ruleType) {
      if (ruleType === 'percentage' && (!approvalPercentage || approvalPercentage < 1 || approvalPercentage > 100)) {
        return res.status(400).json({
          message: 'Approval percentage must be between 1 and 100 for percentage rules'
        });
      }

      if ((ruleType === 'specific_approver' || ruleType === 'hybrid') && !specificApproverId) {
        return res.status(400).json({
          message: 'Specific approver is required for specific_approver and hybrid rules'
        });
      }
    }

    // Validate specific approver exists in company if provided
    if (specificApproverId) {
      const approver = await User.findOne({
        where: {
          id: specificApproverId,
          companyId: req.user.companyId,
        },
      });

      if (!approver) {
        return res.status(400).json({
          message: `Approver with ID ${specificApproverId} not found in company`
        });
      }
    }

    await approvalRule.update({
      name: name || approvalRule.name,
      ruleType: ruleType || approvalRule.ruleType,
      approvalPercentage: approvalPercentage !== undefined ? approvalPercentage : approvalRule.approvalPercentage,
      specificApproverId: specificApproverId !== undefined ? specificApproverId : approvalRule.specificApproverId,
      minAmount: minAmount !== undefined ? minAmount : approvalRule.minAmount,
      maxAmount: maxAmount !== undefined ? maxAmount : approvalRule.maxAmount,
      isActive: isActive !== undefined ? isActive : approvalRule.isActive,
    });

    const updatedRule = await ApprovalRule.findByPk(approvalRule.id, {
      include: [
        {
          model: User,
          as: 'SpecificApprover',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.json(updatedRule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete approval rule
router.delete('/approval-rules/:ruleId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { ruleId } = req.params;

    const approvalRule = await ApprovalRule.findOne({
      where: {
        id: ruleId,
        companyId: req.user.companyId,
      },
    });

    if (!approvalRule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    await approvalRule.destroy();

    res.json({ message: 'Approval rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available approvers for dropdowns
router.get('/approvers', authenticate, authorize('admin'), async (req, res) => {
  try {
    const approvers = await User.findAll({
      where: {
        companyId: req.user.companyId,
        role: { [Op.in]: ['manager', 'admin'] },
        isActive: true,
      },
      attributes: ['id', 'name', 'email', 'role'],
      order: [['name', 'ASC']],
    });

    res.json(approvers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get expense categories
router.get('/categories', authenticate, async (req, res) => {
  try {
    // Get unique categories from existing expenses
    const categories = await Expense.findAll({
      where: { companyId: req.user.companyId },
      attributes: ['category'],
      group: ['category'],
      raw: true,
    });

    const defaultCategories = [
      'Travel',
      'Meals',
      'Accommodation',
      'Office Supplies',
      'Equipment',
      'Training',
      'Other',
    ];

    const existingCategories = categories.map(item => item.category);
    const allCategories = [...new Set([...defaultCategories, ...existingCategories])];

    res.json(allCategories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get supported currencies
router.get('/currencies', authenticate, async (req, res) => {
  try {
    const currencies = [
      { code: 'USD', name: 'US Dollar' },
      { code: 'EUR', name: 'Euro' },
      { code: 'GBP', name: 'British Pound' },
      { code: 'INR', name: 'Indian Rupee' },
      { code: 'JPY', name: 'Japanese Yen' },
      { code: 'CAD', name: 'Canadian Dollar' },
      { code: 'AUD', name: 'Australian Dollar' },
    ];

    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;