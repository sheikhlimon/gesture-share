import React, { useState, useCallback } from "react";
import { DesktopView } from "./components/DesktopView";
import { ReceiverView } from "./components/ReceiverView";

type DeviceMode = "desktop" | "mobile";

function App() {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");

  const [receivedFiles, setReceivedFiles] = useState<
    Array<{ name: string; size: number; timestamp: number }>
  >([]);

  const detectDeviceMode = useCallback(() => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) || window.innerWidth < 768;
    setDeviceMode(isMobile ? "mobile" : "desktop");
  }, []);

  React.useEffect(() => {
    detectDeviceMode();
  }, [detectDeviceMode]);

  const handleFileSelect = useCallback((file: File) => {
    console.log("File selected for sharing:", file.name);
  }, []);

  const handleConnectionEstablished = useCallback(() => {
    // Connection established
  }, []);

  const handleFileReceived = useCallback(
    (fileName: string, fileSize: number) => {
      setReceivedFiles((prev) => [
        ...prev,
        { name: fileName, size: fileSize, timestamp: Date.now() },
      ]);
    },
    [],
  );

  const toggleDeviceMode = useCallback(() => {
    setDeviceMode((prev) => (prev === "desktop" ? "mobile" : "desktop"));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="text-center py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Gesture Share
              </h1>
              <p className="text-gray-600">
                Share files with hand gestures across devices
              </p>
            </div>
            <button
              onClick={toggleDeviceMode}
              className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-sm font-medium text-gray-700"
            >
              Switch to {deviceMode === "desktop" ? "Mobile" : "Desktop"} View
            </button>
          </div>

          <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow">
            <span className="text-sm font-medium text-gray-600">
              Current Mode:
            </span>
            <span className="text-sm font-bold text-blue-600 capitalize">
              {deviceMode}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-8">
        {deviceMode === "desktop" ? (
          <DesktopView onFileSelect={handleFileSelect} />
        ) : (
          <div className="space-y-8">
            <ReceiverView
              onConnectionEstablished={handleConnectionEstablished}
              onFileReceived={handleFileReceived}
            />

            {/* Received Files */}
            {receivedFiles.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Received Files</h2>
                <div className="space-y-3">
                  {receivedFiles.map((file, index) => (
                    <div
                      key={`${file.timestamp}-${index}`}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024).toFixed(2)} KB •{" "}
                          {new Date(file.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-green-600">
                        <span className="text-sm">✓ Downloaded</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 px-4 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm">
            Share files seamlessly using hand gestures • Built with MediaPipe,
            TensorFlow.js, and WebRTC
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
