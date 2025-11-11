import React, { useState, useCallback, useEffect } from "react";
import { GestureDetector } from "./GestureDetector";
import { QRDisplay } from "./QRDisplay";
import { useGestureCapture } from "../hooks/useGestureCapture";
import createConnectionManager from "../utils/connection-fp";

interface DesktopViewProps {
  onFileSelect: (file: File) => void;
}

export const DesktopView: React.FC<DesktopViewProps> = ({ onFileSelect }) => {
  const [peerId, setPeerId] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected"
  >("idle");
  const [connectionManager, setConnectionManager] = useState<ReturnType<
    typeof createConnectionManager
  > | null>(null);
  const [transferStatus, setTransferStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [currentGesture, setCurrentGesture] = useState<string>("none");
  const { gestures } = useGestureCapture();

  // Function to get local IP address - use WebRTC to discover local network IP
  const getLocalIP = useCallback(async () => {
    return new Promise<string>((resolve) => {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          const lines = pc.localDescription?.sdp?.split('\n') || [];
          for (const line of lines) {
            if (line.startsWith('a=candidate:') && line.includes('typ host')) {
              // Extract local IP from ICE candidate
              const match = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
              if (match) {
                const ip = match[1];
                // Filter out private network ranges we want to keep
                if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
                  resolve(ip);
                  return;
                }
              }
            }
          }
          // Fallback: try common local network IPs
          const commonLocalIPs = ['192.168.1.100', '192.168.0.100', '10.0.0.100'];
          resolve(commonLocalIPs[0]);
        })
        .catch(() => {
          // Final fallback
          resolve('192.168.1.100');
        });
    });
  }, []);

  const [localIP, setLocalIP] = useState('Detecting...');

  useEffect(() => {
    const detectIP = async () => {
      const ip = await getLocalIP();
      setLocalIP(ip);
    };
    
    detectIP();
  }, [getLocalIP]);

  const initializeConnection = useCallback(async () => {
    try {
      setConnectionStatus("connecting");
      const manager = createConnectionManager();
      const connectionInfo = await manager.initializeConnection();
      setPeerId(connectionInfo.peerId);
      setConnectionManager(manager);
      setConnectionStatus("idle");

      // Set up connection listener AFTER peer is initialized
      if (manager.state.peer) {
        manager.listenForConnections(() => {
          setConnectionStatus("connected");
        }, (data) => {
          // Handle incoming file transfers
          manager.handleFileTransfer(data);
        });
      }
    } catch (error) {
      console.error("Connection initialization failed:", error);
      setConnectionStatus("idle");
    }
  }, []);

  useEffect(() => {
    initializeConnection();
  }, [initializeConnection]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        onFileSelect(file);
        setTransferStatus("idle");
      }
    },
    [onFileSelect],
  );

  const handleGestureDetected = useCallback(
    async (gesture: string, _position: { x: number; y: number }) => {
      setCurrentGesture(gesture);
      
      if (
        gesture === "send" &&
        selectedFile &&
        connectionManager?.isConnected()
      ) {
        try {
          setTransferStatus("sending");
          const connections = Array.from(connectionManager.state.connections.values());
          if (connections.length > 0) {
            await connectionManager.sendFile(selectedFile);
            setTransferStatus("success");
            setTimeout(() => setTransferStatus("idle"), 3000);
            console.log(`File sent: ${selectedFile.name}`);
          } else {
            setTransferStatus("error");
            setTimeout(() => setTransferStatus("idle"), 3000);
            console.error("No active connection to send file");
          }
        } catch (error) {
          setTransferStatus("error");
          setTimeout(() => setTransferStatus("idle"), 3000);
          console.error("Failed to send file:", error);
        }
      }
    },
    [selectedFile, connectionManager],
  );

  const toggleDetection = useCallback(() => {
    setIsDetecting((prev) => !prev);
    if (!isDetecting) {
      setTransferStatus("idle");
    }
  }, [isDetecting]);



  const canSendFile = selectedFile && (connectionManager?.isConnected() || connectionStatus === "connected") && isDetecting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Gesture Share</h1>
              <p className="text-slate-600 mt-1">Share files seamlessly with hand gestures</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                connectionStatus === "connected"
                  ? "bg-emerald-100 text-emerald-800"
                  : connectionStatus === "connecting"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600"
              }`}>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  connectionStatus === "connected"
                    ? "bg-emerald-500"
                    : connectionStatus === "connecting"
                      ? "bg-amber-500"
                      : "bg-slate-400"
                }`}></span>
                {connectionStatus === "connected"
                  ? "Connected"
                  : connectionStatus === "connecting"
                    ? "Connecting..."
                    : "Ready"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Connection & File */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* QR Code Connection */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  Mobile Connection
                </h2>
              </div>
              <div className="p-6">
                {peerId ? (
                  <>
                    {/* QR Code */}
                    <QRDisplay
                      value={`http://${localIP}:5173/connect?peer=${peerId}`}
                      title="Scan with mobile device"
                      className="w-full"
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-sm text-slate-600">Generating connection code...</p>
                  </div>
                )}
              </div>
            </div>

            {/* File Selection Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  File Selection
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="file"
                      id="fileInput"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="sr-only"
                    />
                    <label
                      htmlFor="fileInput"
                      className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm text-slate-600">Drop file here or click to browse</span>
                        <span className="text-xs text-slate-400">Images, PDFs, documents</span>
                      </div>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-emerald-900 truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-emerald-600">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setTransferStatus("idle");
                          }}
                          className="text-emerald-400 hover:text-emerald-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {transferStatus !== "idle" && (
                    <div className={`rounded-lg p-4 border ${
                      transferStatus === "sending"
                        ? "bg-blue-50 border-blue-200"
                        : transferStatus === "success"
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-red-50 border-red-200"
                    }`}>
                      <div className="flex items-center gap-3">
                        {transferStatus === "sending" && (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {transferStatus === "success" && (
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {transferStatus === "error" && (
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <p className={`text-sm font-medium ${
                          transferStatus === "sending"
                            ? "text-blue-800"
                            : transferStatus === "success"
                              ? "text-emerald-800"
                              : "text-red-800"
                        }`}>
                          {transferStatus === "sending"
                            ? "Sending file..."
                            : transferStatus === "success"
                              ? "File sent successfully!"
                              : "Failed to send file"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Gesture Detection */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Gesture Detection Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    Gesture Control
                  </h2>
                  <button
                    onClick={toggleDetection}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isDetecting ? "bg-purple-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isDetecting ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <GestureDetector
                  onGestureDetected={handleGestureDetected}
                  isDetecting={isDetecting}
                />
                
                <div className="mt-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-slate-700">Current Gesture</h3>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        currentGesture === "OPEN_HAND"
                          ? "bg-blue-100 text-blue-700"
                          : currentGesture === "FIST"
                            ? "bg-red-100 text-red-700"
                            : currentGesture === "send"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                      }`}>
                        {currentGesture.replace("_", " ").toLowerCase()}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <p className="text-xs text-slate-600">Open hand = Ready</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <p className="text-xs text-slate-600">Fist = Grab</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <p className="text-xs text-slate-600">Open + movement = Send</p>
                      </div>
                    </div>
                  </div>
                </div>

                {canSendFile && (
                  <div className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-900">
                          Ready to send {selectedFile.name}
                        </p>
                        <p className="text-xs text-emerald-600">
                          Make the send gesture to transfer
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                  System Status
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Camera</span>
                    <span className={`text-sm font-medium ${
                      isDetecting ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {isDetecting ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Connection</span>
                    <span className={`text-sm font-medium ${
                      connectionStatus === "connected" ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {connectionStatus === "connected" ? "Connected" : "Waiting"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">File Ready</span>
                    <span className={`text-sm font-medium ${
                      selectedFile ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {selectedFile ? "Selected" : "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Instructions & History */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Instructions Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"></div>
                  How It Works
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">Connect</h3>
                      <p className="text-xs text-slate-600 mt-1">Scan QR code with mobile device</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-emerald-600">2</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">Select File</h3>
                      <p className="text-xs text-slate-600 mt-1">Choose the file you want to share</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-600">3</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">Enable Gestures</h3>
                      <p className="text-xs text-slate-600 mt-1">Toggle gesture detection on</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-amber-600">4</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">Send File</h3>
                      <p className="text-xs text-slate-600 mt-1">Make the send gesture</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gesture History */}
            {gestures.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"></div>
                    Recent Gestures
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {gestures.slice(-5).reverse().map((gesture) => (
                      <div
                        key={gesture.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            gesture.name === "OPEN_HAND"
                              ? "bg-blue-500"
                              : gesture.name === "FIST"
                                ? "bg-red-500"
                                : "bg-slate-400"
                          }`}></div>
                          <span className="text-sm font-medium text-slate-900 capitalize">
                            {gesture.name.replace("_", " ").toLowerCase()}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {(gesture.duration / 1000).toFixed(1)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
