# Church Professional Directory

A comprehensive professional directory application for church communities with authentication, profile management, approval workflows, and messaging.

## Features

### 🔐 Authentication
- User registration with email/phone and password
- Secure login with JWT tokens
- Role-based access control (Admin, Pastor, Member)
- Email verification system

### 👤 Professional Profiles
- Comprehensive profile creation with:
  - Name, profession, and skills
  - Professional category
  - Work experience
  - Services offered
  - Location and country
  - Profile picture (optional)
- Profile editing capabilities
- Status tracking (Pending, Approved, Rejected)

### ✅ Approval System
- Profiles submitted for pastoral/admin approval
- Pastor and Admin can review pending profiles
- Approve or reject profiles with optional feedback
- Only approved profiles visible in directory

### 📚 Searchable Directory
- Browse all approved professionals
- Real-time search by:
  - Name
  - Profession/Skills
  - Location
  - Category
- Profile cards with quick contact options

### 💬 In-App Messaging
- Direct messaging between users
- Conversation inbox
- Real-time message delivery
- Unread message indicators
- Message read status tracking

### 🛡️ Admin Panel
- **Approvals Dashboard**: Review and manage pending profiles
- **User Management**: View all users, change roles, monitor activity
- Role-based navigation and permissions

## Tech Stack

- **Frontend**: Next.js 15, React 19
- **UI Components**: ShadCN UI, Tailwind CSS
- **Backend**: Convex (real-time database)
- **Authentication**: JWT, bcrypt
- **Form Validation**: React Hook Form, Zod
- **State Management**: Convex React hooks

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Convex account (sign up at https://convex.dev)

### Installation

1. **Clone and install dependencies**:
```bash
pnpm install
```

2. **Set up Convex**:
```bash
npx convex dev
```

This will:
- Create a new Convex project (or link to existing)
- Set up your database schema
- Start the Convex development server
- Generate your `NEXT_PUBLIC_CONVEX_URL`

3. **Configure environment variables**:

Create a `.env.local` file:
```env
NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
JWT_SECRET=your-secret-jwt-key-change-in-production
```

4. **Run the development server**:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

### Users Table
- Email, phone, password hash
- Name, role (admin/pastor/member)
- Email verification status
- Creation timestamp

### Profiles Table
- User reference
- Professional information (name, profession, skills, category)
- Experience and services offered
- Location and country
- Profile picture URL
- Status (pending/approved/rejected)
- Rejection reason (if applicable)

### Messages Table
- Sender and recipient user IDs
- Message content
- Read status
- Creation timestamp

## User Roles

### Member (Default)
- Create and edit profile
- View directory after login
- Send/receive messages
- Wait for profile approval

### Pastor
- All member capabilities
- Review and approve/reject profiles
- Access approval dashboard

### Admin
- All pastor capabilities
- User management (view all users, change roles)
- Full system access

## Key Use Cases

1. **UC1: Register as Professional**
   - User signs up with email and password
   - Creates professional profile
   - Profile enters "Pending" state
   - User gets notification about approval status

2. **UC2: Pastor Approves Profile**
   - Pastor logs in and accesses approval dashboard
   - Reviews pending profiles
   - Approves or rejects with optional feedback
   - User is notified of decision

3. **UC3: Search for Professional**
   - Logged-in user accesses directory
   - Searches by profession, location, or skills
   - Views approved professional profiles
   - Can message professionals directly

4. **UC4: Send Message**
   - User browses directory
   - Clicks on professional profile
   - Sends message through in-app messaging
   - Recipient receives message in inbox

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control
- Server-side validation
- Protected API routes
- Cookie-based session management

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy Convex

```bash
npx convex deploy
```

Update your `.env.local` with the production Convex URL.

## Project Structure

```
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema
│   ├── users.ts           # User queries/mutations
│   ├── profiles.ts        # Profile queries/mutations
│   └── messages.ts        # Message queries/mutations
├── src/
│   ├── app/               # Next.js pages
│   │   ├── api/auth/     # Authentication endpoints
│   │   ├── dashboard/    # User dashboard
│   │   ├── directory/    # Professional directory
│   │   ├── messages/     # Messaging interface
│   │   ├── profile/      # Profile creation/editing
│   │   └── admin/        # Admin panels
│   ├── components/        # React components
│   │   ├── auth/         # Login/register forms
│   │   ├── directory/    # Profile cards
│   │   ├── navigation/   # Navbar
│   │   └── profile/      # Profile form
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities and config
└── public/               # Static assets
```

## Contributing

This is a church community project. Feel free to contribute improvements!

## License

MIT License - feel free to use this for your church or organization.
