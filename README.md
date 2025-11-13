# Gesture Share

A revolutionary gesture-based file sharing platform that enables seamless file transfer between desktop and mobile devices using intuitive hand gestures.

## 🚀 Quick Start

```bash
# Install dependencies (requires fnm for Node.js version management)
fnm use && npm install

# Start development server
npm run dev
```

## 📁 Project Structure

```
gesture-share/
├── src/
│   ├── components/          # React components
│   │   ├── GestureDetector.tsx    # Hand gesture detection and recognition
│   │   ├── DesktopView.tsx        # Desktop interface with webcam feed
│   │   ├── MobileView.tsx         # Mobile receiving interface
│   │   ├── QRDisplay.tsx          # QR code generation and display
│   │   └── FileSelector.tsx       # File selection interface
│   ├── types/
│   │   └── gesture.ts             # TypeScript type definitions
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles and animations
├── public/
│   └── index.html                 # HTML template
├── recipes/                       # AI agent recipes for development
├── agent.md                       # Agent progress tracking
└── plan.md                       # Comprehensive project plan
```

## 🛠️ Technology Stack

### Frontend Framework
- **React 19**: Modern React with concurrent features and optimizations
- **TypeScript**: Type-safe development with comprehensive type checking
- **Vite**: Fast development and build tool with hot module replacement
- **TailwindCSS**: Utility-first CSS framework for rapid styling

### AI & Gesture Detection
- **@mediapipe/tasks-vision**: Latest MediaPipe vision tasks API
- **TensorFlow.js**: Machine learning inference in the browser
- **Hand Landmarker**: Precise hand landmark detection and tracking
- **Custom Gesture Recognition**: Tailored gesture detection algorithms

### File Sharing & Communication
- **PeerJS**: Simplified WebRTC peer-to-peer connections
- **WebRTC**: Real-time communication between browsers
- **DataChannel API**: Direct file transfer between connected peers
- **Network IP Detection**: Automatic network IP detection for cross-device connectivity

### Device Pairing & QR
- **QRCode.js**: QR code generation for device pairing
- **Modern QR Modal**: Clean, white-themed modal with rounded corners

### Development Tools
- **ESLint**: Code quality and consistency enforcement
- **TypeScript**: Static type checking and enhanced IDE support
- **Node.js**: Managed via fnm

## 🎮 Features

### Gesture Recognition
- **Peace Sign (✌️)**: Display QR code for device pairing
- **Fist (✊)**: Open file selector menu
- **Thumbs Up (👍)**: Send selected files to connected device
- **Real-time Detection**: Continuous hand tracking at 30+ FPS
- **Visual Feedback**: Real-time gesture visualization and confidence indicators

### File Transfer
- **Direct P2P Transfer**: No intermediate servers or cloud storage
- **End-to-End Encryption**: All transfers encrypted via WebRTC
- **Progress Tracking**: Real-time transfer progress and speed metrics
- **Multiple File Support**: Batch file selection and transfer
- **Automatic Download**: Files automatically saved on mobile devices

### Device Pairing
- **QR Code Generation**: Dynamic QR code with peer ID for mobile pairing
- **Auto-close Modal**: QR modal automatically closes when connected
- **Network IP Detection**: Automatic detection of actual network IP
- **Cross-Device Compatibility**: Works between desktop and mobile devices

### User Interface
- **Desktop View**: Webcam feed with gesture overlay and controls
- **Mobile View**: QR scanner and file reception interface
- **Manual Override**: User-controlled desktop/mobile view switching
- **Modern Design**: Clean, responsive interface with TailwindCSS
- **Error Handling**: Comprehensive error recovery and user notifications

## 📖 How to Use

### Desktop Setup
1. Open the application on desktop
2. Allow camera access for gesture detection
3. Make a **peace sign** to display the QR code
4. Wait for mobile device to connect

### Mobile Setup
1. Open the application on mobile device
2. Scan the QR code or manually enter the peer ID
3. Wait for connection to be established

### File Transfer
1. On desktop, make a **fist** gesture to open file selector
2. Select files to send (images, documents, etc.)
3. Make a **thumbs up** gesture to send the files
4. Mobile device will automatically receive and save the files

## 🔧 Development Commands

```bash
# Install dependencies
fnm use && npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🔒 Security & Privacy

- **End-to-End Encryption**: All file transfers encrypted via WebRTC
- **No Server Storage**: Files never stored on intermediate servers
- **Temporary Peer IDs**: Auto-generated disposable connection identifiers
- **Local Processing**: All gesture processing happens client-side
- **Privacy First**: No data collection or analytics tracking

## 📱 Browser Compatibility

- **Chrome**: Full support with latest features
- **Firefox**: Full support with WebRTC capabilities
- **Safari**: Full support on iOS and macOS
- **Edge**: Full support with Chromium engine

## 🚀 Performance

- **Optimized Resolution**: 640x480 video for better performance
- **Model Optimization**: Efficient MediaPipe configuration
- **Memory Management**: Proper cleanup and garbage collection
- **Connection Reuse**: Reuse WebRTC connections for multiple transfers
- **Fast Loading**: <2 seconds initial load time

## 🤝 Contributing

This project is built with cutting-edge web technologies and AI-powered gesture recognition. For development setup and AI agent configuration, see `recipes/development-guide.md`.

## 📄 License

MIT License - feel free to use this project for your own applications.

---

*Built with ❤️ using React, TypeScript, and MediaPipe for an intuitive file sharing experience.*
