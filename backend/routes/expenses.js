import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { Op } from 'sequelize';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import ApprovalHistory from '../models/ApprovalHistory.js';
import ApprovalFlow from '../models/ApprovalFlow.js';
import { convertCurrency } from '../utils/currencyConverter.js';

const router = express.Router();

// Submit expense
router.post('/', authenticate, authorize('employee', 'manager', 'admin'), async (req, res) => {
  try {
    const { amount, currency, category, description, expenseDate } = req.body;

    console.log('📝 Expense submission request received');
    console.log('User ID from token:', req.user.id);
    console.log('Company ID from token:', req.user.companyId);

    // Validate required fields first
    if (!amount || !currency || !category || !expenseDate) {
      return res.status(400).json({
        message: 'Missing required fields: amount, currency, category, and expenseDate are required'
      });
    }

    // CRITICAL: Verify user exists in database BEFORE creating expense
    console.log('🔍 Verifying user exists in database...');
    const userExists = await User.findByPk(req.user.id, {
      include: [{
        model: Company,
        as: 'userCompany',
        attributes: ['id', 'name', 'currency']
      }]
    });

    if (!userExists) {
      console.error('❌ User not found in database:', req.user.id);
      return res.status(404).json({
        message: 'User account not found in database. Your session may be invalid. Please log out and log back in.',
        userId: req.user.id,
        details: 'The user ID from your authentication token does not exist in the database. This usually happens after a database reset or if the user was deleted.'
      });
    }

    console.log('✅ User found:', userExists.name, userExists.email);

    // Verify company exists
    const companyExists = await Company.findByPk(req.user.companyId);
    if (!companyExists) {
      console.error('❌ Company not found in database:', req.user.companyId);
      return res.status(404).json({
        message: 'Company not found in database. Please contact your administrator.',
        companyId: req.user.companyId
      });
    }

    console.log('✅ Company found:', companyExists.name);

    // Convert to company currency
    console.log('💱 Converting currency...');
    const convertedAmount = await convertCurrency(
      amount,
      currency,
      companyExists.currency
    );

    console.log(`💰 Converted ${amount} ${currency} to ${convertedAmount} ${companyExists.currency}`);

    // Create expense with verified IDs
    console.log('💾 Creating expense record...');
    const expense = await Expense.create({
      amount,
      currency,
      convertedAmount,
      category,
      description,
      expenseDate,
      employeeId: userExists.id, // Use verified user ID
      companyId: companyExists.id, // Use verified company ID
    });

    console.log('✅ Expense created:', expense.id);

    // Start approval process
    console.log('🔄 Starting approval process...');
    await startApprovalProcess(expense);

    // Fetch complete expense details
    const expenseWithDetails = await Expense.findByPk(expense.id, {
      include: [
        {
          association: 'expenseEmployee',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    console.log('✅ Expense submitted successfully');
    res.status(201).json(expenseWithDetails);

  } catch (error) {
    console.error('❌ Error submitting expense:', error.name, error.message);

    // Handle specific Sequelize errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.error('Foreign key constraint details:', error.parent?.detail);
      return res.status(400).json({
        message: 'Database reference error: User or Company not found',
        error: error.message,
        details: error.parent?.detail || 'Foreign key constraint violation',
        solution: 'Please log out and log back in to refresh your session'
      });
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    if (error.name === 'SequelizeConnectionError') {
      return res.status(503).json({
        message: 'Database connection error',
        error: error.message
      });
    }

    res.status(500).json({
      message: 'Server error while submitting expense',
      error: error.message,
      type: error.name
    });
  }
});

// Get user's expenses
router.get('/my-expenses', authenticate, async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { employeeId: req.user.id },
      include: [
        {
          association: 'expenseEmployee',
          attributes: ['id', 'name', 'email'],
        },
        {
          association: 'expenseApprovalHistories',
          include: [
            {
              association: 'approvalHistoryUser',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get expenses for approval
router.get('/for-approval', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: {
        currentApproverId: req.user.id,
        status: 'pending',
      },
      include: [
        {
          association: 'expenseEmployee',
          attributes: ['id', 'name', 'email'],
        },
        {
          association: 'expenseApprovalHistories',
          include: [
            {
              association: 'approvalHistoryUser',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching approval expenses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all expenses (Admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { companyId: req.user.companyId },
      include: [
        {
          association: 'expenseEmployee',
          attributes: ['id', 'name', 'email'],
        },
        {
          association: 'expenseApprovalHistories',
          include: [
            {
              association: 'approvalHistoryUser',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching all expenses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to start approval process
async function startApprovalProcess(expense) {
  try {
    const employee = await User.findByPk(expense.employeeId);

    if (!employee) {
      console.error(`❌ Employee with ID ${expense.employeeId} not found`);
      throw new Error(`Employee with ID ${expense.employeeId} not found`);
    }

    const companyId = expense.companyId;

    // Check for applicable approval flow
    const approvalFlow = await ApprovalFlow.findOne({
      where: {
        companyId,
        isActive: true,
        minAmount: { [Op.lte]: expense.convertedAmount },
        maxAmount: {
          [Op.or]: [
            { [Op.gte]: expense.convertedAmount },
            { [Op.is]: null }
          ]
        },
      },
      order: [['minAmount', 'DESC']],
    });

    if (approvalFlow && approvalFlow.steps && approvalFlow.steps.length > 0) {
      // Multi-level approval flow
      const steps = approvalFlow.steps;
      const firstStep = steps[0];

      // Verify approver exists
      const approverExists = await User.findByPk(firstStep.approverId);
      if (approverExists) {
        expense.currentApproverId = firstStep.approverId;
        expense.approvalStep = 1;
        await expense.save();
        console.log(`✅ Assigned to approver: ${approverExists.name}`);
      } else {
        console.warn(`⚠️  Approver ${firstStep.approverId} not found, auto-approving`);
        expense.status = 'approved';
        await expense.save();
      }
    } else if (employee.managerId) {
      // Default manager approval
      const managerExists = await User.findByPk(employee.managerId);
      if (managerExists) {
        expense.currentApproverId = employee.managerId;
        await expense.save();
        console.log(`✅ Assigned to manager: ${managerExists.name}`);
      } else {
        console.warn(`⚠️  Manager ${employee.managerId} not found, auto-approving`);
        expense.status = 'approved';
        await expense.save();
      }
    } else {
      // No approval needed, auto-approve
      expense.status = 'approved';
      await expense.save();
      console.log('✅ Auto-approved (no approval flow configured)');
    }
  } catch (error) {
    console.error('❌ Error in approval process:', error);
    throw error;
  }
}

export default router;