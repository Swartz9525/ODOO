import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { Op } from 'sequelize';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import ApprovalHistory from '../models/ApprovalHistory.js';
import ApprovalFlow from '../models/ApprovalFlow.js';
import ApprovalRule from '../models/ApprovalRule.js';

const router = express.Router();

// Approve/Reject expense
router.post('/:expenseId/action', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { action, comments } = req.body;
    const { expenseId } = req.params;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be "approved" or "rejected".' });
    }

    const expense = await Expense.findOne({
      where: {
        id: expenseId,
        currentApproverId: req.user.id,
        status: 'pending',
      },
      include: [
        {
          association: 'expenseEmployee',
        },
      ],
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or not awaiting your approval' });
    }

    // Record approval history
    await ApprovalHistory.create({
      action,
      comments,
      step: expense.approvalStep,
      expenseId: expense.id,
      approverId: req.user.id,
    });

    if (action === 'rejected') {
      expense.status = 'rejected';
      expense.currentApproverId = null;
      await expense.save();
      return res.json({ message: 'Expense rejected successfully' });
    }

    // Handle approval
    await handleApproval(expense, req.user);

    res.json({ message: 'Expense approved successfully' });
  } catch (error) {
    console.error('Error in approval action:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Override approval (Admin only)
router.post('/:expenseId/override', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { action, comments } = req.body;
    const { expenseId } = req.params;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be "approved" or "rejected".' });
    }

    const expense = await Expense.findByPk(expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Record override action
    await ApprovalHistory.create({
      action,
      comments: `Admin override: ${comments}`,
      step: expense.approvalStep,
      expenseId: expense.id,
      approverId: req.user.id,
    });

    expense.status = action;
    expense.currentApproverId = null;
    await expense.save();

    res.json({ message: `Expense ${action} by admin override` });
  } catch (error) {
    console.error('Error in admin override:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to handle approval logic
async function handleApproval(expense, approver) {
  const companyId = expense.companyId;

  // Check conditional approval rules
  const approvalRule = await ApprovalRule.findOne({
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

  if (approvalRule) {
    await handleConditionalApproval(expense, approvalRule, approver);
  } else {
    await handleMultiLevelApproval(expense);
  }
}

async function handleConditionalApproval(expense, rule, approver) {
  const allApprovals = await ApprovalHistory.findAll({
    where: { expenseId: expense.id, action: 'approved' },
  });

  if (rule.ruleType === 'specific_approver') {
    if (approver.id === rule.specificApproverId) {
      expense.status = 'approved';
      expense.currentApproverId = null;
    }
  } else if (rule.ruleType === 'percentage') {
    const totalApprovers = await getTotalApproversForExpense(expense);
    const approvalPercentage = (allApprovals.length / totalApprovers) * 100;

    if (approvalPercentage >= rule.approvalPercentage) {
      expense.status = 'approved';
      expense.currentApproverId = null;
    }
  } else if (rule.ruleType === 'hybrid') {
    const totalApprovers = await getTotalApproversForExpense(expense);
    const approvalPercentage = (allApprovals.length / totalApprovers) * 100;

    if (approvalPercentage >= rule.approvalPercentage ||
      approver.id === rule.specificApproverId) {
      expense.status = 'approved';
      expense.currentApproverId = null;
    }
  }

  await expense.save();
}

async function handleMultiLevelApproval(expense) {
  // Get next approver in sequence
  const approvalFlow = await ApprovalFlow.findOne({
    where: {
      companyId: expense.companyId,
      isActive: true,
      minAmount: { [Op.lte]: expense.convertedAmount },
      maxAmount: {
        [Op.or]: [
          { [Op.gte]: expense.convertedAmount },
          { [Op.is]: null }
        ]
      },
    },
  });

  if (approvalFlow) {
    const steps = approvalFlow.steps;
    const currentStepIndex = expense.approvalStep - 1;

    if (currentStepIndex < steps.length - 1) {
      // Move to next approver
      const nextStep = steps[currentStepIndex + 1];
      expense.currentApproverId = nextStep.approverId;
      expense.approvalStep = expense.approvalStep + 1;
    } else {
      // Final approval
      expense.status = 'approved';
      expense.currentApproverId = null;
    }
  } else {
    // No more approvers - auto approve
    expense.status = 'approved';
    expense.currentApproverId = null;
  }

  await expense.save();
}

async function getTotalApproversForExpense(expense) {
  const approvalFlow = await ApprovalFlow.findOne({
    where: {
      companyId: expense.companyId,
      isActive: true,
      minAmount: { [Op.lte]: expense.convertedAmount },
      maxAmount: {
        [Op.or]: [
          { [Op.gte]: expense.convertedAmount },
          { [Op.is]: null }
        ]
      },
    },
  });

  return approvalFlow ? approvalFlow.steps.length : 1;
}

export default router;