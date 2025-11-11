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
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
            Connect to Desktop
          </h2>

          <div className={`p-4 rounded-lg border mb-6 ${
            connectionStatus === "connected"
              ? "bg-green-50 border-green-200 text-green-700"
              : connectionStatus === "connecting"
                ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                : connectionStatus === "error"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-gray-50 border-gray-200 text-gray-700"
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                    ? "bg-yellow-500"
                    : connectionStatus === "error"
                      ? "bg-red-500"
                      : "bg-gray-500"
              }`}></div>
              <p className="text-sm font-medium">
                {connectionStatus === "connected"
                  ? "Connected to desktop"
                  : connectionStatus === "connecting"
                    ? "Connecting..."
                    : connectionStatus === "error"
                      ? "Connection failed"
                      : "Ready to connect"}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="peerId" className="label">
                Desktop Peer ID
              </label>
              <input
                id="peerId"
                type="text"
                value={peerId}
                onChange={handlePeerIdChange}
                placeholder="Enter desktop code..."
                className="input"
                disabled={isConnecting || connectionStatus === "connected"}
              />
            </div>

            <button
              onClick={handleConnect}
              disabled={
                isConnecting || connectionStatus === "connected" || !peerId.trim()
              }
              className="btn btn-primary btn-md w-full"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Connecting...
                </>
              ) : connectionStatus === "connected" ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  Connected
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Connect
                </>
              )}
            </button>
          </div>

          {connectionStatus === "connected" && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm font-medium text-green-700">Connection established</p>
              </div>
              <p className="text-xs text-green-600">
                You can now receive gestures from the desktop.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
