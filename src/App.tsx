import React, { useState, useCallback, useEffect } from "react";
import { DesktopView } from "./components/DesktopView";
import { MobileView } from "./components/MobileView";

function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationProgress, setInitializationProgress] = useState({
    camera: false,
    handDetection: false,
    deviceDetection: false,
  });

  const detectDevice = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    // Prioritize user agent detection - check for mobile browsers
    const isMobileBrowser =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent,
      );
    // Only use width as fallback for very small screens (under 500px)
    const isSmallScreen = window.innerWidth < 500;
    const isMobileDevice = isMobileBrowser || isSmallScreen;
    setIsMobile(isMobileDevice);
    setInitializationProgress((prev) => ({ ...prev, deviceDetection: true }));
  }, []);

  const initializeCameraAndDetection = useCallback(async () => {
    try {
      // Skip camera pre-warming to avoid conflicts with GestureDetector
      // Let the GestureDetector handle camera initialization directly
      setInitializationProgress((prev) => ({ ...prev, camera: true }));

      // Skip MediaPipe pre-loading to avoid conflicts
      // Let the GestureDetector handle model loading
      setTimeout(() => {
        setInitializationProgress((prev) => ({ ...prev, handDetection: true }));
      }, 300);
    } catch (error) {
      console.error("Failed to initialize:", error);
      setInitializationProgress((prev) => ({
        ...prev,
        camera: true,
        handDetection: true,
      }));
    }
  }, []);

  // Check if URL has peer parameter - if so, force mobile view
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasPeerParam = urlParams.has("peer");
    const peerParam = urlParams.get("peer");

    if (hasPeerParam && peerParam) {
      setIsMobile(true);
      setIsLoading(false); // Skip loading for QR connections
      setInitializationProgress({
        camera: true,
        handDetection: true,
        deviceDetection: true,
      });
      return; // Skip normal device detection
    }

    // Normal device detection for desktop usage
    detectDevice();
    initializeCameraAndDetection();
  }, [detectDevice, initializeCameraAndDetection]);

  // Separate effect to check initialization progress
  useEffect(() => {
    if (Object.values(initializationProgress).every(Boolean)) {
      setIsLoading(false);
    }
  }, [initializationProgress]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          {/* Loading animation */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">👋</span>
            </div>
          </div>

          {/* App title */}
          <h1 className="text-3xl font-bold text-white mb-2">Gesture Share</h1>
          <p className="text-gray-400 mb-6">
            Initializing camera and hand detection...
          </p>

          {/* Loading dots animation */}
          <div className="flex justify-center gap-2">
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>

          {/* Loading progress */}
          <div className="mt-8 text-sm text-gray-500">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${initializationProgress.deviceDetection ? "bg-green-500" : "bg-gray-600"}`}
                ></div>
                <span>Device detection</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${initializationProgress.camera ? "bg-green-500" : "bg-gray-600"}`}
                ></div>
                <span>Camera access</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${initializationProgress.handDetection ? "bg-green-500" : "bg-gray-600"}`}
                ></div>
                <span>Hand detection model</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-600">
              Allow camera access when prompted
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-md mx-auto">
          <MobileView />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      <DesktopView key="desktop-view" />
    </div>
  );
}

export default React.memo(App);
