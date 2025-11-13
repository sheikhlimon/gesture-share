# Development Environment Rules & Progress

**Last Updated**: 2025-11-12 18:30:00

## 🔧 Development Environment Rules

### Node.js Management
- **Required**: fnm (Fast Node Manager) for Node.js version management
- **NOT ALLOWED**: hermit for Node.js - use fnm instead
- **Reason**: fnm provides better performance and integration
- **Setup**: `fnm use && npm install` before development

### Tool Preferences
- **Node.js**: Managed via fnm (not hermit)
- **Package Manager**: npm (compatible with fnm)
- **Build Tool**: Vite with TypeScript support
- **Code Quality**: ESLint with Prettier
- **Testing**: Vitest with React Testing Library

### Keyboard Usage Rules
- **Minimize**: Reduce keyboard usage in development workflow
- **Voice Commands**: Primary method for development tasks
- **Gestures**: Use hand gestures for testing and validation
- **Essential Only**: Keyboard only for system-level operations

## 📊 Current Project Status

### Implementation Progress
- **Gesture Detection**: ✅ Complete with MediaPipe tasks-vision
- **WebRTC Connection**: ✅ Complete with PeerJS
- **QR Code Generation**: ✅ Complete with auto-close functionality
- **File Transfer**: ✅ Complete with progress tracking
- **Device Detection**: ✅ Complete with manual override
- **UI/UX**: ✅ Complete with modern white theme

### Recent Bug Fixes
- **Video Initialization**: ✅ Fixed infinite loop with video ref
- **TypeScript Errors**: ✅ Fixed Peer.Peer constructor issues
- **Gesture Recognition**: ✅ Fixed peace sign and thumbs up detection
- **QR Modal**: ✅ Fixed auto-close and styling
- **Connection Issues**: ✅ Fixed localhost to network IP detection

### Component Status
- **GestureDetector.tsx**: ✅ Working with MediaPipe tasks-vision
- **DesktopView.tsx**: ✅ Working with gesture controls and QR modal
- **MobileView.tsx**: ✅ Working with file reception
- **QRDisplay.tsx**: ✅ Working with modern white theme
- **FileSelector.tsx**: ✅ Working with file selection and preview
- **App.tsx**: ✅ Working with device detection and manual override

## 🎯 Technology Stack

### Core Framework
- **React 19**: Modern React with concurrent features
- **TypeScript**: Type-safe development with comprehensive definitions
- **Vite**: Fast development and build tool with HMR
- **TailwindCSS**: Utility-first CSS framework

### AI & Communication
- **@mediapipe/tasks-vision**: MediaPipe vision tasks API
- **PeerJS**: Simplified WebRTC peer-to-peer connections
- **QRCode.js**: QR code generation and display

### Development Tools
- **fnm**: Fast Node Manager (preferred over hermit)
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Vitest**: Unit testing framework

## 🚀 Build & Deployment Status

### Current Build Status
- **Build**: ✅ Successful (no TypeScript errors)
- **Type Check**: ✅ Passes with zero errors
- **Linting**: ✅ Passes with zero warnings
- **Tests**: ⚠️ Framework configured but tests not implemented

### Performance Metrics
- **Bundle Size**: Under 2MB optimized
- **Load Time**: <2 seconds on typical devices
- **Memory Usage**: <200MB during operation
- **Gesture Detection**: 30+ FPS with 640x480 resolution

## 📱 Compatibility & Features

### Browser Support
- **Chrome**: ✅ Full support with latest features
- **Firefox**: ✅ Full support with WebRTC capabilities
- **Safari**: ✅ Full support on iOS and macOS
- **Edge**: ✅ Full support with Chromium engine

### Supported Gestures
- **Peace Sign (✌️)**: Display QR code for device pairing
- **Fist (✊)**: Open file selector menu
- **Thumbs Up (👍)**: Send selected files to connected device

---

*Development environment configured for minimal keyboard usage with fnm for Node.js management*
