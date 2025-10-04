import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
// import { Expense, User, ApprovalHistory, ApprovalRule } from '../models/index.js';
import { convertCurrency } from '../utils/currencyConverter.js';
import ApprovalFlow from '../models/ApprovalFlow.js';
import ApprovalHistory from '../models/ApprovalHistory.js';

const router = express.Router();

// Submit expense
router.post('/', authenticate, authorize('employee', 'manager', 'admin'), async (req, res) => {
  try {
    const { amount, currency, category, description, expenseDate } = req.body;

    // Convert to company currency
    const convertedAmount = await convertCurrency(
      amount,
      currency,
      req.user.Company.currency
    );

    const expense = await Expense.create({
      amount,
      currency,
      convertedAmount,
      category,
      description,
      expenseDate,
      employeeId: req.user.id,
      companyId: req.user.companyId,
    });

    // Start approval process
    await startApprovalProcess(expense);

    const expenseWithDetails = await Expense.findByPk(expense.id, {
      include: [
        {
          model: User,
          as: 'Employee',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.status(201).json(expenseWithDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's expenses
router.get('/my-expenses', authenticate, async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { employeeId: req.user.id },
      include: [
        {
          model: User,
          as: 'Employee',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: ApprovalHistory,
          include: [
            {
              model: User,
              as: 'Approver',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(expenses);
  } catch (error) {
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
          model: User,
          as: 'Employee',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: ApprovalHistory,
          include: [
            {
              model: User,
              as: 'Approver',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(expenses);
  } catch (error) {
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
          model: User,
          as: 'Employee',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: ApprovalHistory,
          include: [
            {
              model: User,
              as: 'Approver',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to start approval process
async function startApprovalProcess(expense) {
  const employee = await User.findByPk(expense.employeeId);
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

  if (approvalFlow) {
    // Multi-level approval flow
    const steps = approvalFlow.steps;
    if (steps.length > 0) {
      const firstStep = steps[0];
      expense.currentApproverId = firstStep.approverId;
      expense.approvalStep = 1;
      await expense.save();
    }
  } else if (employee.isManagerApprover && employee.managerId) {
    // Default manager approval
    expense.currentApproverId = employee.managerId;
    await expense.save();
  }
}

export default router;