import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Company from './Company.js'; // Import Company model

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('employee', 'manager', 'admin'),
    allowNull: false,
    defaultValue: 'employee',
  },
  managerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  isManagerApprover: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id',
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// Define associations
User.associate = function(models) {
  User.belongsTo(models.Company, {
    foreignKey: 'companyId',
    as: 'company',
    onDelete: 'CASCADE',
  });
  
  User.belongsTo(User, {
    as: 'Manager',
    foreignKey: 'managerId',
    onDelete: 'SET NULL',
  });
  
  User.hasMany(User, {
    as: 'TeamMembers',
    foreignKey: 'managerId',
  });
};

export default User;