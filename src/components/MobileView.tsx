import React, { useState, useEffect, useRef } from "react";
import * as Peer from "peerjs";

interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileId?: string;
}

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

interface MobileViewProps {
  onConnectionEstablished?: () => void;
  onFileReceived?: (fileName: string, fileSize: number) => void;
}

export const MobileView: React.FC<MobileViewProps> = ({
  onConnectionEstablished,
  onFileReceived,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected"
  >("idle");
  const [desktopPeerId, setDesktopPeerId] = useState("");
  const [fileReceivingStatus, setFileReceivingStatus] = useState<string>("");
  const fileChunksRef = useRef<
    Map<string, { chunks: ArrayBuffer[]; info: FileMetadata }>
  >(new Map());
  const connectionAttempted = useRef(false);

  useEffect(() => {
    if (connectionAttempted.current) return;
    connectionAttempted.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const peerParam = urlParams.get("peer");
    if (peerParam) {
      setDesktopPeerId(peerParam);
      connectToDesktop(peerParam);
    }
  }, [connectToDesktop]);

  const connectToDesktop = async (desktopPeerId: string) => {
    try {
      setConnectionStatus("connecting");
      const mobilePeer = new Peer.Peer({
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ],
        },
      });

      mobilePeer.on("open", () => {
        const conn = mobilePeer.connect(desktopPeerId);

        conn.on("open", () => {
          setConnectionStatus("connected");
          onConnectionEstablished?.();
        });

        conn.on("data", (data: unknown) => {
          const fileTransferData = data as FileChunk | FileStart | FileEnd;
          if (fileTransferData.type === "file-start") {
            setFileReceivingStatus(`Receiving: ${fileTransferData.fileName}`);
            onFileReceived?.(
              fileTransferData.fileName || "Unknown",
              fileTransferData.fileSize || 0,
            );

            fileChunksRef.current.set(fileTransferData.fileId || "default", {
              chunks: [],
              info: fileTransferData,
            });
          } else if (fileTransferData.type === "file-chunk") {
            const existingFileData = fileChunksRef.current.get(
              fileTransferData.fileId || "default",
            );
            if (existingFileData) {
              existingFileData.chunks[fileTransferData.chunkIndex] =
                fileTransferData.chunk;
            }
          } else if (fileTransferData.type === "file-end") {
            const existingFileData = fileChunksRef.current.get(
              fileTransferData.fileId || "default",
            );
            if (existingFileData && existingFileData.chunks.length > 0) {
              setFileReceivingStatus(
                `Processing: ${existingFileData.info.fileName}`,
              );

              const blob = new Blob(existingFileData.chunks, {
                type: existingFileData.info.fileType,
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = existingFileData.info.fileName;
              a.click();
              URL.revokeObjectURL(url);

              setFileReceivingStatus(
                `Downloaded: ${existingFileData.info.fileName}`,
              );
              fileChunksRef.current.delete(
                fileTransferData.fileId || "default",
              );
            }
          }
        });

        conn.on("close", () => {
          setConnectionStatus("idle");
        });

        conn.on("error", () => {
          setConnectionStatus("idle");
        });
      });

      mobilePeer.on("error", () => {
        setConnectionStatus("idle");
        mobilePeer.destroy();
      });
    } catch (error) {
      console.error("Mobile peer initialization error:", error);
      setConnectionStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Gesture Share
          </h1>
          <p className="text-slate-600">Connect to desktop to receive files</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="text-center">
            <div className="mb-6">
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  connectionStatus === "connected"
                    ? "bg-green-100"
                    : connectionStatus === "connecting"
                      ? "bg-amber-100"
                      : "bg-gray-100"
                }`}
              >
                {connectionStatus === "connected" ? (
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : connectionStatus === "connecting" ? (
                  <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    className="w-8 h-8 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m9.032 4.026A9.001 9.001 0 012.968 7.326"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {connectionStatus === "connected"
                  ? "Connected"
                  : connectionStatus === "connecting"
                    ? "Connecting..."
                    : desktopPeerId
                      ? "Waiting to connect"
                      : "Ready to Connect"}
              </h3>
              <p className="text-gray-600 mb-1">
                {desktopPeerId
                  ? `Desktop ID: ${desktopPeerId.substring(0, 8)}...`
                  : "Scan QR code from desktop"}
              </p>
            </div>

            {fileReceivingStatus && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-emerald-800">
                  {fileReceivingStatus}
                </p>
              </div>
            )}

            {connectionStatus === "connected" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-emerald-900 mb-2">
                  Ready to Receive Files
                </h3>
                <p className="text-xs text-emerald-700">
                  Files will be downloaded automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
