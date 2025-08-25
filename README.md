# XLSmart - AI-Powered HR Analytics Platform

XLSmart is a comprehensive Human Resources analytics platform that leverages artificial intelligence to standardize roles, assess employee skills, and provide workforce insights. Built with modern web technologies and designed for scalability.

## 🚀 Features

### Core Capabilities
- **🤖 AI Role Standardization** - Automatically map job titles to standardized roles using advanced LLM
- **📊 Employee Analytics** - Comprehensive workforce analytics with real-time insights
- **🎯 Skills Assessment** - AI-powered skill gap analysis and career progression planning
- **📋 Job Description Generator** - AI-generated job descriptions with approval workflows
- **📈 Progress Tracking** - Real-time upload and processing progress monitoring
- **🔒 Enterprise Security** - Row-level security with role-based access control

### Upload & Processing
- **Multi-Format Support** - Excel (.xlsx, .xls), CSV, and JSON file processing
- **Bulk Operations** - Handle thousands of employee records efficiently
- **Dual Upload Modes** - Upload-only for pre-assigned roles, or upload with AI assignment
- **Validation Engine** - Comprehensive data validation with detailed error reporting

## 📚 Documentation

### Complete Documentation Suite
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Comprehensive database schema with relationships
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture overview
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Development workflows and examples  
- **[REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md)** - Refactoring strategy and improvements
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines and standards

### 🏗️ **Modular Architecture**
- **Centralized Libraries** (`src/lib/`) - Types, constants, validations, API client
- **Custom Hooks** (`src/hooks/`) - Reusable logic for progress polling, file processing
- **Common Components** (`src/components/common/`) - Shared UI components
- **Feature Components** (`src/components/[feature]/`) - Domain-specific components

### 🔧 **Key Improvements**
- **Type Safety**: Centralized TypeScript definitions
- **Validation**: Zod schemas for runtime type checking
- **API Client**: Unified, type-safe API interface
- **Error Handling**: Consistent error management
- **Code Reuse**: Extracted common patterns into reusable hooks

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with strict checking
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS with custom design system
- **shadcn/ui** - High-quality, accessible component library
- **React Router** - Client-side routing and navigation
- **React Query** - Server state management and caching
- **Zod** - Runtime type validation

### Backend & Database
- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Advanced relational database
- **Row Level Security** - Database-level security policies
- **Edge Functions** - Serverless functions for AI processing
- **Real-time subscriptions** - Live data updates

### AI & Processing
- **LiteLLM** - Multi-provider LLM integration
- **OpenAI GPT-4** - Primary AI model for analysis
- **Bulk processing** - Batch operations for large datasets
- **Progress tracking** - Real-time progress monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account for backend services

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd xlsmart

# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env and configure your Supabase credentials

# Start development server
npm run dev
```

### Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── common/            # Reusable application components
│   ├── upload/            # File upload specific components
│   ├── workforce/         # Workforce analytics components
│   └── [feature]/         # Feature-specific components
├── pages/                 # Route-level components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── types.ts          # Centralized type definitions
│   ├── constants.ts      # Application constants
│   ├── validations.ts    # Zod validation schemas
│   ├── api.ts           # Type-safe API client
│   └── utils.ts         # Utility functions
├── contexts/              # React context providers
└── integrations/          # External service integrations
```

## 📊 Key Features

### Employee Management
- **Bulk Upload**: Process thousands of employee records from Excel/CSV files
- **AI Role Assignment**: Automatically suggest standardized roles for employees
- **Skills Tracking**: Comprehensive skills assessment and gap analysis
- **Career Planning**: AI-powered career progression recommendations

### Role Standardization
- **Intelligent Mapping**: AI-powered mapping of job titles to standard roles
- **Confidence Scoring**: Quality metrics for mapping accuracy
- **Manual Review**: Human oversight for low-confidence mappings
- **Version Control**: Track changes and maintain role definition history

### Analytics & Reporting
- **Workforce Insights**: Department and role distribution analytics
- **Skills Analytics**: Skills gap analysis across the organization
- **Performance Metrics**: KPI tracking and trend analysis
- **Real-time Dashboards**: Live data visualization and reporting

### AI Integration
- **Multi-Provider Support**: OpenAI, Anthropic, and others via LiteLLM
- **Context-Aware Analysis**: Intelligent processing based on business context
- **Batch Processing**: Efficient handling of large datasets
- **Progress Monitoring**: Real-time status updates for long-running operations

## 🔒 Security

### Authentication & Authorization
- **JWT-based Auth**: Secure authentication via Supabase
- **Role-based Access**: Granular permissions (Super Admin, HR Manager, Candidates)
- **Row Level Security**: Database-level access control policies

### Data Protection
- **Encrypted Transit**: All data encrypted in transit (HTTPS)
- **Secure Storage**: Files stored securely in Supabase Storage
- **Input Validation**: Comprehensive validation and sanitization
- **Audit Trails**: Complete tracking of data changes and user actions

## 🚀 Deployment

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Production
The application can be deployed to any modern hosting platform:
- **Vercel** (Recommended)
- **Netlify**
- **AWS Amplify**
- **Digital Ocean App Platform**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:
- Code style and conventions
- Development workflow
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Documentation**: Complete architecture and development guides in `/docs`
- **Issues**: Report bugs and request features on GitHub Issues
- **Discussions**: Join the community discussions for questions and ideas

---

Built with ❤️ using React, TypeScript, and Supabase