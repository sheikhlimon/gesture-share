# Gesture Share - Development Guide

A revolutionary gesture-based file sharing platform with modern development workflow.

## 🚀 Quick Start

```bash
# Install Node.js using fnm (Fast Node Manager)
fnm use && npm install

# Start development server
npm run dev
```

## 🔧 Development Environment Setup

### Node.js Management with fnm
- **fnm**: Fast Node Manager for version management
- **No hermit**: Use fnm instead of hermit for Node.js
- **Version Pinning**: Projects use specific Node versions
- **Automatic Switching**: fnm automatically switches to project Node version

### Keyboard Rules
- **Minimal Keyboard Usage**: Development primarily through voice and gestures
- **Essential Keyboard Shortcuts**: Only for development tool interactions
- **Voice Commands**: Primary method for development tasks
- **Gesture-Based**: Testing and user interaction without keyboard

### Mise Configuration
```toml
# .mise.toml
[tools]
node = "20"
typescript = "5"
"pnpm" = "latest"

[env]
NODE_ENV = "development"
```

## 🤖 Development Workflow

### Local Development
1. **Environment Setup**: `fnm use` to activate correct Node version
2. **Install Dependencies**: `npm install` for project dependencies
3. **Start Development**: `npm run dev` for hot reload development
4. **Gesture Testing**: Use hand gestures for application testing
5. **Voice Commands**: Voice-activated development tasks

### Voice-Activated Development
- **Code Generation**: Voice commands for component creation
- **Test Execution**: Voice-triggered test suites
- **Build Process**: Voice-activated build and deployment
- **Debug Mode**: Voice-controlled debugging tools

### Development Tools
- **VS Code**: Code editor with voice command extensions
- **Chrome DevTools**: Browser debugging with keyboard shortcuts
- **Terminal**: Essential keyboard-only tool for system operations
- **Git**: Version control with voice and keyboard hybrid

## 📁 Project Structure

```
gesture-share/
├── src/
│   ├── components/          # React components
│   ├── types/              # TypeScript definitions
│   └── main.tsx           # Application entry
├── recipes/               # Development workflows
├── agent.md               # Progress tracking
├── plan.md               # Project roadmap
└── package.json          # Dependencies and scripts
```

## 🛠️ Technology Stack

### Frontend Framework
- **React 19**: Modern React with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool with HMR
- **TailwindCSS**: Utility-first CSS framework

### AI & Gesture Detection
- **@mediapipe/tasks-vision**: MediaPipe vision API
- **TensorFlow.js**: ML inference in browser
- **Hand Landmarker**: Precise hand tracking

### Development Tools
- **fnm**: Fast Node Manager (preferred over hermit)
- **ESLint**: Code quality enforcement
- **TypeScript**: Static type checking
- **Voice Commands**: Development task automation

## 🎮 Input Methods & Accessibility

### Development Input
- **Primary**: Voice commands for most development tasks
- **Secondary**: Minimal keyboard shortcuts for essential tools
- **Tertiary**: Gesture-based testing and validation
- **Fallback**: Keyboard-only when voice/gesture unavailable

### Application Input
- **Primary**: Hand gestures for file sharing
- **Secondary**: Touch interface for mobile
- **Tertiary**: Voice commands for accessibility
- **Fallback**: Keyboard navigation for accessibility

## 🚀 Build & Deployment

### Development Commands
```bash
# Install with fnm
fnm use && npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Type checking
npm run type-check
```

### Deployment Automation
- **GitHub Actions**: Automated CI/CD pipeline
- **Docker**: Containerized deployment
- **Nginx**: Production web server
- **Environment Management**: Development, staging, production

## 📊 Development Metrics

### Code Quality
- **TypeScript**: 100% type coverage
- **ESLint**: Zero linting errors
- **Test Coverage**: >90% for critical components
- **Performance**: <2s initial load time

### Accessibility Standards
- **WCAG 2.1**: AA compliance for accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and announcements
- **Voice Control**: Voice command integration

---

**Built with modern development practices - minimal keyboard usage required**
