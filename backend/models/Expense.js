import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    validate: {
      len: [3, 3],
    },
  },
  convertedAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
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
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users', // Changed to lowercase to match User model tableName
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Companies', // Keep this as is - check your Company model
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  currentApproverId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users', // Changed to lowercase to match User model tableName
      key: 'id',
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  },
  approvalStep: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
}, {
  timestamps: true,
  tableName: 'Expenses',
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
    {
      fields: ['status'],
    },
    {
      fields: ['expenseDate'],
    },
  ],
});

export default Expense;