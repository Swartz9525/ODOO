import sequelize from '../config/database.js';
import Company from './Company.js';
import User from './User.js';
import Expense from './Expense.js';
import ApprovalFlow from './ApprovalFlow.js';
import ApprovalRule from './ApprovalRule.js';
import ApprovalHistory from './ApprovalHistory.js';

// Define associations
const setupAssociations = () => {
  // User and Company
  User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });

  // User and Expense
  User.hasMany(Expense, { foreignKey: 'employeeId', as: 'expenses' });
  Expense.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });

  // Expense and Company
  Expense.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Company.hasMany(Expense, { foreignKey: 'companyId', as: 'expenses' });

  // Expense and Approver (User)
  Expense.belongsTo(User, {
    foreignKey: 'currentApproverId',
    as: 'currentApprover'
  });

  // Expense and Approval History
  Expense.hasMany(ApprovalHistory, {
    foreignKey: 'expenseId',
    as: 'approvalHistories'
  });
  ApprovalHistory.belongsTo(Expense, {
    foreignKey: 'expenseId',
    as: 'expense'
  });

  // Approval History and User (Approver)
  ApprovalHistory.belongsTo(User, {
    foreignKey: 'approverId',
    as: 'approver'
  });
  User.hasMany(ApprovalHistory, {
    foreignKey: 'approverId',
    as: 'approvalHistories'
  });

  // User self-referential for manager
  User.belongsTo(User, {
    foreignKey: 'managerId',
    as: 'manager'
  });
  User.hasMany(User, {
    foreignKey: 'managerId',
    as: 'teamMembers'
  });

  // ApprovalFlow and Company
  ApprovalFlow.belongsTo(Company, {
    foreignKey: 'companyId',
    as: 'company'
  });
  Company.hasMany(ApprovalFlow, {
    foreignKey: 'companyId',
    as: 'approvalFlows'
  });

  // ApprovalRule and Company
  ApprovalRule.belongsTo(Company, {
    foreignKey: 'companyId',
    as: 'company'
  });
  Company.hasMany(ApprovalRule, {
    foreignKey: 'companyId',
    as: 'approvalRules'
  });

  // ApprovalRule and ApprovalFlow
  ApprovalRule.belongsTo(ApprovalFlow, {
    foreignKey: 'approvalFlowId',
    as: 'approvalFlow'
  });
  ApprovalFlow.hasMany(ApprovalRule, {
    foreignKey: 'approvalFlowId',
    as: 'approvalRules'
  });
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