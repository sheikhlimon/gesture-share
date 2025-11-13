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

// Get connection URL for QR code (works in both local and production)
const getConnectionUrl = async (): Promise<string> => {
  const hostname = window.location.hostname;
  const port = window.location.port || "5174";
  const isProduction =
    !hostname.includes("localhost") &&
    !hostname.includes("127.0.0.1") &&
    hostname !== "localhost";

  if (isProduction) {
    // In production, use the deployed domain
    return `${window.location.protocol}//${hostname}${window.location.port ? `:${port}` : ""}`;
  } else {
    // In local development, try to get the local network IP
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
                    !match[0].startsWith("0.") &&
                    !match[0].startsWith("169.254") // Exclude link-local addresses
                  ) {
                    resolve(match[0]);
                    return;
                  }
                }
              }
              resolve("");
            }, 2000);
          })
          .catch(() => resolve(""));
      } catch {
        resolve("");
      }
    });

    // If we got a valid local IP, use it
    if (localIP) {
      return `http://${localIP}:${port}`;
    }

    // Fallback: use localhost for local development
    return `http://localhost:${port}`;
  }
};

interface DesktopViewProps {
  onFileSelect: (file: File) => void;
}

export const DesktopView: React.FC<DesktopViewProps> = React.memo(
  ({ onFileSelect }) => {
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
    const [notification, setNotification] = useState<{
      type: "success" | "error";
      message: string;
      show: boolean;
    }>({ type: "success", message: "", show: false });

    // Refs for accessing current state in callbacks
    const connectionStatusRef = useRef(connectionStatus);
    const connectionsRef = useRef(connections);
    const peerIdRef = useRef(peerId);
    const selectedFileRef = useRef(selectedFile);

    const peerRef = useRef<Peer.Peer | null>(null);

    // Update refs when state changes
    useEffect(() => {
      connectionStatusRef.current = connectionStatus;
    }, [connectionStatus]);

    useEffect(() => {
      connectionsRef.current = connections;
    }, [connections]);

    useEffect(() => {
      peerIdRef.current = peerId;
    }, [peerId]);

    useEffect(() => {
      selectedFileRef.current = selectedFile;
    }, [selectedFile]);

    useEffect(() => {
      getConnectionUrl().then((url) => {
        setCurrentHost(url);
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
      if (selectedFile && selectedFile.type.startsWith("image/")) {
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
      // Only create PeerJS connection once
      if (peerRef.current) return;

      try {
        setConnectionStatus("connecting");
        const newPeer = new Peer.Peer("", {
          config: {
            iceServers: [
              // Google STUN servers (most reliable)
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
              { urls: "stun:stun2.l.google.com:19302" },

              // Free STUN servers from other providers
              { urls: "stun:stun.cloudflare.com:3478" },
              { urls: "stun:stun.services.mozilla.com" },
              { urls: "stun:stun.relay.metered.ca:80" },

              // Free TURN servers (for fallback when STUN fails)
              {
                urls: "turn:openrelay.metered.ca:80",
                username: "openrelayproject",
                credential: "openrelayproject",
              },
              {
                urls: "turn:openrelay.metered.ca:443",
                username: "openrelayproject",
                credential: "openrelayproject",
              },
            ],
          },
        });
        peerRef.current = newPeer;

        newPeer.on("open", (id) => {
          setPeerId(id);
          setConnectionStatus("idle");
        });

        newPeer.on("connection", (conn) => {
          // Answer the connection
          conn.on("open", () => {
            setConnections((prev) => new Map(prev).set(conn.peer, conn));
            setConnectionStatus("connected");
            setShowQRModal(false); // Close QR modal when connected
          });

          conn.on("close", () => {
            setConnections((prev) => {
              const newMap = new Map(prev);
              newMap.delete(conn.peer);
              if (newMap.size === 0) {
                setConnectionStatus("idle");
              }
              return newMap;
            });
          });
        });

        newPeer.on("error", (error) => {
          console.error("PeerJS error:", error);
          setConnectionStatus("idle");
        });

        return () => {
          console.log("Cleaning up PeerJS connection...");
          if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
          }
        };
      } catch (error) {
        console.error("Peer initialization error:", error);
        setConnectionStatus("idle");
      }
    }, []); // No dependencies - only run once

    const [showFilePickerButton, setShowFilePickerButton] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const countdownIntervalRef = useRef<number | null>(null);

    const openFilePickerDirectly = useCallback(() => {
      // Clear countdown when file picker is opened
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setCountdown(0);

      // Create and trigger file input immediately (user activated)
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*,.pdf,.doc,.docx,.txt";
      fileInput.style.position = "absolute";
      fileInput.style.left = "-9999px";
      fileInput.style.top = "-9999px";

      fileInput.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          const file = files[0];
          setSelectedFile(file);
          onFileSelect(file);
        }
        document.body.removeChild(fileInput);
        setShowFilePickerButton(false);
        setCountdown(0);
      };

      fileInput.oncancel = () => {
        console.log("File picker cancelled");
        document.body.removeChild(fileInput);
        setShowFilePickerButton(false);
        setCountdown(0);
      };

      document.body.appendChild(fileInput);

      // This should work because it's triggered by a user click
      fileInput.click();
    }, [onFileSelect]);

    const triggerFilePickerFlow = useCallback(() => {
      // Clear any existing countdown first
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      // Show the button overlay for user to click
      setShowFilePickerButton(true);
      setCountdown(10);

      // Start countdown timer
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Clear interval when countdown reaches 0
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setShowFilePickerButton(false);
            setCountdown(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, []);

    // Cleanup countdown interval on unmount
    useEffect(() => {
      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    }, []);

    const showNotification = useCallback(
      (type: "success" | "error", message: string) => {
        setNotification({ type, message, show: true });
        setTimeout(() => {
          setNotification((prev) => ({ ...prev, show: false }));
        }, 4000);
      },
      [],
    );

    const sendFile = useCallback(
      async (file: File, connection: Peer.DataConnection) => {
        try {
          const fileId = Date.now().toString();
          const fileStart = {
            type: "file-start",
            fileId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          } as FileStart;
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

          // Show success notification
          showNotification("success", `✅ ${file.name} sent successfully!`);
        } catch (error) {
          console.error("Failed to send file:", error);
          showNotification("error", `❌ Failed to send ${file.name}`);
        }
      },
      [showNotification],
    );

    const handleGestureDetected = useCallback(
      async (gesture: string) => {
        setCurrentGesture(gesture);

        // Use refs to access current state without causing re-renders
        const currentStatus = connectionStatusRef.current;
        const currentConnections = connectionsRef.current;
        const currentFile = selectedFileRef.current;

        switch (gesture) {
          case "POINT_UP":
            if (currentStatus !== "connected") {
              setShowQRModal(true);
            }
            break;

          case "FIST":
            // Trigger file picker flow (shows button overlay)
            triggerFilePickerFlow();
            break;

          case "PEACE_SIGN":
            if (currentFile && currentConnections.size > 0) {
              const firstConnection = Array.from(
                currentConnections.values(),
              )[0];
              if (firstConnection) {
                await sendFile(currentFile, firstConnection);
              }
            } else {
              if (!currentFile) {
                console.log("ERROR: No file selected");
              }
              if (currentConnections.size === 0) {
                console.log("ERROR: No active connections");
              }
            }
            break;
        }
      },
      [sendFile, triggerFilePickerFlow],
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
                  value={`${currentHost}/connect?peer=${peerId}`}
                  size={200}
                  title=""
                />
                <div className="mt-3">
                  <p className="text-gray-400 text-xs">
                    📱 Scan this QR code with your phone
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Connect from anywhere, any network
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Picker Button Overlay */}
        {showFilePickerButton && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowFilePickerButton(false);
              // Clear countdown when modal is closed by clicking outside
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              setCountdown(0);
            }}
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
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Select File to Share
                </button>
                <p className="text-xs text-gray-500 mt-3">
                  This button will disappear in {countdown} seconds
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold">Gesture Share</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-green-500"
                      : connectionStatus === "connecting"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                  }`}
                ></div>
                <span className="text-sm">
                  {connectionStatus === "connected"
                    ? "Connected"
                    : connectionStatus === "connecting"
                      ? "Connecting..."
                      : "Not Connected"}
                </span>
              </div>
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
                    <span className="text-2xl">✌️</span>
                    <div>
                      <p className="font-medium">Peace Sign</p>
                      <p className="text-gray-400">Send Selected File</p>
                    </div>
                  </div>
                </div>

                {/* Selected file thumbnail display */}
                <div className="mt-6 p-2 bg-gray-700 rounded-lg">
                  <div className="flex flex-col items-center justify-center">
                    {selectedFile ? (
                      <>
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
                                {selectedFile.name
                                  .split(".")
                                  .pop()
                                  ?.toUpperCase()
                                  .slice(0, 3) || "FILE"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-xs text-gray-300 truncate max-w-48">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-green-400 font-medium mt-1">
                            Ready to share
                          </p>
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        No File Selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern File Transfer Notification */}
        {notification.show && (
          <div
            className={`fixed top-20 right-4 z-50 max-w-sm transform transition-all duration-300 ease-out animate-in slide-in-from-right-5 ${
              notification.type === "success"
                ? "bg-white/95 backdrop-blur-lg border-green-200 shadow-green-100"
                : "bg-white/95 backdrop-blur-lg border-red-200 shadow-red-100"
            } border-2 rounded-2xl shadow-2xl p-4`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 rounded-full p-2 ${
                  notification.type === "success"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {notification.type === "success" ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-sm ${
                    notification.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {notification.type === "success" ? "Success" : "Error"}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    notification.type === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() =>
                  setNotification((prev) => ({ ...prev, show: false }))
                }
                className={`flex-shrink-0 rounded-full p-1 transition-colors ${
                  notification.type === "success"
                    ? "hover:bg-green-100 text-green-400"
                    : "hover:bg-red-100 text-red-400"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Auto-dismiss indicator */}
            <div
              className={`mt-3 flex items-center gap-2 text-xs ${
                notification.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  notification.type === "success"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <span>Auto-dismissing in 4 seconds</span>
            </div>
          </div>
        )}
      </div>
    );
  },
);

DesktopView.displayName = "DesktopView";
