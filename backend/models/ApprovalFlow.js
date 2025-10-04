import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ApprovalFlow = sequelize.define('ApprovalFlow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  steps: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  minAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  maxAmount: {
    type: DataTypes.DECIMAL(10, 2),
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id',
    },
  },
});

export default ApprovalFlow;