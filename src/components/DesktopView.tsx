import React, { useState, useCallback, useEffect } from "react";
import { GestureDetector } from "./GestureDetector";
import { QRDisplay } from "./QRDisplay";
import { useGestureCapture } from "../hooks/useGestureCapture";
import ConnectionManager from "../utils/connection";

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
  const [connectionManager, setConnectionManager] =
    useState<ConnectionManager | null>(null);

  const { gestures, deleteGesture } = useGestureCapture();

  const initializeConnection = useCallback(async () => {
    try {
      const manager = ConnectionManager.getInstance();
      const connectionInfo = await manager.createConnection();
      setPeerId(connectionInfo.peerId);
      setConnectionManager(manager);

      manager.listenForConnections(() => {
        setConnectionStatus("connected");
      });
    } catch {
      setConnectionStatus("connecting");
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
      }
    },
    [onFileSelect],
  );

  const handleGestureDetected = useCallback(
    async (gesture: string) => {
      if (
        gesture === "send" &&
        selectedFile &&
        connectionManager?.isConnected()
      ) {
        const connections = Array.from(
          connectionManager["connections"].values(),
        );
        if (connections.length > 0) {
          await connectionManager.sendFile(connections[0], selectedFile);
          console.log(`File sent: ${selectedFile.name}`);
        }
      }
    },
    [selectedFile, connectionManager],
  );

  const toggleDetection = useCallback(() => {
    setIsDetecting((prev) => !prev);
  }, []);

  return (
    <div className="space-y-8">
      {/* Connection Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Connection Setup</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Your Peer ID</h3>
            {peerId ? (
              <QRDisplay
                value={peerId}
                title="Mobile devices can scan this code"
                size={200}
              />
            ) : (
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-gray-600">Generating ID...</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Connection Status</h3>
            <div
              className={`p-4 rounded-lg border ${
                connectionStatus === "connected"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : connectionStatus === "connecting"
                    ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                    : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <p className="font-medium">
                {connectionStatus === "connected"
                  ? "✓ Mobile device connected"
                  : connectionStatus === "connecting"
                    ? "Waiting for connection..."
                    : "Ready to connect"}
              </p>
              {connectionManager?.isConnected() && (
                <p className="text-sm mt-1">
                  Connected devices: {connectionManager["connections"].size}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">File Selection</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="fileInput"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Choose file to share
            </label>
            <input
              id="fileInput"
              type="file"
              onChange={handleFileSelect}
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {selectedFile && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700">
                <span className="font-medium">Selected:</span>{" "}
                {selectedFile.name}
                <span className="ml-2 text-sm">
                  ({(selectedFile.size / 1024).toFixed(2)} KB)
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Gesture Detection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Gesture Control</h2>
          <button
            onClick={toggleDetection}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDetecting
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {isDetecting ? "Stop Detection" : "Start Detection"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <GestureDetector
              onGestureDetected={handleGestureDetected}
              isDetecting={isDetecting}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Gesture Instructions</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span>Open hand = Ready state</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span>Closed fist = Grab</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Open hand after grab + movement = Send file</span>
              </div>
            </div>

            {selectedFile && isDetecting && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 text-sm">
                  Make a "send" gesture to transfer {selectedFile.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gesture Library */}
      {gestures.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Detected Gestures</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gestures.map((gesture) => (
              <div
                key={gesture.id}
                className="border border-gray-200 rounded-lg p-3"
              >
                <h3 className="font-medium text-gray-800 mb-2">
                  {gesture.name}
                </h3>
                <div className="text-sm text-gray-600">
                  <p>Points: {gesture.points.length}</p>
                  <p>Duration: {(gesture.duration / 1000).toFixed(2)}s</p>
                </div>
                <button
                  onClick={() => deleteGesture(gesture.id)}
                  className="mt-2 text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
