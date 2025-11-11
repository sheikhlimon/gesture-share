import React, { useState, useEffect } from "react";

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
  const [fileReceivingStatus, setFileReceivingStatus] = useState<string>("");
  
  // Check URL for peer parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const peerParam = urlParams.get('peer');
    if (peerParam) {
      setTargetPeerId(peerParam);
      // Create a simple peer connection to desktop
      connectToDesktop(peerParam);
    }
  }, []);

  const [fileChunks, setFileChunks] = useState<Map<string, {chunks: ArrayBuffer[], info: any}>>(new Map());
  
  const connectToDesktop = async (desktopPeerId: string) => {
    try {
      setConnectionStatus("connecting");
      setPeerId(`mobile-${Math.random().toString(36).substr(2, 9)}`);
      
      // Create a simple peer without initializing a full connection manager
      // We'll just connect directly to the desktop peer
      const { Peer } = await import("peerjs");
      const mobilePeer = new Peer();
      
      mobilePeer.on('open', () => {
        console.log('Mobile peer opened, connecting to desktop:', desktopPeerId);
        const conn = mobilePeer.connect(desktopPeerId);
        
        conn.on('open', () => {
          console.log('Connected to desktop!');
          setConnectionStatus("connected");
          onConnectionEstablished?.();
          
          // Listen for file data
          conn.on('data', (data) => {
            console.log('Received data:', data);
            
            if (data.type === "file-start") {
              setFileReceivingStatus(`Receiving: ${data.fileName}`);
              onFileReceived?.(data.fileName || "Unknown", data.fileSize || 0);
              
              // Initialize file chunks storage
              setFileChunks(prev => {
                const newMap = new Map(prev);
                newMap.set(data.fileId, {
                  chunks: [],
                  info: data
                });
                return newMap;
              });
            } else if (data.type === "file-chunk") {
              // Store chunk
              setFileChunks(prev => {
                const newMap = new Map(prev);
                const fileData = newMap.get(data.fileId);
                if (fileData) {
                  fileData.chunks[data.chunkIndex] = data.chunk;
                  newMap.set(data.fileId, fileData);
                }
                return newMap;
              });
            } else if (data.type === "file-end") {
              // Assemble file from chunks
              const fileData = fileChunks.get(data.fileId);
              if (fileData && fileData.chunks.length > 0) {
                setFileReceivingStatus(`Processing: ${fileData.info.fileName}`);
                
                // Combine chunks
                const blob = new Blob(fileData.chunks, { type: fileData.info.fileType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileData.info.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                setFileReceivingStatus(`Downloaded: ${fileData.info.fileName}`);
                
                // Clean up
                setFileChunks(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(data.fileId);
                  return newMap;
                });
              }
            }
          });
        });
        
        conn.on('error', (err) => {
          console.error('Connection error:', err);
          setConnectionStatus("idle");
        });
      });
      
      mobilePeer.on('error', (err) => {
        console.error('Peer error:', err);
        setConnectionStatus("idle");
      });
      
    } catch (error) {
      console.error("Failed to connect:", error);
      setConnectionStatus("idle");
    }
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

        {/* Connection Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="text-center">
            <div className="mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                connectionStatus === "connected" 
                  ? "bg-green-100" 
                  : connectionStatus === "connecting"
                    ? "bg-amber-100"
                    : "bg-gray-100"
              }`}>
                {connectionStatus === "connected" ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : connectionStatus === "connecting" ? (
                  <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m9.032 4.026A9.001 9.001 0 012.968 7.326" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {connectionStatus === "connected" 
                  ? "Connected" 
                  : connectionStatus === "connecting"
                    ? "Connecting..."
                    : "Ready to Connect"
                }
              </h3>
              <p className="text-gray-600 mb-1">
                {targetPeerId 
                  ? `Connecting to: ${targetPeerId.substring(0, 8)}...`
                  : "Scan QR code from desktop"
                }
              </p>
              <p className="text-sm text-gray-500">
                Your ID: {peerId.substring(0, 8)}...
              </p>
            </div>

            {/* File Receiving Status */}
            {fileReceivingStatus && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-emerald-800">{fileReceivingStatus}</p>
              </div>
            )}

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
      </div>
    </div>
  );
};
