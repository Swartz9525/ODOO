# Expense Management System


https://github.com/user-attachments/assets/d70441eb-fb5d-4ebb-a88c-984c3ae7f04c


A full-stack web application for managing company expenses with approval workflows, user management, and real-time currency conversion.

## Features

### User Management

- User registration and authentication
- Role-based access control (Admin, Manager, Employee)
- Company-based user organization
- Secure JWT-based authentication

### Expense Tracking

- Create and submit expense reports
- Track expense categories and amounts
- Real-time currency conversion
- Expense history and status tracking

### Approval Workflows

- Configurable approval rules based on expense amounts
- Multi-level approval processes
- Approval history tracking
- Automated approval routing

### Company Management

- Multi-company support
- Company-specific user management
- Company-wide expense policies

### Dashboard

- Real-time expense overview
- Approval status monitoring
- User activity tracking
- Financial summaries

## Technology Stack

### Frontend

- React 18 with Vite
- React Router for navigation
- Axios for API communication
- Tailwind CSS for styling
- Context API for state management

### Backend

- Node.js with Express.js
- PostgreSQL database with Sequelize ORM
- JWT authentication
- bcrypt for password hashing
- CORS enabled for cross-origin requests

### Development Tools

- Git for version control
- npm for package management
- ESLint for code linting
- Prettier for code formatting

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd expense-management-system
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../client
npm install
```

4. Set up environment variables:

   - Copy `.env.example` to `.env` in both backend and client directories
   - Configure database connection, JWT secret, and API endpoints

5. Set up the database:

```bash
cd backend
npm run db:migrate
npm run db:seed
```

6. Start the development servers:

```bash
# Backend
cd backend
npm run dev

# Frontend (in a new terminal)
cd client
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### User Management

- `GET /api/users` - Get all users (Admin only)
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Expense Management

- `GET /api/expenses` - Get user expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Approval Workflows

- `GET /api/approvals` - Get approval requests
- `POST /api/approvals` - Submit for approval
- `PUT /api/approvals/:id` - Approve/reject request

### Company Management

- `GET /api/companies` - Get companies
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company

## Project Structure

```
expense-management-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                # Node.js backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── package.json
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.


#link for video
https://drive.google.com/file/d/1SdCq1FaFRxrkgy0L5dkj5P6wzxpJuMEU/view?usp=sharing

