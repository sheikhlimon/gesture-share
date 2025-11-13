import { useState, useCallback, useEffect } from "react";
import { DesktopView } from "./components/DesktopView";
import { MobileView } from "./components/MobileView";

function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleFileSelect = useCallback((file: File) => {
    console.log("File selected for sharing:", file.name);
  }, []);

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
    console.log(
      "Device detection:",
      userAgent,
      isMobileDevice,
      "Width:",
      window.innerWidth,
    );
    setIsMobile(isMobileDevice);
  }, []);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      detectDevice();
      setIsLoading(false);
    }, 1500); // 1.5 second loading time

    return () => clearTimeout(timer);
  }, [detectDevice]);

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
          <p className="text-gray-400 mb-6">Initializing camera and hand detection...</p>
          
          {/* Loading dots animation */}
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          {/* Loading progress hint */}
          <div className="mt-8 text-sm text-gray-500">
            <p>Allow camera access when prompted</p>
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
    <div className="min-h-screen bg-gray-900">
      <DesktopView onFileSelect={handleFileSelect} />
    </div>
  );
}

export default App;
