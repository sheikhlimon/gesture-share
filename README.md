# Gesture Share

A desktop application that enables seamless file sharing between your computer and mobile device using intuitive hand gestures.

## Features

- **Gesture-Controlled File Sharing**: Use hand gestures to control file transfers
- **Desktop-Optimized**: Built specifically for desktop use with webcam integration
- **Real-time Hand Detection**: Uses MediaPipe for accurate gesture recognition
- **QR Code Connections**: Easy mobile device pairing via QR codes
- **Multiple Gesture Controls**:
  - ☝️ **Point Up**: Show QR code for mobile connection
  - ✊ **Fist**: Open file selector to choose files
  - 👌 **OK Sign**: Send selected file to connected device
  - ✋ **Open Hand**: Default/ready state

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
4. **Make a Fist (✊)** to open the file selector
5. **Select a file** from the file browser
6. **Make an OK Sign (👌)** to send the file to your mobile device

## Project Structure

```
gesture-share/
├── src/
│   ├── components/
│   │   ├── App.tsx              # Main application component
│   │   ├── DesktopView.tsx      # Desktop interface with gesture controls
│   │   ├── GestureDetector.tsx   # Hand gesture detection logic
│   │   ├── FileSelector.tsx     # File selection modal
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

- **GestureDetector**: Handles webcam capture and MediaPipe hand tracking
- **DesktopView**: Main desktop interface with gesture controls and status
- **FileSelector**: Modal for browsing and selecting files to share
- **QRDisplay**: Generates and displays connection QR codes

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **MediaPipe Tasks Vision** - Hand landmark detection
- **PeerJS** - Peer-to-peer connections
- **QRCode.js** - QR code generation

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
