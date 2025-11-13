# Gesture Share - Gesture-Based File Sharing Project Plan

## Project Overview
Gesture Share is a revolutionary web application that enables seamless file sharing between desktop and mobile devices using intuitive hand gestures. Leveraging cutting-edge AI technologies including MediaPipe for hand tracking and WebRTC for peer-to-peer connections, this platform eliminates the need for traditional file transfer methods.

## Project Structure
```
src/
 ├── components/
 │    ├── GestureDetector.tsx      # Hand gesture detection and recognition
 │    ├── DesktopView.tsx          # Desktop interface with webcam feed
 │    ├── MobileView.tsx           # Mobile receiving interface
 │    ├── QRDisplay.tsx            # QR code generation and display
 │    └── FileSelector.tsx         # File selection interface
 ├── types/
 │    └── gesture.ts               # TypeScript type definitions for gestures
 ├── App.tsx                       # Main application component
 ├── main.tsx                      # Application entry point
 └── index.css                     # Global styles and animations
public/
 └── index.html                    # HTML template
```

## Technology Stack

### Frontend Framework
- **React 19**: Modern React with latest features and optimizations
- **TypeScript**: Type-safe development with comprehensive type definitions
- **Vite**: Fast development and build tool with HMR
- **TailwindCSS**: Utility-first CSS framework for rapid styling

### AI & Gesture Detection
- **@mediapipe/tasks-vision**: Latest MediaPipe vision tasks API
- **TensorFlow.js**: Machine learning inference in browser
- **Hand Landmarker**: Precise hand landmark detection and tracking

### File Sharing & Communication
- **PeerJS**: Simplified WebRTC peer-to-peer connections
- **WebRTC**: Real-time communication between browsers
- **DataChannel API**: Direct file transfer between connected peers

### Device Pairing & QR
- **QRCode.js**: QR code generation for device pairing
- **Network IP Detection**: Automatic network IP detection for cross-device connectivity

### Development Tools
- **ESLint**: Code quality and consistency enforcement
- **TypeScript**: Static type checking and IDE support

## Core Features Implementation

### 1. Gesture Detection System
**File**: `src/components/GestureDetector.tsx`

**Key Functions**:
- **Webcam Initialization**: Access webcam via getUserMedia() API with proper permission handling
- **MediaPipe Model Loading**: Load @mediapipe/tasks-vision HandLandmarker with optimized settings
- **Real-time Hand Tracking**: Continuous hand landmark detection at 30+ FPS
- **Gesture Classification**: Advanced gesture recognition with high accuracy:
  - **Point Up (☝️)**: Display QR code for device pairing
  - **Fist (✊)**: Open file selector menu
  - **OK Sign (👌)**: Send selected files to connected device
  - **Open Hand (✋)**: Default/ready state
- **Performance Optimization**: Reduced video resolution (640x480) for better performance
- **Error Handling**: Comprehensive error recovery for camera and model failures
- **Visual Feedback**: Real-time gesture visualization and confidence indicators

### 2. Desktop Interface
**File**: `src/components/DesktopView.tsx`

**Key Functions**:
- **Webcam Display**: Live video feed with overlay UI elements
- **Gesture Status Display**: Real-time gesture detection feedback
- **Connection Management**: PeerJS instance creation and management
- **QR Modal Integration**: Automatic display for device pairing
- **File Transfer**: Handle file selection and sending via gestures
- **Device Override Controls**: Manual desktop/mobile view switching

### 3. Mobile Interface
**File**: `src/components/MobileView.tsx`

**Key Functions**:
- **QR Scanner**: Built-in camera-based QR code scanning
- **Manual ID Input**: Alternative connection method via peer ID entry
- **Connection Status**: Real-time connection state visualization
- **File Reception**: Preview and management of received files
- **Download Management**: Automatic file download on mobile devices

### 4. QR Code Display
**File**: `src/components/QRDisplay.tsx`

**Key Functions**:
- **Dynamic QR Generation**: Real-time QR code creation with current peer ID
- **Modern UI Design**: Clean, white-themed modal with rounded corners
- **Auto-close Functionality**: Automatic modal closure upon successful connection
- **Mobile Responsiveness**: Optimized display for both desktop and mobile viewing

### 5. File Selection
**File**: `src/components/FileSelector.tsx`

**Key Functions**:
- **File Picker**: Intuitive file selection interface
- **File Validation**: Type checking and size limit enforcement
- **Preview Generation**: Thumbnail creation for image files
- **Gesture Integration**: Gesture-controlled file selection

### 6. Application State Management
**File**: `src/App.tsx`

**Key Functions**:
- **Device Detection Logic**: Automatic desktop/mobile mode selection
- **Connection State**: PeerJS connection status and peer ID management
- **Gesture State**: Current gesture detection and confidence levels
- **UI State**: Modal visibility and view switching controls
- **Error State**: Global error handling and user notifications

## Gesture Recognition Implementation

### Gesture Detection Flow
1. Initialize MediaPipe HandLandmarker with optimized settings
2. Capture video frames from webcam at 640x480 resolution
3. Extract 21 hand landmarks from each detected hand
4. Apply custom gesture recognition algorithms
5. Calculate confidence scores for each gesture
6. Trigger appropriate actions based on detected gestures

### Supported Gestures
- **Point Up (☝️)**: Shows QR modal for device pairing
- **Fist (✊)**: Opens file selector menu
- **OK Sign (👌)**: Sends selected files to connected device
- **Open Hand (✋)**: Default/ready state

## File Transfer Workflow

### Desktop to Mobile Transfer
1. Desktop detects Point Up gesture → displays QR modal
2. Mobile scans QR or enters peer ID
3. WebRTC connection established between devices
4. Desktop detects Fist → shows file selector
5. User selects files via interface
6. Desktop detects OK Sign → sends files
7. Mobile receives files with progress tracking
8. Files automatically saved to mobile device

## Performance & Security

### Optimization
- **Reduced Resolution**: 640x480 video for better performance
- **Model Optimization**: Efficient MediaPipe configuration
- **Memory Management**: Proper cleanup and garbage collection
- **Connection Reuse**: Reuse WebRTC connections for multiple transfers

### Security Features
- **End-to-End Encryption**: All transfers encrypted via WebRTC
- **No Server Storage**: Files never stored on intermediate servers
- **Temporary Peer IDs**: Auto-generated disposable connection identifiers
- **Local Processing**: All gesture processing happens client-side

---

*This plan provides a comprehensive roadmap for the Gesture Share project, covering the actual project structure and implementation details based on the existing codebase.*
