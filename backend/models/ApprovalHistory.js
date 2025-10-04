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
  tableName: 'approval_histories',
  // Remove indexes to prevent conflicts during sync
  indexes: [
    // Let Sequelize handle indexes automatically
  ],
});

export default ApprovalHistory;