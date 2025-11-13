import { useState, useCallback, useEffect } from "react";
import { DesktopView } from "./components/DesktopView";
import { MobileView } from "./components/MobileView";

function App() {
  const [isMobile, setIsMobile] = useState(false);

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
    detectDevice();
  }, [detectDevice]);

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
