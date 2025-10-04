import Company from './company.js';
import User from './User.js';
// import Company from './Company.js';

// Company has many Users
Company.hasMany(User, {
  foreignKey: 'companyId',
  as: 'users'
});

// User belongs to Company
User.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'Company'
});

// Self-referential relationship for manager
User.belongsTo(User, {
  foreignKey: 'managerId',
  as: 'Manager'
});

User.hasMany(User, {
  foreignKey: 'managerId',
  as: 'TeamMembers'
});

export { User, Company };