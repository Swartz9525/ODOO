import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ApprovalRule = sequelize.define('ApprovalRule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ruleType: {
    type: DataTypes.ENUM('percentage', 'specific_approver', 'hybrid'),
    allowNull: false,
  },
  approvalPercentage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 100,
    },
  },
  specificApproverId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  conditions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  minAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  maxAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  approvalFlowId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ApprovalFlows',
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
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'approval_rules',
});

export default ApprovalRule;