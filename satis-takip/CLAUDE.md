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
- `npm run prisma-server` - Start Prisma-based backend server
- `npm run prisma-dev` - Start both frontend and Prisma backend concurrently

### Database Commands (Prisma)
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio for database management
- `npm run db:reset` - Reset database with migrations
- `npm run db:deploy` - Deploy migrations to production

### Full Stack Development
Always use `npm run dev` for local development as it starts both frontend (Vite on port 5173) and backend (Express on port 5000) simultaneously using concurrently.

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + Vite + Ant Design 5 + TailwindCSS
- **Backend**: Node.js + Express.js with dual database support
  - **Primary**: MongoDB + Mongoose (active)
  - **Secondary**: PostgreSQL + Prisma (in development)
- **Authentication**: JWT with 2FA support (Speakeasy + backup codes)
- **3D Visualization**: Three.js with React Three Fiber
- **State Management**: React Context API (AuthContext, ThemeContext)
- **File Storage**: Local uploads with Cloudinary integration
- **Email Service**: Nodemailer with automated notifications

### Project Structure
```
satis-takip/
├── backend/                 # Node.js/Express backend
│   ├── controllers/         # API route handlers (includes Prisma versions)
│   ├── models/             # Mongoose database models
│   ├── routes/             # Express route definitions (includes Prisma routes)
│   ├── middleware/         # Authentication & error handling
│   ├── config/             # Database & email configuration
│   ├── services/           # Email and external service integrations
│   ├── utils/              # Utility functions (formatters, helpers)
│   ├── uploads/            # File upload storage directory
│   ├── server.js           # MongoDB-based server entry point
│   └── serverPrisma.js     # PostgreSQL/Prisma server entry point
├── prisma/                 # Database schema and migrations
│   └── schema.prisma       # Prisma schema definition
├── src/                    # React frontend
│   ├── components/         # Reusable UI components (3D, forms, modals)
│   ├── pages/              # Route-specific page components
│   ├── context/            # React Context providers (Auth, Theme)
│   ├── services/           # API service functions
│   ├── utils/              # Frontend utility functions
│   └── App.jsx             # Main application component
└── public/                 # Static assets and PWA files
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
- `paymentOverdueNotification`: Receive overdue payment notifications

**Authentication Flow**:
- JWT-based authentication with automatic token refresh handling
- 2FA support using TOTP (Time-based One-Time Password) with backup codes
- Automatic logout on token expiration with user-friendly notifications
- Admin users automatically receive all permissions

### API Architecture
RESTful API with endpoints grouped by domain:
- `/api/auth` - Authentication and user management
  - `/api/auth/2fa` - Two-factor authentication endpoints
- `/api/projects` - Project CRUD operations
- `/api/blocks` - Block management and 3D visualization
- `/api/customers` - Customer management
- `/api/customer-notes` - Customer communication notes
- `/api/sales` - Sales transaction handling
- `/api/payments` - Payment processing and tracking
- `/api/reports` - Financial reporting
- `/api/notifications` - System notifications
- `/api/tasks` - Task management
- `/api/upload` - File upload handling
- `/api/logs` - Activity logging for audit trails
- `/api/references` - Reference management for blocks

**Important Backend Features**:
- Automated payment status updates every hour via cron jobs
- Automatic overdue payment detection and notification creation
- File upload handling with local storage in `backend/uploads/`
- Email service integration for payment reminders

### Frontend Architecture
- **Router**: React Router v7 with permission-based route protection
- **UI Framework**: Ant Design 5 with dark/light theme support
- **3D Visualization**: Three.js with React Three Fiber for building block visualization
  - Interactive 3D building editor with drag-and-drop controls
  - Camera controls and grid system for precise positioning
  - Real-time block dimension editing (height, width, depth)
- **State Management**: Context API for authentication and theme state
- **API Layer**: Axios with interceptors for automatic token management and error handling
- **Components**: Modular component architecture with reusable UI elements
  - `PermissionRoute` and `PermissionGate` for access control
  - `BuildingCanvas` for 3D project visualization
  - `NotificationCenter` for system alerts

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
- Backend runs automated payment status updates every hour via `setInterval`
- Frontend uses Vite proxy for API calls during development (port 5173 → 5000)
- Turkish language interface with localized date/currency formatting
- Responsive design optimized for desktop and mobile
- Error handling with user-friendly messages in Turkish
- Dual database architecture: MongoDB (active) + PostgreSQL/Prisma (development)

### File Upload & Media
- **Local Storage**: Files stored in `backend/uploads/` directory
- **Cloudinary Integration**: Available but local storage preferred
- **File Types**: Support for images, documents, and customer files
- **API Endpoint**: `/api/upload` for file upload operations
- **Static Serving**: Files served via `/uploads` route

### Email System
- **Nodemailer Integration**: Automated email notifications
- **Email Configuration**: Uses environment variables for SMTP settings
- **Notification Types**: Payment reminders, overdue notices, system alerts
- **Service File**: `backend/services/emailService.js` handles email operations

## Working with this Codebase

### Development Workflow
1. **Always run `npm run dev`** for full-stack development (starts both frontend and backend)
2. **For Prisma development**: Use `npm run prisma-dev` instead
3. **Database migrations**: Run `npm run db:migrate` after schema changes
4. **Linting**: Run `npm run lint` before committing changes

### Code Conventions
1. **Language**: Use Turkish for all user-facing messages and UI text
2. **Components**: Follow Ant Design patterns and maintain design consistency
3. **Permissions**: Always wrap new features with appropriate permission checks
4. **API Responses**: Include proper error handling with Turkish error messages
5. **File Organization**: Keep related controllers/routes/models grouped by feature

### Important Considerations
1. **Payment Logic**: Always consider payment status implications when modifying sales/payment operations
2. **3D Visualization**: Test block modifications in the 3D canvas for proper rendering
3. **Authentication**: Handle token expiration gracefully with user notifications
4. **Database**: Consider both MongoDB and Prisma implementations when modifying data models
5. **File Uploads**: Prefer local storage in `backend/uploads/` over external services

### Server Architecture Notes
- **MongoDB Server**: `backend/server.js` (primary, port 5000)
- **Prisma Server**: `backend/serverPrisma.js` (development, port 5000)
- **Process Management**: Both servers include automatic payment status updates and error handling
- **File Serving**: Static files served from `/uploads` endpoint