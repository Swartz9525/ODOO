import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import expenseRoutes from './routes/expenses.js';
import approvalRoutes from './routes/approvals.js';
import companyRoutes from './routes/company.js';

// Import models and setup associations
import models from './models/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database associations
models.setupAssociations();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/company', companyRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Expense Management API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - FIXED: Simple middleware without route pattern
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/users',
      'POST /api/users',
      'GET /api/expenses',
      'POST /api/expenses',
      'GET /api/expenses/my-expenses',
      'GET /api/expenses/for-approval',
      'POST /api/approvals/:expenseId/action',
      'GET /api/company',
      'GET /api/company/stats'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Database sync and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models with database - without force to preserve data
    await sequelize.sync({
      force: false,
      alter: false // Disable alter to prevent index conflicts
    });
    console.log('✅ Database synced successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🏠 API Root: http://localhost:${PORT}/`);
    });
  } catch (err) {
    console.error('❌ Database sync failed:', err);
    console.log('💡 Try running: npm run reset-db');
    process.exit(1);
  }
};

startServer();

export default app;