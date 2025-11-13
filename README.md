# Gesture Share 🖐️

A desktop application that enables seamless file sharing between your computer and mobile device using intuitive hand gestures. Share files effortlessly with a simple wave, point, or peace sign!

## ✨ Features

- **🎯 Gesture-Controlled File Sharing**: Use hand gestures to control file transfers
- **💻 Desktop-Optimized**: Built specifically for desktop use with webcam integration
- **🤖 Real-time Hand Detection**: Uses MediaPipe for accurate gesture recognition
- **📱 QR Code Connections**: Easy mobile device pairing via QR codes
- **⚡ Smart Cooldown System**: 3-second cooldown prevents accidental gesture triggers
- **🎨 Modern UI/UX**: Clean interface with real-time gesture feedback and visual indicators
- **🔄 Connection Status**: Live connection status indicator in the header
- **📁 File Preview**: Thumbnail preview for images and file type indicators
- **🌐 P2P Technology**: Direct peer-to-peer file transfers using WebRTC

### 🤚 Supported Gestures

- **☝️ Point Up**: Show QR code for mobile connection
- **✊ Fist**: Open file selector to choose files  
- **✌️ Peace Sign**: Send selected file to connected device
- **✋ Open Hand**: Default/ready state (no cooldown)
- **🖐️ Partial**: Partial hand state (no cooldown)

## Quick Start

### Prerequisites

- Node.js 18 or higher
- A webcam (built-in or external)
- Modern browser with camera permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gesture-share
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

5. **Allow camera access** when prompted

### Usage

1. **Launch the app** and allow camera permissions
2. **Point Up (☝️)** to display the QR code for mobile connection
3. **Scan the QR code** with your mobile device to connect
4. **Make a Fist (✊)** to open the native file picker
5. **Select a file** from your computer
6. **Make a Peace Sign (✌️)** to send the file to your mobile device

## Project Structure

```
gesture-share/
├── src/
│   ├── components/
│   │   ├── App.tsx              # Main application component
│   │   ├── DesktopView.tsx      # Desktop interface with gesture controls
│   │   ├── GestureDetector.tsx   # Hand gesture detection logic
│   │   ├── QRDisplay.tsx        # QR code generation and display
│   │   └── MobileView.tsx       # Mobile interface (simplified)
│   ├── hooks/
│   │   ├── useFileTransfer.ts   # File transfer state management
│   │   ├── usePeerConnection.ts # Peer-to-peer connection handling
│   │   └── useQRDisplay.ts      # QR code display logic
│   ├── lib/
│   │   ├── peer.ts              # PeerJS configuration and utilities
│   │   └── qr.ts                # QR code generation helpers
│   ├── styles/
│   │   └── globals.css          # Global CSS variables and styles
│   └── main.tsx                 # Application entry point
├── public/
│   └── index.html               # HTML template
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

### Key Components

- **GestureDetector**: Handles webcam capture and MediaPipe hand tracking with real-time gesture overlay
- **DesktopView**: Main desktop interface with gesture controls and status
- **QRDisplay**: Generates and displays connection QR codes

## Technology Stack

### Frontend Framework
- **React 18.2+** - Modern UI framework with hooks and concurrent features
- **TypeScript 5.0+** - Static type checking and enhanced developer experience

### Build & Development Tools
- **Vite 5.0+** - Fast build tool with HMR and optimized bundling
- **ESLint** - Code linting and consistency checks
- **Prettier** - Code formatting and style enforcement

### Styling & UI
- **Tailwind CSS 3.0+** - Utility-first CSS framework with custom configurations
- **PostCSS** - CSS transformation and optimization

### Computer Vision & ML
- **MediaPipe Tasks Vision** - Google's hand landmark detection and tracking
- **WebGL Acceleration** - GPU-accelerated image processing
- **Real-time Gesture Recognition** - Custom gesture classification algorithms

### Networking & Communication
- **PeerJS** - WebRTC-based peer-to-peer connections for direct file transfers
- **WebRTC** - Real-time communication between browsers
- **STUN/TURN Servers** - NAT traversal for peer connections

### Utilities & Libraries
- **QRCode.js** - Dynamic QR code generation for mobile connections
- **File API** - Native browser file handling and transfers
- **getUserMedia API** - Camera and microphone access

### Browser APIs
- **Canvas API** - Image processing and visualization
- **Web Workers** - Background processing for performance
- **LocalStorage** - Client-side data persistence

### Development Environment
- **Node.js 18+** - JavaScript runtime for development and build tools
- **fnm** - Fast Node Manager for version control
- **GitHub Actions** - Automated CI/CD and deployment pipelines

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Environment Setup

The project uses `mise` for development environment management. Install mise and run:

```bash
mise install
```

This will set up the correct Node.js version and dependencies automatically.

## Deployment

### Automated CI/CD

The project uses GitHub Actions for automated builds and deployment:

- **Build Verification**: Linting, type checking, and production builds
- **Static Hosting Ready**: Build artifacts prepared for Vercel, Netlify, or GitHub Pages
- **Automatic Deployment**: Triggered on pushes to main branch

### Manual Deployment

For manual deployment to static hosting platforms:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy `dist/` folder** to your preferred hosting platform:
   - **Vercel**: Connect repository for automatic deployment
   - **Netlify**: Drag and drop the `dist/` folder
   - **GitHub Pages**: Use `gh-pages` branch or GitHub Actions

## Camera Requirements

- Minimum resolution: 640x480
- Recommended resolution: 1280x720
- Frame rate: 30fps (recommended)
- Must support getUserMedia API
- HTTPS required for camera access (localhost is exempt)

## Browser Compatibility

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Troubleshooting

### Camera Not Working
1. Check browser camera permissions
2. Ensure no other app is using the camera
3. Try refreshing the page
4. Check if using HTTPS (required for camera access)

### Gestures Not Recognized
1. Ensure good lighting conditions
2. Keep your hand visible in the camera frame
3. Make clear, distinct gestures
4. Check camera resolution settings

### Connection Issues
1. Ensure both devices have internet access
2. Check firewall settings for peer connections
3. Try generating a new QR code
4. Verify both devices are on the same network (recommended)

## License

This project is licensed under the MIT License.
