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
  conditions: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  approvalFlowId: {
    type: DataTypes.UUID,
    allowNull: false,
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
});

export default ApprovalRule;