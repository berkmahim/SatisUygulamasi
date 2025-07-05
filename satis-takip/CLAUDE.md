# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend Development
- `npm start` - Start Vite development server (frontend only)
- `npm run build` - Build frontend for production
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

### Backend Development
- `npm run server` - Start Express.js backend server on port 5000
- `npm run dev` - Start both frontend and backend concurrently (recommended for development)

### Full Stack Development
Always use `npm run dev` for local development as it starts both frontend (Vite on port 5173) and backend (Express on port 5000) simultaneously using concurrently.

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + Vite + Ant Design 5 + TailwindCSS
- **Backend**: Node.js + Express.js + MongoDB + Mongoose
- **Authentication**: JWT with 2FA support (Speakeasy)
- **3D Visualization**: Three.js with React Three Fiber
- **State Management**: React Context API (AuthContext, ThemeContext)

### Project Structure
```
satis-takip/
├── backend/                 # Node.js/Express backend
│   ├── controllers/         # API route handlers
│   ├── models/             # Mongoose database models
│   ├── routes/             # Express route definitions
│   ├── middleware/         # Authentication & error handling
│   ├── config/             # Database & email configuration
│   └── server.js           # Express server entry point
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/              # Route-specific page components
│   ├── context/            # React Context providers
│   ├── services/           # API service functions
│   └── App.jsx             # Main application component
└── public/                 # Static assets
```

### Core Business Domain
This is a **construction project sales management system** (Satış Takip Sistemi) for Turkish construction companies. Key entities:
- **Project**: Construction projects with 3D building visualization
- **Block**: Individual buildings within projects (with height, width, depth)
- **Customer**: Client information and communication history
- **Sale**: Property sales with installment payment plans
- **Payment**: Individual installment payments with status tracking
- **Task**: Work assignments and notifications

### Database Models
- **Project**: Construction projects with basic info
- **Block**: Buildings with 3D dimensions and unit management
- **Customer**: Client profiles with contact information
- **Sale**: Sales records linking customers to blocks with payment plans
- **Payment**: Individual installment payments with due dates and status
- **User**: System users with role-based permissions
- **Task**: Work assignments and notifications
- **Log**: Activity logging for audit trails

### Permission System
Role-based access control with permissions:
- `projectManagement`: Create/edit projects and blocks
- `customerManagement`: Manage customer information
- `salesManagement`: Handle sales transactions
- `paymentManagement`: Process payments and installments
- `reportManagement`: Access financial reports
- `userManagement`: Manage system users (admin only)

### API Architecture
RESTful API with endpoints grouped by domain:
- `/api/auth` - Authentication and user management
- `/api/projects` - Project CRUD operations
- `/api/blocks` - Block management and 3D visualization
- `/api/customers` - Customer management
- `/api/sales` - Sales transaction handling
- `/api/payments` - Payment processing and tracking
- `/api/reports` - Financial reporting
- `/api/notifications` - System notifications
- `/api/tasks` - Task management

### Frontend Architecture
- **Router**: React Router v7 with permission-based route protection
- **UI Framework**: Ant Design 5 with dark/light theme support
- **3D Visualization**: Three.js for building block visualization with controls
- **State Management**: Context API for authentication and theme state
- **API Layer**: Axios with interceptors for token management

### Key Features
- 3D building visualization with resizable blocks
- Multi-installment payment plans with automatic status updates
- Role-based access control with 2FA authentication
- Real-time payment tracking and overdue detection
- Turkish Lira currency formatting throughout
- Email notifications for payment reminders
- Excel export functionality for reports
- Comprehensive audit logging

### Development Notes
- Backend runs automated payment status updates every hour
- Frontend uses Vite proxy for API calls during development
- Turkish language interface with localized date/currency formatting
- Responsive design optimized for desktop and mobile
- Error handling with user-friendly messages in Turkish

### File Upload & Media
- Uses Cloudinary for file storage
- Supports document uploads for customer files
- Image optimization for project photos

### Email System
- Nodemailer integration for automated notifications
- Payment reminders and overdue notices
- Configurable email templates

When working with this codebase:
1. Always run `npm run dev` for full-stack development
2. Use Turkish language for user-facing messages
3. Follow existing permission patterns when adding new features
4. Maintain consistency with Ant Design components
5. Consider payment status implications when modifying sales/payment logic