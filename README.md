# Gesture Share 🖐️

Share files between devices using hand gestures. No cables or cloud storage needed.

## 🎯 How It Works

- **Point Up (☝️)** - Show QR code to connect your phone
- **Make a Fist (✊)** - Choose a file to share  
- **Peace Sign (✌️)** - Send the file instantly

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd gesture-share
npm install
npm run dev
# Open http://localhost:5173
```

### Step-by-Step Instructions

1. **Allow Camera** - Click "Allow" when prompted for camera access
2. **Point Up** - Raise your index finger to show the QR code
3. **Scan QR** - Use your phone's camera to scan the code
4. **Make a Fist** - Select the file you want to share
5. **Peace Sign** - Send the file instantly to your phone

## ✨ Features

- **🤚 Gesture Control** - No mouse or keyboard needed
- **⚡ Direct Transfer** - Files go straight to your device via WebRTC
- **📱 Universal Connection** - Works with any phone with a camera
- **🔄 Real-time Feedback** - Visual indicators and gesture recognition
- **🎯 Accurate Detection** - Powered by Google's MediaPipe technology
- **🌐 Network Agnostic** - Works on WiFi, cellular, or any internet connection

## 📱 System Requirements

### Desktop
- Modern browser (Chrome, Firefox, Safari, Edge)
- Built-in or external webcam
- Internet connection

### Mobile
- Any smartphone with camera
- Modern web browser
- Internet connection (WiFi or cellular)

### Network
- Active internet connection required
- Local network or internet both work
- No special configuration needed

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript for modern, type-safe development
- **Hand Tracking**: MediaPipe Tasks Vision for accurate gesture recognition
- **P2P Communication**: WebRTC + PeerJS for direct file transfer
- **Styling**: Tailwind CSS for responsive, utility-first design
- **Build Tool**: Vite for fast development and optimized builds
- **Code Quality**: ESLint + Prettier + Husky for consistent code

## 🔧 Development

Want to contribute? Check out our **[Development Guide](./DEVELOPMENT.md)** for detailed setup instructions, code style guidelines, and common debugging tips.

```bash
# Available scripts
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Check code quality
npm run format     # Format code with Prettier
```

## 📄 License

MIT License - feel free to use, modify, and contribute to this project.

---

**Made with ❤️ for effortless file sharing**
