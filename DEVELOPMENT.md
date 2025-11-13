# Development Guide 👨‍💻

Quick guide for developers who want to contribute to Gesture Share.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd gesture-share
npm install

# Start development
npm run dev
# Open http://localhost:5173
```

## 📁 Project Structure

```
src/
├── components/
│   ├── App.tsx              # Main app with device detection
│   ├── DesktopView.tsx      # Desktop interface with gestures
│   ├── GestureDetector.tsx   # MediaPipe hand tracking
│   ├── QRDisplay.tsx        # QR code generation
│   └── MobileView.tsx       # Mobile receiving interface
└── main.tsx                 # App entry point
```

## 🛠️ Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Check code quality
npm run format     # Format code with Prettier
```

## 🤚 Gesture System

The app recognizes 3 main gestures:

1. **Point Up (☝️)** - Shows QR code for mobile connection
2. **Fist (✊)** - Opens file selector
3. **Peace Sign (✌️)** - Sends selected file

### Gesture Detection Logic

Located in `src/components/GestureDetector.tsx`:

- Uses MediaPipe for hand landmark detection
- Calculates finger positions and angles
- Implements cooldown system (3 seconds)
- Visual feedback with hand overlay

## 🔧 Key Technologies

- **React 18** + **TypeScript** - Modern UI framework
- **MediaPipe** - Google's hand tracking
- **PeerJS** + **WebRTC** - P2P file sharing
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool

## 📝 Code Style

- TypeScript strict mode enabled
- ESLint + Prettier configured
- React functional components with hooks
- Custom hooks for complex state logic

## 🐛 Common Issues

**Camera not working?**
- Check browser permissions
- Ensure HTTPS (localhost exempt)
- Verify no other app uses camera

**Gestures not recognized?**
- Good lighting conditions
- Clear hand visibility
- Distinct gesture movements

**Connection issues?**
- Both devices need internet
- Check firewall settings
- Try new QR code

## 🚀 Deployment

The app is optimized for Vercel deployment:

```bash
npm run build
# Deploy dist/ folder to Vercel
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Test thoroughly
5. Submit pull request

Focus on:
- User experience improvements
- Gesture accuracy enhancements
- Performance optimizations
- Code quality and documentation

---
