import React, { useState, useCallback, useEffect } from "react";
import createConnectionManager from "../utils/connection-fp";
import MobileRealtimeConnection from "./MobileRealtimeConnection";

interface MobileViewProps {
  onConnectionEstablished?: () => void;
  onFileReceived?: (fileName: string, fileSize: number) => void;
}

export const MobileView: React.FC<MobileViewProps> = ({
  onConnectionEstablished,
  onFileReceived,
}) => {
  const [peerId, setPeerId] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected"
  >("idle");
  const [targetPeerId, setTargetPeerId] = useState("");
  const [connectionManager, setConnectionManager] = useState<ReturnType<
    typeof createConnectionManager
  > | null>(null);
  
  // Check URL for peer parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const peerParam = urlParams.get('peer');
    if (peerParam) {
      setTargetPeerId(peerParam);
      // Auto-connect when peer ID is in URL
      setTimeout(() => {
        handleMobileConnection(peerParam);
      }, 1000);
    }
  }, []);

  const handleMobileConnection = (peerId: string) => {
    setConnectionStatus("connected");
    setTargetPeerId(peerId);
    onConnectionEstablished?.();
  };

  const handleMobileDisconnect = () => {
    setConnectionStatus("idle");
    setTargetPeerId("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Gesture Share</h1>
          <p className="text-slate-600">Connect to desktop to receive files</p>
        </div>

        <MobileRealtimeConnection
            onConnection={handleMobileConnection}
            onDisconnect={handleMobileDisconnect}
            isConnected={connectionStatus === "connected"}
            targetPeerId={targetPeerId}
          />

          {/* File Receiving Status */}
          {connectionStatus === "connected" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-emerald-900 mb-2">Ready to Receive Files</h3>
              <p className="text-xs text-emerald-700">
                Files sent from desktop will be downloaded automatically to your device.
              </p>
            </div>
          )}
      </div>
    </div>
  );
};
