import React, { useState, useCallback, useEffect, useRef } from "react";
import { GestureDetector } from "./GestureDetector";
import { QRDisplay } from "./QRDisplay";
import { Modal } from "./Modal";
import { createNotification } from "../utils/notifications";
import { NotificationDisplay } from "./NotificationDisplay";
import { sendFile, createFileInput } from "../utils/fileTransfer";
import { getConnectionUrl } from "../utils/network";
import type { NotificationState, ConnectionStatus } from "../types";
import * as Peer from "peerjs";

// DesktopView component doesn't require any props

export const DesktopView: React.FC = React.memo(() => {
  const [peerId, setPeerId] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [connections, setConnections] = useState<
    Map<string, Peer.DataConnection>
  >(new Map());
  const [currentGesture, setCurrentGesture] = useState<string>("");
  const [currentHost, setCurrentHost] = useState<string>("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    type: "success",
    message: "",
    show: false,
  });

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

    const fileInput = createFileInput(
      (file) => {
        setSelectedFile(file);
        setShowFilePickerButton(false);
        setCountdown(0);
      },
      () => {
        setShowFilePickerButton(false);
        setCountdown(0);
      },
    );

    fileInput.click();
  }, []);

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
      createNotification(setNotification, type, message);
    },
    [],
  );

  const handleSendFile = useCallback(
    async (file: File, connection: Peer.DataConnection) => {
      await sendFile(file, connection, showNotification);
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
            const firstConnection = Array.from(currentConnections.values())[0];
            if (firstConnection) {
              await handleSendFile(currentFile, firstConnection);
            }
          } else {
            if (!currentFile) {
              showNotification("error", "No file selected");
            }
            if (currentConnections.size === 0) {
              showNotification("error", "No active connections");
            }
          }
          break;
      }
    },
    [handleSendFile, triggerFilePickerFlow, showNotification],
  );

  return (
    <div className="h-screen bg-gray-900 text-white">
      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal && connectionStatus !== "connected" && !!peerId}
        onClose={() => setShowQRModal(false)}
      >
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-semibold mb-3 font-display">
            Connect Your Phone
          </h3>
          <QRDisplay
            value={`${currentHost}/connect?peer=${peerId}`}
            size={180}
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
      </Modal>

      {/* File Picker Modal */}
      <Modal
        isOpen={showFilePickerButton}
        onClose={() => {
          setShowFilePickerButton(false);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setCountdown(0);
        }}
        className="z-50"
      >
        <div className="text-center">
          <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">✊</div>
          <h3 className="text-base sm:text-lg font-semibold mb-2 font-display">
            Fist Gesture Detected
          </h3>
          <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
            Click the button below to open the file selector
          </p>
          <button
            onClick={openFilePickerDirectly}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
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
      </Modal>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur p-2 sm:p-3 lg:p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4">
            {/* Logo */}
            <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center shadow-lg">
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-5 lg:h-5 text-white"
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
              <h1 className="text-base sm:text-lg lg:text-2xl font-bold font-display bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
                Gesture Share
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-800 px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded">
              <div
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "connecting"
                      ? "bg-yellow-500"
                      : "bg-gray-500"
                }`}
              ></div>
              <span className="text-xs sm:text-xs lg:text-sm">
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
      <div className="h-screen pt-14 sm:pt-16 lg:pt-20">
        <div className="h-full p-2 sm:p-3 lg:p-4">
          <div className="max-w-7xl mx-auto h-full">
            <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 lg:gap-6 h-full">
              {/* Left: Webcam */}
              <div className="flex-1 lg:flex-auto bg-gray-800 rounded-2xl overflow-hidden shadow-2xl min-h-[50vh] lg:min-h-0 relative">
                <GestureDetector
                  onGestureDetected={handleGestureDetected}
                  isDetecting={true}
                  currentGesture={
                    showFilePickerButton ? "FILE_PICKER_ACTIVE" : currentGesture
                  }
                  onHandDetected={() => {
                    // We don't need to do anything with this state
                    // The GestureDetector component handles showing/hiding the tips internally
                  }}
                />
              </div>

              {/* Right: Gesture Controls */}
              <div className="w-full lg:w-80 xl:w-[26rem] bg-gray-800 rounded-lg p-2.5 sm:p-3 lg:p-5 xl:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3 lg:gap-4 text-sm lg:text-base">
                  <div className="flex items-center justify-center gap-2 lg:gap-3 p-3 lg:p-4 bg-gray-700 rounded-lg">
                    <span className="text-xl lg:text-2xl">☝️</span>
                    <div>
                      <p className="font-semibold text-sm lg:text-base text-center">
                        Point Up
                      </p>
                      <p className="text-gray-400 text-xs lg:text-sm text-center">
                        Show QR Code
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 lg:gap-3 p-3 lg:p-4 bg-gray-700 rounded-lg">
                    <span className="text-xl lg:text-2xl">✊</span>
                    <div>
                      <p className="font-semibold text-sm lg:text-base text-center">
                        Fist
                      </p>
                      <p className="text-gray-400 text-xs lg:text-sm text-center">
                        Open File Menu
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 lg:gap-3 p-3 lg:p-4 bg-gray-700 rounded-lg">
                    <span className="text-xl lg:text-2xl">✌️</span>
                    <div>
                      <p className="font-semibold text-sm lg:text-base text-center">
                        Peace Sign
                      </p>
                      <p className="text-gray-400 text-xs lg:text-sm text-center">
                        Send Selected File
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected file thumbnail display */}
                <div className="mt-3 sm:mt-4 lg:mt-6 p-2 bg-gray-700 rounded-lg">
                  <div className="flex flex-col items-center justify-center">
                    {selectedFile ? (
                      <>
                        <div className="flex justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={selectedFile.name}
                              className="w-full h-full rounded-lg object-contain border border-gray-600"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-600 border border-gray-500 flex items-center justify-center">
                              <span className="text-xs sm:text-sm font-bold text-white">
                                {selectedFile.name
                                  .split(".")
                                  .pop()
                                  ?.toUpperCase()
                                  .slice(0, 3) || "FILE"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-xs text-gray-300 truncate max-w-32 sm:max-w-40">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-green-400 font-medium mt-1">
                            Ready to share
                          </p>
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs sm:text-sm">
                        No File Selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Display */}
      <NotificationDisplay
        notification={notification}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
});

DesktopView.displayName = "DesktopView";
