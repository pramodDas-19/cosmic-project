# Cosmic Solutions Frontend

A modern React-based frontend for the Cosmic Solutions Site Engineer & CCTV Management System.

## 🚀 Features

- **Real-time Notifications** - Socket.io integration for live updates
- **Role-based Access Control** - Super Admin, Manager, and Technician roles
- **Project Management** - Create, track, and manage projects
- **Task Management** - Assign and track tasks with real-time updates
- **File Management** - Upload and manage project files
- **Reporting System** - Generate comprehensive reports
- **Responsive Design** - Mobile-first approach with Tailwind CSS

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io** - Real-time communication
- **React Router** - Client-side routing
- **React Hook Form** - Form handling
- **Lucide React** - Beautiful icons

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-new-repo-url>
   cd cosmic-solutions-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🌍 Environment Variables

Create a `.env.local` file with:

```env
VITE_API_BASE_URL=https://cosmicproject-backend-1.onrender.com/api
VITE_SOCKET_URL=https://cosmicproject-backend-1.onrender.com
VITE_FILE_BASE_URL=https://cosmicproject-backend-1.onrender.com
```

## 🚀 Deployment

This project is optimized for **Vercel** deployment:

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on every push

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── dashboard/      # Dashboard-specific components
│   └── ui/            # Base UI components
├── contexts/           # React contexts (Auth, Socket, etc.)
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── utils/              # Utility functions
└── config/             # Configuration files
```

## 🔧 Development

- **Development server**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Lint**: `npm run lint`
- **Type check**: `npm run typecheck`

## 📱 Features by Role

### Super Admin
- Manage all projects and users
- Generate comprehensive reports
- System-wide settings and configurations

### Manager
- Manage assigned projects
- Assign tasks to technicians
- Track project progress

### Technician
- View assigned tasks
- Update task status
- Submit reports

## 🔗 API Integration

The frontend connects to a Node.js/Express backend with:
- **RESTful API** for CRUD operations
- **Socket.io** for real-time updates
- **JWT Authentication** for secure access

## 🎨 UI/UX

- **Modern Design** - Clean and professional interface
- **Mobile Responsive** - Works on all device sizes
- **Dark/Light Mode** - Theme support
- **Accessibility** - WCAG compliant components

## 📄 License

This project is proprietary software for Cosmic Solutions.

---

**Built with ❤️ for Cosmic Solutions** 