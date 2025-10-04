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
    validate: {
      isValidSteps(value) {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('Steps must be a non-empty array');
        }
        for (const step of value) {
          if (!step.approverId || !step.name) {
            throw new Error('Each step must have approverId and name');
          }
        }
      }
    }
  },
  minAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  maxAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
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
}, {
  tableName: 'approval_flows',
});

export default ApprovalFlow;