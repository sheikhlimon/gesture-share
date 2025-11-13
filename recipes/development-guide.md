# Gesture Share - Development Guide 🖐️

A revolutionary gesture-based file sharing platform with modern development workflow and comprehensive gesture recognition system.

## 🚀 Quick Start

```bash
# Install Node.js using mise (recommended)
mise install && npm install

# Start development server
npm run dev

# Or use fnm
fnm use && npm install
npm run dev
```

## 🔧 Development Environment Setup

### Node.js Management
- **mise**: Modern development environment manager (recommended)
- **fnm**: Fast Node Manager for version management
- **Version Pinning**: Projects use specific Node versions
- **Automatic Switching**: Tools automatically switch to project Node version

### Development Tools Setup
```toml
# .mise.toml
[tools]
node = "20"
typescript = "5"
"npm" = "latest"

[env]
NODE_ENV = "development"
```

### Keyboard Rules & Accessibility
- **Minimal Keyboard Usage**: Development primarily through voice and gestures
- **Essential Keyboard Shortcuts**: Only for development tool interactions
- **Voice Commands**: Primary method for development tasks
- **Gesture-Based**: Testing and user interaction without keyboard
- **Accessibility First**: Full keyboard navigation and screen reader support

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
- **@mediapipe/tasks-vision**: MediaPipe vision API for hand tracking
- **Enhanced Gesture Recognition**: Point Up, Fist, Peace Sign detection
- **Real-time Hand Tracking**: PIP joint-based finger detection with improved accuracy
- **Smart Cooldown System**: 3-second cooldown prevents accidental triggers
- **Gesture Flow Control**: QR display, file selection, and sending
- **State Management**: Persistent file selection and connection state
- **Component Optimization**: React.memo and useCallback for performance

### Networking & File Transfer
- **PeerJS**: WebRTC-based peer-to-peer connections
- **P2P File Transfer**: Direct device-to-device file sharing
- **QR Code Generation**: Dynamic connection QR codes
- **Connection Management**: Real-time connection status tracking
- **File Preview**: Thumbnail generation for images and file type indicators

### Development Tools
- **mise**: Modern development environment manager (recommended)
- **fnm**: Fast Node Manager for version management
- **ESLint**: Code quality enforcement with TypeScript rules
- **TypeScript**: Static type checking with strict mode
- **Voice Commands**: Development task automation
- **Git**: Version control with automated commit hooks

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
- **GitHub Actions**: Simplified CI/CD for static builds
- **Static Hosting**: Deploy to Vercel, Netlify, or GitHub Pages
- **Build Verification**: Automated linting, type checking, and build testing
- **Environment Management**: Development and production (no staging)

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
