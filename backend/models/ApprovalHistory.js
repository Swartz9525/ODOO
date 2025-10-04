import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ApprovalHistory = sequelize.define('ApprovalHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  action: {
    type: DataTypes.ENUM('approved', 'rejected', 'escalated'),
    allowNull: false,
  },
  comments: {
    type: DataTypes.TEXT,
  },
  step: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  expenseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Expenses',
      key: 'id',
    },
  },
  approverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
}, {
  indexes: [
    {
      fields: ['expenseId'],
    },
    {
      fields: ['approverId'],
    },
  ],
});

export default ApprovalHistory;