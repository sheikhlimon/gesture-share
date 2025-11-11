# Photo Drop - Gesture-Based File Sharing Project Plan

## Project Overview
A web application that allows desktop users to send photos to mobile devices using hand gestures, with file transfer powered by WebRTC and device pairing via QR codes.

## Final Project Structure
```
src/
 ├── components/
 │    ├── GestureDetector.jsx
 │    ├── QRDisplay.jsx
 │    └── ReceiverView.jsx
 ├── utils/
 │    └── connection.js
 ├── App.jsx
 └── main.jsx
public/
 └── index.html
```

## Technology Stack

### Frontend Framework
- React + Vite for development and building
- TailwindCSS for styling

### AI & Gesture Detection
- MediaPipe + TensorFlow.js for hand tracking
- Fingerpose for gesture classification

### File Sharing
- PeerJS (WebRTC) for peer-to-peer file transfer

### Device Pairing
- QR code generation and scanning via qrcode.react

### Deployment
- GitHub Pages or Vercel (optional)

## Core Features Implementation

### 1. Gesture Detection System
**File**: `src/components/GestureDetector.jsx`

**Key Functions**:
- Access webcam via getUserMedia()
- Load MediaPipe handpose model
- Real-time hand landmark detection
- Gesture classification using Fingerpose:
  - Open palm = "ready" state
  - Closed fist = "grab" state  
  - Open after grab = "release" state
- Hand position tracking between frames
- Gesture sequence detection: [open → fist → open + movement] = "send"

### 2. Peer-to-Peer Connection
**File**: `src/utils/connection.js`

**Key Functions**:
- `createConnection()` - Initialize PeerJS instance and generate Peer ID
- `connectToPeer(peerId)` - Establish connection to another device
- `sendFile(peerConnection, file)` - Transfer file via WebRTC
- `listenForFile(peer, callback)` - Handle incoming file transfers

### 3. QR Code Pairing
**File**: `src/components/QRDisplay.jsx`

**Functionality**:
- Desktop generates unique Peer ID
- Display QR code encoding Peer ID
- Mobile device scans QR or manually enters ID
- Automatic connection establishment via PeerJS

### 4. Application Logic Integration
**File**: `src/App.jsx`

**State Management**:
- Device role (desktop/mobile mode)
- Connection status
- File selection and transfer state
- Gesture detection status

**Desktop Flow**:
1. Generate Peer ID and display QR code
2. Listen for incoming connections
3. Monitor gesture detection
4. Trigger file send on "send" gesture
5. Handle file selection interface

**Mobile Flow**:
1. Scan QR or input Peer ID
2. Connect to desktop device
3. Display connection status
4. Receive and preview incoming files
5. Handle file download/display options

### 5. Receiver Interface
**File**: `src/components/ReceiverView.jsx`

**Features**:
- Connection status indicator
- File receiving progress
- Image preview and display
- Download/save options

## Gesture Logic Implementation

### Hand Tracking Flow
1. Initialize MediaPipe Hands model
2. Capture video frames from webcam
3. Extract hand landmarks from each frame
4. Apply Fingerpose gesture classification

### Gesture Recognition Pattern
```
if (previousGesture === 'OPEN_HAND' && currentGesture === 'FIST') {
    setGrabStart(position)
}
if (previousGesture === 'FIST' && currentGesture === 'OPEN_HAND') {
    if (handMovedForward()) {
        triggerGesture("send")
    }
}
```

### Gesture Definitions
- **OPEN_HAND**: All fingers extended
- **FIST**: All fingers folded
- **MOVEMENT**: Detect forward hand motion between grab and release

## File Transfer Workflow

### Sending Process (Desktop)
1. User selects photo file
2. Desktop detects "send" gesture sequence
3. PeerJS connection sends file to connected mobile device
4. Display transfer confirmation

### Receiving Process (Mobile)
1. Mobile device establishes connection
2. Listens for incoming file transfers
3. Displays received image preview
4. Offers download/save options

## User Interface Design

### Desktop View
- **Video Feed**: Live webcam with gesture detection overlay
- **Status Display**: Current gesture state ("open / fist / release")
- **QR Code**: Peer ID for mobile pairing
- **File Upload**: Optional drag-and-drop zone for file selection
- **Connection Status**: Show when mobile device is connected

### Mobile View
- **Connection Screen**: QR scanner or manual ID input
- **Waiting State**: "Waiting for file..." message
- **Image Preview**: Display received photos
- **Action Buttons**: Download, save, or dismiss options

## Development Dependencies

### Core Libraries
- `@tensorflow/tfjs` - TensorFlow.js for machine learning
- `@tensorflow-models/hand-pose-detection` - Hand pose detection model
- `@mediapipe/hands` - MediaPipe hand tracking
- `fingerpose` - Gesture recognition library
- `peerjs` - WebRTC peer-to-peer connections
- `qrcode.react` - QR code generation

### Development Tools
- `tailwindcss` - Utility-first CSS framework
- ESLint configuration for code quality
- TypeScript support for type safety

## Security & Performance Considerations

### Security
- WebRTC encryption for file transfers
- Temporary Peer ID generation for privacy
- No server-side file storage

### Performance
- Browser-based processing only
- Optimized hand detection with MediaPipe
- Efficient file chunking for large transfers

## Testing Strategy

### Unit Testing
- Gesture detection accuracy
- File transfer reliability
- QR code generation/scanning

### Integration Testing
- Desktop-to-mobile connection flow
- Gesture-triggered file sending
- Cross-device compatibility

### User Testing
- Gesture recognition accuracy
- File transfer success rate
- User interface intuitiveness

## Future Enhancement Opportunities

### Advanced Features
- Multiple gesture support (different gestures for different actions)
- Multiple file selection support
- File transfer history
- Offline mode with local storage

### Platform Expansion
- Native mobile app development
- Desktop application wrapper
- Browser extension integration

## Success Metrics

### Technical Performance
- Gesture detection accuracy > 90%
- File transfer success rate > 95%
- Connection establishment time < 5 seconds

### User Experience
- Intuitive gesture recognition
- Seamless file transfer process
- Responsive cross-device experience
