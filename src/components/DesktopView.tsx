import React, { useState, useCallback, useEffect, useRef } from "react";
import { GestureDetector } from "./GestureDetector";
import { QRDisplay } from "./QRDisplay";
import { FileSelector } from "./FileSelector";
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

// Get local IP
const getLocalIP = async (): Promise<string> => {
  const webrtcIP = await new Promise<string>((resolve) => {
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
                if (match) {
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

  if (webrtcIP) return webrtcIP;

  if (
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return window.location.hostname;
  }

  return (
    window.prompt("Enter your local IP address (e.g., 192.168.1.100):") ||
    "localhost"
  );
};

interface DesktopViewProps {
  onFileSelect: (file: File) => void;
}

export const DesktopView: React.FC<DesktopViewProps> = ({ onFileSelect }) => {
  const [peerId, setPeerId] = useState("");
  const [isDetecting, setIsDetecting] = useState(true); // Start with detection on
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected"
  >("idle");
  const [connections, setConnections] = useState<
    Map<string, Peer.DataConnection>
  >(new Map());
  const [currentGesture, setCurrentGesture] = useState<string>("");
  const [localIP, setLocalIP] = useState<string>("localhost");
  const [showQRModal, setShowQRModal] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [fileSelectorIndex, setFileSelectorIndex] = useState(0);
  const [availableFiles, setAvailableFiles] = useState<File[]>([]);

  const peerRef = useRef<Peer.Peer | null>(null);

  useEffect(() => {
    getLocalIP().then((ip) => setLocalIP(ip));
  }, []);

  useEffect(() => {
    if (peerRef.current) return;

    try {
      setConnectionStatus("connecting");
      const newPeer = new Peer.Peer({
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });
      peerRef.current = newPeer;

      newPeer.on("open", (id) => {
        setPeerId(id);
        setConnectionStatus("idle");
      });

      newPeer.on("connection", (conn) => {
        setConnections((prev) => new Map(prev).set(conn.peer, conn));
        setConnectionStatus("connected");

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

  const sendFile = useCallback(
    async (file: File, connection: Peer.DataConnection) => {
      try {
        const fileId = Date.now().toString();
        connection.send({
          type: "file-start",
          fileId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        } as FileStart);

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
    async (gesture: string, position: { x: number; y: number }) => {
      setCurrentGesture(gesture);

      // Debug logging - position parameter needed for interface compatibility
      console.log("Gesture detected in DesktopView:", gesture, position);

      switch (gesture) {
        case "PEACE":
          if (connectionStatus !== "connected" && peerId) {
            setShowQRModal(true);
          }
          break;

        case "THUMBS_UP":
          if (showFileSelector && availableFiles.length > 0) {
            // Select the currently highlighted file
            const selectedFile =
              availableFiles[fileSelectorIndex % availableFiles.length];
            setSelectedFile(selectedFile);
            onFileSelect(selectedFile);
            setShowFileSelector(false);
          } else {
            setShowFileSelector(true);
          }
          break;

        case "POINT":
          // Navigate through files when file selector is open
          if (showFileSelector && availableFiles.length > 0) {
            setFileSelectorIndex((prev) => (prev + 1) % availableFiles.length);
          }
          break;

        case "send":
          if (selectedFile && connections.size > 0) {
            const firstConnection = Array.from(connections.values())[0];
            if (firstConnection) {
              await sendFile(selectedFile, firstConnection);
            }
          }
          break;
      }
    },
    [
      selectedFile,
      connections,
      sendFile,
      connectionStatus,
      peerId,
      showFileSelector,
      availableFiles,
      fileSelectorIndex,
    ],
  );

  const toggleDetection = useCallback(() => {
    setIsDetecting((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* QR Modal */}
      {showQRModal && peerId && connectionStatus !== "connected" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-gray-800 p-8 rounded-2xl max-w-sm w-full mx-4">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              ✕
            </button>
            <QRDisplay
              value={`http://${localIP}:5173/connect?peer=${peerId}`}
              title=""
              className=""
            />
            <p className="text-center mt-4 text-gray-300">Scan to connect</p>
          </div>
        </div>
      )}

      {/* File Selector Modal */}
      <FileSelector
        isVisible={showFileSelector}
        selectedIndex={fileSelectorIndex}
        onSelect={(file) => {
          setSelectedFile(file);
          onFileSelect(file);
          setShowFileSelector(false);
        }}
        onClose={() => setShowFileSelector(false)}
        onFilesChange={setAvailableFiles}
      />

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
              <span className="text-sm bg-gray-800 px-3 py-1 rounded">
                {selectedFile.name}
              </span>
            )}
            {connectionStatus !== "connected" && peerId && (
              <button
                onClick={() => setShowQRModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Show QR
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Webcam focused */}
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="max-w-4xl w-full mx-4">
          {/* Central Webcam */}
          <div className="relative bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <GestureDetector
              onGestureDetected={handleGestureDetected}
              isDetecting={isDetecting}
            />
            <button
              onClick={toggleDetection}
              className={`absolute top-4 right-4 px-3 py-1 rounded ${
                isDetecting ? "bg-blue-600" : "bg-gray-600"
              }`}
            >
              {isDetecting ? "ON" : "OFF"}
            </button>

            {/* Gesture Status Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded">
              <p className="text-white text-sm font-medium">
                {currentGesture || "none"}
              </p>
            </div>
          </div>

          {/* Gesture Instructions */}
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Gesture Controls</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✌️</span>
                <div>
                  <p className="font-medium">Peace Sign</p>
                  <p className="text-gray-400">Show QR Code</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">👍</span>
                <div>
                  <p className="font-medium">Thumbs Up</p>
                  <p className="text-gray-400">Select File</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">✊→✋</span>
                <div>
                  <p className="font-medium">Grab & Release</p>
                  <p className="text-gray-400">Send File</p>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                Current gesture:{" "}
                <span className="text-white font-medium">
                  {currentGesture || "none"}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => setShowFileSelector(true)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
            >
              <span>📁</span> Select File
            </button>
            {selectedFile && connections.size > 0 && (
              <button
                onClick={() => {
                  const firstConnection = Array.from(connections.values())[0];
                  if (firstConnection) {
                    sendFile(selectedFile, firstConnection);
                  }
                }}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
              >
                <span>📤</span> Send File
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
