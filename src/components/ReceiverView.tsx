import React, { useState, useCallback } from "react";
import createConnectionManager from "../utils/connection-fp";

interface ReceiverViewProps {
  onConnectionEstablished: () => void;
  onFileReceived: (fileName: string, fileSize: number) => void;
}

export const ReceiverView: React.FC<ReceiverViewProps> = ({
  onConnectionEstablished,
  onFileReceived,
}) => {
  const [peerId, setPeerId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [error, setError] = useState("");

  const handleConnect = useCallback(async () => {
    if (!peerId.trim()) {
      setError("Please enter a valid peer ID");
      return;
    }

    setIsConnecting(true);
    setConnectionStatus("connecting");
    setError("");

    try {
      const connectionManager = createConnectionManager();
      await connectionManager.initializeConnection();

      await connectionManager.connectToPeer(peerId.trim());
      setConnectionStatus("connected");
      onConnectionEstablished();

      // Set up file transfer handling
      connectionManager.state.connections.forEach((connection) => {
        connection.on("data", (data) => {
          connectionManager.handleFileTransfer(data);
          if (data.type === "file-end") {
            const transfer = connectionManager.state.fileTransfers.get(
              data.fileId,
            );
            if (transfer) {
              onFileReceived(transfer.fileName, transfer.fileSize);
            }
          }
        });
      });
    } catch {
      setConnectionStatus("error");
      setError("Failed to connect. Please check the peer ID and try again.");
    } finally {
      setIsConnecting(false);
    }
  }, [peerId, onConnectionEstablished, onFileReceived]);

  const handlePeerIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPeerId(e.target.value);
      if (error) setError("");
    },
    [error],
  );

  const getStatusColor = useCallback(() => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-600 bg-green-50 border-green-200";
      case "connecting":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  }, [connectionStatus]);

  const getStatusText = useCallback(() => {
    switch (connectionStatus) {
      case "connected":
        return "Connected to desktop";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Connection failed";
      default:
        return "Ready to connect";
    }
  }, [connectionStatus]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        Connect to Desktop
      </h2>

      <div className={`p-4 rounded-lg border mb-6 ${getStatusColor()}`}>
        <p className="text-sm font-medium">{getStatusText()}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="peerId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Desktop Peer ID
          </label>
          <input
            id="peerId"
            type="text"
            value={peerId}
            onChange={handlePeerIdChange}
            placeholder="Enter desktop code..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isConnecting || connectionStatus === "connected"}
          />
        </div>

        <button
          onClick={handleConnect}
          disabled={
            isConnecting || connectionStatus === "connected" || !peerId.trim()
          }
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isConnecting
            ? "Connecting..."
            : connectionStatus === "connected"
              ? "Connected"
              : "Connect"}
        </button>
      </div>

      {connectionStatus === "connected" && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">
            ✓ Connection established. You can now receive gestures from the
            desktop.
          </p>
        </div>
      )}
    </div>
  );
};
