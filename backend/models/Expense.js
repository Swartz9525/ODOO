import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
  },
  convertedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'escalated'),
    defaultValue: 'pending',
    allowNull: false,
  },
  expenseDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  // Foreign keys
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id',
    },
  },
  currentApproverId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  approvalStep: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  indexes: [
    {
      fields: ['employeeId'],
    },
    {
      fields: ['companyId'],
    },
    {
      fields: ['currentApproverId'],
    },
  ],
});

Expense.associate = function (models) {
  Expense.belongsTo(models.User, { foreignKey: 'employeeId', as: 'Employee' });
  Expense.belongsTo(models.Company, { foreignKey: 'companyId', as: 'Company' });
  Expense.hasMany(models.ApprovalHistory, { foreignKey: 'expenseId', as: 'ApprovalHistories' });
  Expense.belongsTo(models.User, { foreignKey: 'currentApproverId', as: 'CurrentApprover' });
};

export default Expense;