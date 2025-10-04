import sequelize from '../config/database.js';
import Company from './Company.js';
import User from './User.js';
import Expense from './Expense.js';
import ApprovalFlow from './ApprovalFlow.js';
import ApprovalRule from './ApprovalRule.js';
import ApprovalHistory from './ApprovalHistory.js';

// Define associations
const setupAssociations = () => {
  try {
    console.log('Setting up database associations...');

    // User and Company
    User.belongsTo(Company, {
      foreignKey: 'companyId',
      as: 'userCompany',
      onDelete: 'CASCADE'
    });
    Company.hasMany(User, {
      foreignKey: 'companyId',
      as: 'companyUsers',
      onDelete: 'CASCADE'
    });

    // User and Expense (Employee)
    User.hasMany(Expense, {
      foreignKey: 'employeeId',
      as: 'submittedExpenses',
      onDelete: 'CASCADE'
    });
    Expense.belongsTo(User, {
      foreignKey: 'employeeId',
      as: 'expenseEmployee',
      onDelete: 'CASCADE'
    });

    // Expense and Company
    Expense.belongsTo(Company, {
      foreignKey: 'companyId',
      as: 'expenseCompany',
      onDelete: 'CASCADE'
    });
    Company.hasMany(Expense, {
      foreignKey: 'companyId',
      as: 'companyExpenses',
      onDelete: 'CASCADE'
    });

    // Expense and Current Approver
    Expense.belongsTo(User, {
      foreignKey: 'currentApproverId',
      as: 'currentApproverUser',
      onDelete: 'SET NULL'
    });

    // Expense and Approval History
    Expense.hasMany(ApprovalHistory, {
      foreignKey: 'expenseId',
      as: 'expenseApprovalHistories',
      onDelete: 'CASCADE'
    });
    ApprovalHistory.belongsTo(Expense, {
      foreignKey: 'expenseId',
      as: 'approvalHistoryExpense',
      onDelete: 'CASCADE'
    });

    // Approval History and Approver
    ApprovalHistory.belongsTo(User, {
      foreignKey: 'approverId',
      as: 'approvalHistoryUser',
      onDelete: 'CASCADE'
    });

    // User self-referential for manager
    User.belongsTo(User, {
      foreignKey: 'managerId',
      as: 'userManager',
      onDelete: 'SET NULL'
    });

    // ApprovalFlow and Company
    ApprovalFlow.belongsTo(Company, {
      foreignKey: 'companyId',
      as: 'approvalFlowCompany',
      onDelete: 'CASCADE'
    });
    Company.hasMany(ApprovalFlow, {
      foreignKey: 'companyId',
      as: 'companyApprovalFlows',
      onDelete: 'CASCADE'
    });

    // ApprovalRule and Company
    ApprovalRule.belongsTo(Company, {
      foreignKey: 'companyId',
      as: 'approvalRuleCompany',
      onDelete: 'CASCADE'
    });

    // ApprovalRule and ApprovalFlow
    ApprovalRule.belongsTo(ApprovalFlow, {
      foreignKey: 'approvalFlowId',
      as: 'ruleApprovalFlow',
      onDelete: 'CASCADE'
    });

    // ApprovalRule and Specific Approver
    ApprovalRule.belongsTo(User, {
      foreignKey: 'specificApproverId',
      as: 'ruleSpecificApprover',
      onDelete: 'CASCADE'
    });

    console.log('✅ Database associations setup successfully');
  } catch (error) {
    console.error('❌ Error setting up associations:', error);
    throw error;
  }
};

const models = {
  sequelize,
  Company,
  User,
  Expense,
  ApprovalFlow,
  ApprovalRule,
  ApprovalHistory,
  setupAssociations,
};

export default models;