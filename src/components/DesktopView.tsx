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
  const [isDetecting, setIsDetecting] = useState(false);
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

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

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
    async (gesture: string) => {
      setCurrentGesture(gesture);

      if (gesture === "send" && selectedFile && connections.size > 0) {
        const firstConnection = Array.from(connections.values())[0];
        if (firstConnection) {
          await sendFile(selectedFile, firstConnection);
        }
      }
    },
    [selectedFile, connections, sendFile],
  );

  const toggleDetection = useCallback(() => {
    setIsDetecting((prev) => !prev);
  }, []);

  const canSendFile = selectedFile && connections.size > 0 && isDetecting;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
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

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Gesture Share</h1>
        <div className="flex items-center gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Selection */}
        <div>
          <input
            type="file"
            id="fileInput"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />
          <label
            htmlFor="fileInput"
            className="block bg-gray-800 p-8 rounded-lg text-center cursor-pointer hover:bg-gray-700"
          >
            {selectedFile ? (
              <div>
                <p className="text-lg">{selectedFile.name}</p>
                <p className="text-sm text-gray-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <p>Click to select file</p>
            )}
          </label>
          {canSendFile && (
            <p className="mt-4 text-green-400">Ready to send with gesture</p>
          )}
        </div>

        {/* Gesture Detection */}
        <div>
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
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
          </div>
          <p className="mt-2 text-sm text-gray-400">
            {currentGesture || "No gesture detected"}
          </p>
        </div>
      </div>
    </div>
  );
};
