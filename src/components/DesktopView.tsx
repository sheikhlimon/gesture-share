import React, { useState, useCallback, useEffect, useRef } from "react";
import { GestureDetector } from "./GestureDetector";
import { QRDisplay } from "./QRDisplay";
import * as Peer from "peerjs";

interface FileStart {
  type: "file-start";
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

interface FileChunk {
  type: "file-chunk";
  fileId: string;
  chunkIndex: number;
  chunk: ArrayBuffer;
}

interface FileEnd {
  type: "file-end";
  fileId: string;
}

// Get the actual network IP for mobile connection
const getNetworkIP = async (): Promise<string> => {
  const port = window.location.port || "5174";

  // Try to get the local network IP
  const localIP = await new Promise<string>((resolve) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pc.createDataChannel("");
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          setTimeout(() => {
            const lines = pc.localDescription?.sdp?.split("\n") || [];
            pc.close();

            for (const line of lines) {
              if (line.includes("candidate:") && line.includes("typ host")) {
                const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
                if (
                  match &&
                  !match[0].startsWith("127.") &&
                  !match[0].startsWith("0.")
                ) {
                  resolve(match[0]);
                  return;
                }
              }
            }
            resolve("");
          }, 1000);
        });
    } catch {
      resolve("");
    }
  });

  // If we got a valid local IP, use it
  if (localIP) {
    return `${localIP}:${port}`;
  }

  // Fallback to manual input if we can't detect the IP
  const manualIP = window.prompt(
    "Enter your computer's IP address (e.g., 192.168.1.100):",
  );
  if (manualIP) {
    return `${manualIP}:${port}`;
  }

  // Last resort - show localhost (won't work for mobile but allows testing)
  return `localhost:${port}`;
};

interface DesktopViewProps {
  onFileSelect: (file: File) => void;
}

export const DesktopView: React.FC<DesktopViewProps> = ({ onFileSelect }) => {
  const [peerId, setPeerId] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected"
  >("idle");
  const [connections, setConnections] = useState<
    Map<string, Peer.DataConnection>
  >(new Map());
  const [currentGesture, setCurrentGesture] = useState<string>("");
  const [currentHost, setCurrentHost] = useState<string>("");
  const [showQRModal, setShowQRModal] = useState(false);
  

  const peerRef = useRef<Peer.Peer | null>(null);

  useEffect(() => {
    getNetworkIP().then((ip) => {
      setCurrentHost(ip);
    });
  }, []);

  // Close QR modal when connection is established
  useEffect(() => {
    if (connectionStatus === "connected" && showQRModal) {
      setShowQRModal(false);
    }
  }, [connectionStatus, showQRModal]);

  // Generate image URL when file is selected
  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImageUrl(null);
    }
  }, [selectedFile]);

  useEffect(() => {
    // Only create PeerJS connection if this component is visible
    if (peerRef.current || document.hidden) return;

    try {
      setConnectionStatus("connecting");
      const newPeer = new Peer.Peer("", {
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ],
        },
      });
      peerRef.current = newPeer;

      newPeer.on("open", (id) => {
        setPeerId(id);
        setConnectionStatus("idle");
      });

      newPeer.on("connection", (conn) => {
        console.log("Desktop received connection from:", conn.peer);

        // Answer the connection with reliable option
        conn.on("open", () => {
          console.log("Desktop connection opened to:", conn.peer);
          setConnections((prev) => new Map(prev).set(conn.peer, conn));
          setConnectionStatus("connected");
          setShowQRModal(false); // Close QR modal when connected
        });

        conn.on("close", () => {
          setConnections((prev) => {
            const newMap = new Map(prev);
            newMap.delete(conn.peer);
            return newMap;
          });
          if (connections.size === 0) {
            setConnectionStatus("idle");
          }
        });
      });

      newPeer.on("error", () => {
        setConnectionStatus("idle");
      });

      return () => {
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }
      };
    } catch (error) {
      console.error("Peer initialization error:", error);
      setConnectionStatus("idle");
    }
  }, [connections.size]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showFilePickerButton, setShowFilePickerButton] = useState(false);

  const openFilePickerDirectly = useCallback(() => {
    console.log("=== Opening file picker directly ===");
    
    // Create and trigger file input immediately (user activated)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf,.doc,.docx,.txt';
    fileInput.style.position = 'absolute';
    fileInput.style.left = '-9999px';
    fileInput.style.top = '-9999px';
    
    fileInput.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        console.log("File selected:", file.name);
        setSelectedFile(file);
        onFileSelect(file);
      }
      document.body.removeChild(fileInput);
      setShowFilePickerButton(false);
    };

    fileInput.oncancel = () => {
      console.log("File picker cancelled");
      document.body.removeChild(fileInput);
      setShowFilePickerButton(false);
    };

    document.body.appendChild(fileInput);
    
    // This should work because it's triggered by a user click
    fileInput.click();
  }, [onFileSelect]);

  const triggerFilePickerFlow = useCallback(() => {
    console.log("=== Triggering file picker flow ===");
    // Show the button overlay for user to click
    setShowFilePickerButton(true);
    
    // Auto-hide after 10 seconds if not clicked
    setTimeout(() => {
      setShowFilePickerButton(false);
    }, 10000);
  }, []);

  const sendFile = useCallback(
    async (file: File, connection: Peer.DataConnection) => {
      console.log("=== sendFile called ===");
      console.log("File:", file.name, "Size:", file.size);
      console.log("Connection:", connection.peer, "Open:", connection.open);
      try {
        const fileId = Date.now().toString();
        const fileStart = {
          type: "file-start",
          fileId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        } as FileStart;
        console.log("Sending file-start:", fileStart);
        connection.send(fileStart);

        const chunkSize = 16384;
        const buffer = await file.arrayBuffer();
        const totalChunks = Math.ceil(buffer.byteLength / chunkSize);

        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, buffer.byteLength);
          const chunk = buffer.slice(start, end);

          connection.send({
            type: "file-chunk",
            fileId,
            chunkIndex: i,
            chunk: chunk,
          } as FileChunk);
        }

        connection.send({
          type: "file-end",
          fileId,
        } as FileEnd);
      } catch (error) {
        console.error("Failed to send file:", error);
      }
    },
    [],
  );

  const handleGestureDetected = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (gesture: string, _position: { x: number; y: number }) => {
      console.log("DesktopView handleGestureDetected:", gesture);
      setCurrentGesture(gesture);

      switch (gesture) {
        case "POINT_UP":
          console.log(
            "Point Up gesture detected, connection status:",
            connectionStatus,
            "peerId:",
            peerId,
          );
          if (connectionStatus !== "connected") {
            setShowQRModal(true);
          }
          break;

        case "FIST":
          // Trigger file picker flow (shows button overlay)
          triggerFilePickerFlow();
          break;

        case "OK_SIGN":
          console.log("=== OK SIGN DETECTED - SENDING FILE ===");
          console.log("Selected file:", selectedFile?.name);
          console.log("Selected file size:", selectedFile?.size);
          console.log("Connections size:", connections.size);
          console.log("Available connections:", Array.from(connections.keys()));

          if (selectedFile && connections.size > 0) {
            const firstConnection = Array.from(connections.values())[0];
            if (firstConnection) {
              console.log("Connection object:", firstConnection);
              console.log("Connection peer:", firstConnection.peer);
              console.log("Connection open:", firstConnection.open);
              console.log("Trying to send file...");
              await sendFile(selectedFile, firstConnection);
            } else {
              console.log("ERROR: First connection is null/undefined");
            }
          } else {
            if (!selectedFile) {
              console.log("ERROR: No file selected");
            }
            if (connections.size === 0) {
              console.log("ERROR: No active connections");
            }
          }
          break;
      }
    },
    [
      connectionStatus,
      connections,
      onFileSelect,
      peerId,
      selectedFile,
      sendFile,
    ],
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* QR Code - Centered modal matching website design */}
      {showQRModal && connectionStatus !== "connected" && peerId && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="bg-gray-800 text-white p-4 rounded-xl shadow-2xl border border-gray-700 max-w-xs w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-base font-semibold mb-3">
                Connect Your Phone
              </h3>
              <QRDisplay
                value={`http://${currentHost}/connect?peer=${peerId}`}
                size={200}
                title=""
              />
              <p className="mt-3 text-gray-400 text-xs">
                Status:{" "}
                <span className="font-medium text-white">
                  {connectionStatus}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File Picker Button Overlay */}
      {showFilePickerButton && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowFilePickerButton(false)}
        >
          <div
            className="bg-gray-800 text-white p-6 rounded-xl shadow-2xl border border-gray-700 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-4xl mb-4">✊</div>
              <h3 className="text-lg font-semibold mb-2">
                Fist Gesture Detected
              </h3>
              <p className="text-gray-400 mb-6">
                Click the button below to open the file selector
              </p>
              <button
                onClick={openFilePickerDirectly}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Select File to Share
              </button>
              <p className="text-xs text-gray-500 mt-3">
                This button will disappear in 10 seconds
              </p>
            </div>
          </div>
        </div>
      )}

      

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Gesture Share</h1>
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
              }`}
            ></div>
            <span>{connectionStatus}</span>
          </div>
          <div className="flex items-center gap-4">
            {selectedFile && (
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded">
                <span className="text-sm truncate max-w-48">
                  {selectedFile.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Side by side layout */}
      <div className="pt-20 min-h-screen p-4">
        <div className="max-w-7xl mx-auto h-full">
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Left: Webcam */}
            <div className="flex-1 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl min-h-0 relative">
              <GestureDetector
                onGestureDetected={handleGestureDetected}
                isDetecting={true}
                currentGesture={currentGesture}
              />
            </div>

            {/* Right: Gesture Controls */}
            <div className="lg:w-[26rem] bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                  <span className="text-2xl">☝️</span>
                  <div>
                    <p className="font-medium">Point Up</p>
                    <p className="text-gray-400">Show QR Code</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                  <span className="text-2xl">✊</span>
                  <div>
                    <p className="font-medium">Fist</p>
                    <p className="text-gray-400">Open File Menu</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                  <span className="text-2xl">👌</span>
                  <div>
                    <p className="font-medium">OK Sign</p>
                    <p className="text-gray-400">Send Selected File</p>
                  </div>
                </div>
              </div>

              {/* Selected file thumbnail display */}
              <div className="mt-6 p-2 bg-gray-700 rounded-lg">
                <div className="flex flex-col items-center justify-center">
                  {selectedFile ? (
                    <div className="flex justify-center w-full">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={selectedFile.name}
                          className="w-full h-full max-w-56 max-h-56 rounded-lg object-contain border border-gray-600"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gray-600 border border-gray-500 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {selectedFile.name.split('.').pop()?.toUpperCase().slice(0, 3) || 'FILE'}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No File Selected</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
