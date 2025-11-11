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
    const isMobileDevice =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent,
      ) || window.innerWidth < 768;
    setIsMobile(isMobileDevice);
  }, []);

  useEffect(() => {
    detectDevice();
  }, [detectDevice]);

  if (isMobile) {
    return <MobileView />;
  }

  return <DesktopView onFileSelect={handleFileSelect} />;
}

export default App;
