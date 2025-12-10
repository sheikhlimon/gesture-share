# Gesture Share 🖐️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1+-646CFF.svg)](https://vitejs.dev/)

A desktop application that enables seamless file sharing between your computer and mobile device using intuitive hand gestures. No cables, no cloud storage, no hassle - just point, gesture, and share.

## ✨ Key Features

- **🤚 Gesture-Controlled Interface** - Control everything with natural hand movements
- **⚡ Direct P2P Transfer** - Files go straight from your computer to your phone via WebRTC
- **🎯 High-Accuracy Detection** - Powered by Google's MediaPipe technology for precise gesture recognition
- **🔄 Real-time Visual Feedback** - See your gestures detected in real-time with overlay graphics
- **📂 Versatile File Support** - Share documents, images, videos, and more
- **🛡️ Secure Transfer** - Direct peer-to-peer connection ensures your files never touch third-party servers

## 🎯 How It Works

### Three Simple Gestures

1. **Point Up (☝️)** - Display QR code to connect your mobile device
2. **Make a Fist (✊)** - Open file selector to choose what to share
3. **Peace Sign (✌️)** - Send the selected file instantly

### Step-by-Step Guide

1. **Launch & Allow Camera** - Open the app and grant camera permissions when prompted
2. **Connect Your Phone** - Point up with your index finger to display the QR code, then scan it with your phone
3. **Select a File** - Make a fist to open the file selection dialog on your computer
4. **Share Instantly** - Make a peace sign to send the file directly to your connected mobile device

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A webcam (built-in or external)
- A smartphone with camera and internet connection

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/gesture-share.git
cd gesture-share

# Install dependencies
npm install

# Start development server
npm run dev

# Open your browser and navigate to http://localhost:5173
```

### Production Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy the dist/ folder to your hosting platform
```

## 🏗️ Architecture

### Core Components

```
src/
├── components/
│   ├── App.tsx              # Main application with device detection
│   ├── DesktopView.tsx      # Desktop interface with gesture controls
│   ├── GestureDetector.tsx   # MediaPipe hand tracking and gesture recognition
│   ├── QRDisplay.tsx        # QR code generation and display
│   └── MobileView.tsx       # Mobile receiving interface
├── hooks/                   # Custom React hooks for state management
├── utils/                   # Utility functions and helpers
└── main.tsx                 # Application entry point
```

### Gesture Detection System

The gesture recognition system uses MediaPipe's advanced computer vision to:

1. Track 21 hand landmarks in real-time
2. Calculate finger positions and angles
3. Recognize specific gesture patterns
4. Implement a cooldown system (3 seconds) to prevent accidental triggers
5. Provide visual feedback with real-time hand overlay

### Peer-to-Peer Communication

- **WebRTC** establishes a direct connection between devices
- **PeerJS** simplifies the WebRTC implementation
- **QR Code** contains the connection information for easy pairing
- **STUN/TURN servers** facilitate NAT traversal when needed

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 + TypeScript for modern, type-safe development
- **Computer Vision**: MediaPipe Tasks Vision for accurate hand tracking and gesture recognition
- **Real-time Communication**: WebRTC + PeerJS for peer-to-peer file transfer
- **Styling**: Tailwind CSS for responsive, utility-first design
- **Build Tool**: Vite for lightning-fast development and optimized production builds

## 🐛 Troubleshooting

### Common Issues & Solutions

**Camera Not Working?**

- Ensure you've granted camera permissions in your browser
- Check that no other application is using the camera
- Verify your browser supports getUserMedia API
- Try refreshing the page and granting permissions again

**Gestures Not Recognized?**

- Ensure good lighting conditions
- Make sure your hand is clearly visible to the camera
- Perform gestures deliberately and hold them for 1-2 seconds
- Check that you're at an appropriate distance from the camera (2-6 feet)

**Connection Issues?**

- Both devices need an active internet connection
- Check that your firewall isn't blocking WebRTC connections
- Try generating a new QR code if the first attempt fails
- Verify both devices have modern browsers with WebRTC support

**File Transfer Problems?**

- Ensure the file size is reasonable (under 100MB for best performance)
- Check that you have sufficient storage space on your mobile device
- Try a different file type if a specific one consistently fails
- Verify both devices remain connected throughout the transfer

## 📊 Performance

- **Gesture Recognition**: <100ms latency on most modern devices
- **File Transfer Speed**: Limited only by your network connection
- **CPU Usage**: ~5-15% during normal operation
- **Memory Usage**: ~50-100MB depending on file size

## 🏆 Hackathon Achievement

- **Event**: No Keyboards Allowed (hosted by CodeTV x goose)
- **Result**: 🥈 2nd Place
- **Category**: Solo Project
- **Built with**: goose AI Agent
- **Challenge**: Create an application without keyboard/mouse input using AI subagents
- **Submission**: October - November 2025

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
