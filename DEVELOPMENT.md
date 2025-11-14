# Development Guide 👨‍💻

Comprehensive guide for developers who want to contribute to Gesture Share.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- Modern web browser with camera access
- A webcam (built-in or external)
- A smartphone for testing mobile functionality

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

## 📁 Project Structure

```
gesture-share/
├── src/
│   ├── components/
│   │   ├── App.tsx              # Main application with device detection
│   │   ├── DesktopView.tsx      # Desktop interface with gesture controls
│   │   ├── GestureDetector.tsx   # MediaPipe hand tracking and gesture recognition
│   │   ├── QRDisplay.tsx        # QR code generation and display
│   │   └── MobileView.tsx       # Mobile receiving interface
│   ├── hooks/                   # Custom React hooks for state management
│   ├── utils/                   # Utility functions and helpers
│   ├── styles/                  # Global styles and CSS
│   ├── types/                   # TypeScript type definitions
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global CSS styles
├── public/                      # Static assets
├── dist/                        # Production build output
├── DEVELOPMENT.md               # This file
├── README.md                    # Project documentation
├── LICENSE                      # MIT license
└── package.json                 # Project dependencies and scripts
```

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production with type checking
npm run preview      # Preview production build locally
npm run lint         # Run ESLint with auto-fix
npm run lint:check   # Run ESLint without auto-fix
npm run format       # Format code with Prettier
npm run typecheck    # Run TypeScript type checking without emit
```

## 🤚 Gesture System

The app recognizes 3 main gestures:

1. **Point Up (☝️)** - Shows QR code for mobile connection
2. **Fist (✊)** - Opens file selector
3. **Peace Sign (✌️)** - Sends selected file

### Gesture Detection Logic

Located in `src/components/GestureDetector.tsx`:

- Uses MediaPipe Tasks Vision for hand landmark detection
- Tracks 21 hand landmarks in real-time
- Calculates finger positions and angles
- Implements cooldown system (3 seconds) to prevent accidental triggers
- Provides visual feedback with real-time hand overlay
- Hides guidance tips when any hand is detected

#### Gesture Recognition Algorithm

1. **Hand Detection**: MediaPipe detects if a hand is present in the frame
2. **Landmark Extraction**: 21 key points on the hand are identified
3. **Gesture Classification**: Specific patterns are matched:
   - **Point Up**: Index finger extended, others curled
   - **Fist**: All fingers curled
   - **Peace Sign**: Index and middle fingers extended, others curled
4. **Cooldown Management**: Prevents rapid-fire gesture triggers
5. **State Updates**: Gesture state is communicated to parent components

### Adding New Gestures

To add a new gesture:

1. Define the gesture type in the component interface
2. Add the gesture classification logic in the detection function
3. Implement the gesture action in the parent component
4. Update the UI to show appropriate feedback

## 🔧 Key Technologies

- **React 19** + **TypeScript** - Modern UI framework with type safety
- **MediaPipe Tasks Vision** - Google's advanced hand tracking technology
- **PeerJS** + **WebRTC** - Peer-to-peer file sharing without server
- **Tailwind CSS** - Utility-first styling for responsive design
- **Vite** - Lightning-fast development and optimized builds
- **QRCode.react** - QR code generation for device pairing

## 📝 Code Style

- TypeScript strict mode enabled for type safety
- ESLint + Prettier configured for consistent formatting
- React functional components with hooks
- Custom hooks for complex state logic
- Semantic HTML and accessibility considerations
- Component-based architecture with clear separation of concerns

### Code Organization

- Components are self-contained with their own logic
- Hooks abstract reusable state management
- Utility functions are pure and testable
- Types are centralized for better reusability
- CSS is component-scoped using Tailwind classes

## 🐛 Debugging & Troubleshooting

### Camera Issues

```bash
# Check browser camera permissions in developer tools
# Console: navigator.mediaDevices.getUserMedia({ video: true })
```

- Ensure HTTPS is used (localhost is exempt)
- Verify no other application is using the camera
- Check browser compatibility (modern browsers only)
- Test with different camera resolutions if needed

### Gesture Recognition Issues

```bash
# Enable MediaPipe debug logs in console
# Add to GestureDetector.tsx: console.log(handLandmarks);
```

- Check lighting conditions (good lighting improves accuracy)
- Ensure hand is fully visible in camera frame
- Maintain appropriate distance (2-6 feet)
- Verify gesture movements are deliberate and clear
- Check for occlusions or overlapping fingers

### Connection Issues

```bash
# Test WebRTC connectivity in console
# Check STUN/TURN server status
```

- Both devices need active internet connection
- Verify firewall isn't blocking WebRTC traffic
- Check if VPN or proxy is interfering
- Test with different network configurations
- Ensure both browsers support WebRTC API

## 🧪 Testing

### Unit Testing

```bash
# Run tests (when implemented)
npm test
```

### Manual Testing Checklist

- [ ] Camera initializes correctly
- [ ] Hand detection works in various lighting
- [ ] All three gestures are recognized accurately
- [ ] QR code generation and scanning works
- [ ] File transfer completes successfully
- [ ] Mobile interface displays correctly
- [ ] Responsive layout works on different screen sizes
- [ ] Error handling works for edge cases

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm run preview
```

### Environment Variables

Create `.env.production` for production:

```
VITE_PEERJS_HOST=your-peer-server.com
VITE_PEERJS_PORT=443
VITE_PEERJS_PATH=/app
```

### Deployment Platforms

The app works well on:

- **Vercel** (recommended) - Zero-config deployment
- **Netlify** - Static hosting with form handling
- **AWS S3 + CloudFront** - Scalable CDN deployment
- **Docker** - Containerized deployment for custom servers

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with small, atomic commits
4. Test thoroughly on both desktop and mobile
5. Ensure code passes linting and type checking
6. Submit a pull request with detailed description

### Code Review Guidelines

- All code must be properly formatted (`npm run format`)
- All type errors must be resolved
- New features should include documentation updates
- Performance implications should be considered
- Accessibility improvements are encouraged

### Areas for Contribution

- **Gesture Recognition**: Improve detection accuracy, add new gestures
- **User Experience**: Enhance UI/UX, improve visual feedback
- **Performance**: Optimize file transfer speeds, reduce latency
- **Mobile Support**: Improve mobile receiving experience
- **Documentation**: Add more examples, improve guides
- **Testing**: Add unit tests, improve test coverage
- **Accessibility**: Improve screen reader support, keyboard navigation

## 📚 Additional Resources

- [MediaPipe Documentation](https://mediapipe.dev/)
- [WebRTC API Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [PeerJS Documentation](https://peerjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Happy coding! 🎉**
