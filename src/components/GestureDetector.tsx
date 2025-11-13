import { useEffect, useRef, useState } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

interface GestureDetectorProps {
  onGestureDetected: (
    gesture: string,
    position: { x: number; y: number },
  ) => void;
  isDetecting: boolean;
  currentGesture?: string;
}

export const GestureDetector: React.FC<GestureDetectorProps> = ({
  onGestureDetected,
  isDetecting,
  currentGesture,
}) => {
  const [retryKey, setRetryKey] = useState(0); // Force re-initialization when changed
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousGestureRef = useRef<string>("none");
  const lastProcessTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Gesture stability tracking
  const gestureHistoryRef = useRef<string[]>([]);
  const stableGestureRef = useRef<string>("none");
  const gestureCountRef = useRef<Map<string, number>>(new Map());

  const classifyGesture = (
    landmarks: { x: number; y: number; z?: number }[],
  ): string => {
    if (!landmarks?.length) return "none";

    // MediaPipe hand landmark indices
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerMcp = [2, 5, 9, 13, 17];
    const fingerPip = [3, 6, 10, 14, 18];

    let extendedFingers = 0;
    const fingerStates: boolean[] = [];

    // Enhanced finger detection with more lenient and accurate thresholds
    const thumbTip = landmarks[fingerTips[0]];
    const thumbIp = landmarks[fingerPip[0]];
    const indexTip = landmarks[fingerTips[1]];

    // More accurate thumb detection using multiple reference points
    const thumbUp = thumbTip.y < thumbIp.y - 0.015; // Reduced threshold for better detection
    fingerStates.push(thumbUp);
    if (thumbUp) extendedFingers++;

    // Enhanced finger detection with adaptive thresholds
    for (let i = 1; i < 5; i++) {
      const tip = landmarks[fingerTips[i]];
      const pip = landmarks[fingerPip[i]];
      const mcp = landmarks[fingerMcp[i]];

      // Use both PIP and MCP for more robust detection
      const pipExtended = tip.y < pip.y - 0.025; // Reduced from 0.03
      const mcpExtended = tip.y < mcp.y - 0.05;  // Additional check
      const isExtended = pipExtended || mcpExtended;
      
      fingerStates.push(isExtended);
      if (isExtended) extendedFingers++;
    }

    // Debug logging for troubleshooting
    if (extendedFingers > 0) {
      console.log("Finger states:", {
        thumb: fingerStates[0],
        index: fingerStates[1], 
        middle: fingerStates[2],
        ring: fingerStates[3],
        pinky: fingerStates[4],
        extendedCount: extendedFingers
      });
    }

    // Simplified OK Sign detection - focus on thumb-index proximity
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2),
    );

    // Check for OK sign - thumb and index tips touching
    if (thumbIndexDistance < 0.12) { // More generous threshold
      // Other fingers should be relaxed (not fully extended)
      const otherFingersExtended = fingerStates[2] || fingerStates[3] || fingerStates[4];
      
      if (!otherFingersExtended) {
        // Additional check: thumb and index should be curled (not straight)
        const indexPip = landmarks[fingerPip[1]];
        const indexMcp = landmarks[fingerMcp[1]];
        const indexLength = Math.sqrt(
          Math.pow(indexTip.x - indexMcp.x, 2) +
            Math.pow(indexTip.y - indexMcp.y, 2)
        );
        const indexPipToMcp = Math.sqrt(
          Math.pow(indexPip.x - indexMcp.x, 2) +
            Math.pow(indexPip.y - indexMcp.y, 2)
        );
        
        // For OK sign, index finger should be curled (PIP closer to MCP than tip)
        const indexCurled = indexPipToMcp > indexLength * 0.3;
        
        if (indexCurled) {
          console.log("OK_SIGN detected", { thumbIndexDistance, extendedFingers, fingerStates });
          return "OK_SIGN";
        }
      }
    }

    // Real-world Point Up detection - prioritize this over fist
    if (fingerStates[1]) { // index finger extended
      // Check if index finger is pointing upward relative to hand orientation
      const wrist = landmarks[0]; // Wrist landmark
      const indexVector = {
        x: indexTip.x - wrist.x,
        y: indexTip.y - wrist.y
      };
      
      // Calculate angle of index finger pointing up
      const indexAngle = Math.atan2(indexVector.y, indexVector.x);
      const pointingUp = indexAngle < -Math.PI/4; // 45+ degrees (more lenient)
      
      if (pointingUp) {
        // For point up, allow thumb to be extended (common) but other fingers should be down
        if (extendedFingers <= 2) { // Index + optionally thumb
          return "POINT_UP";
        }
      }
    }

    // Enhanced Fist detection - stricter criteria after checking for point up
    if (extendedFingers <= 1) { // Only allow 0 or 1 finger for real fist
      return "FIST";
    }

    // Open hand detection - all fingers extended
    if (extendedFingers >= 4) return "OPEN_HAND";

    return "PARTIAL";
  };

  useEffect(() => {
    if (!isDetecting) {
      // Cleanup when detection is disabled
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    // Clean up any existing resources before re-initializing
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    handLandmarkerRef.current = null;

    const initializeDetection = async () => {
      try {
        // Enhanced camera permission handling with retry logic
        let stream: MediaStream | null = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!stream && retryCount < maxRetries) {
          try {
            console.log(`Attempting to get camera access (attempt ${retryCount + 1}/${maxRetries})`);
            
            // Get camera stream with permissive fallback constraints
            stream = await navigator.mediaDevices.getUserMedia({
              video: retryCount === 0 ? {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                facingMode: "user",
                frameRate: { ideal: 30, max: 60 },
              } : {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "user",
              }, // Fallback to lower resolution on retry
              audio: false,
            });
            
            console.log("Camera access granted successfully");
            break;
            
          } catch (mediaError: any) {
            console.warn(`Camera access attempt ${retryCount + 1} failed:`, mediaError);
            
            // Handle different permission errors
            if (mediaError.name === 'NotAllowedError') {
              // User denied permission - don't retry automatically
              setError("Camera permission denied. Please allow camera access and refresh the page.");
              setIsLoading(false);
              return;
            } else if (mediaError.name === 'NotFoundError') {
              // No camera found
              setError("No camera detected. Please connect a camera and refresh the page.");
              setIsLoading(false);
              return;
            } else if (mediaError.name === 'NotReadableError') {
              // Camera is already in use
              if (retryCount < maxRetries - 1) {
                console.log("Camera in use, retrying after delay...");
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                retryCount++;
                continue;
              } else {
                setError("Camera is already in use by another application. Please close other camera apps and refresh.");
                setIsLoading(false);
                return;
              }
            } else {
              // Other errors - retry
              if (retryCount < maxRetries - 1) {
                console.log("Retrying camera access after error...");
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                retryCount++;
                continue;
              }
            }
          }
        }
        
        if (!stream) {
          setError("Failed to access camera after multiple attempts. Please refresh the page and try again.");
          setIsLoading(false);
          return;
        }

        streamRef.current = stream;

        // Set up video with enhanced retry mechanism
        const setupVideo = (retryCount = 0) => {
          if (videoRef.current) {
            const video = videoRef.current;

            // Clear any existing srcObject
            if (video.srcObject) {
              const oldStream = video.srcObject as MediaStream;
              oldStream.getTracks().forEach((track) => track.stop());
            }

            video.srcObject = stream;

            const attemptPlay = async () => {
              try {
                if (video.srcObject === stream && stream.active) {
                  await video.play();
                  console.log("Video started successfully");
                }
              } catch (error) {
                console.log("Video play failed, retrying...", error);
                // Retry after a short delay
                setTimeout(attemptPlay, 100);
              }
            };

            // Multiple event handlers for better reliability
            const handleCanPlay = () => {
              console.log("Video can play");
              attemptPlay();
            };

            const handleLoadedMetadata = () => {
              console.log("Video metadata loaded");
              attemptPlay();
            };

            const handleLoadStart = () => {
              console.log("Video load started");
            };

            video.addEventListener("canplay", handleCanPlay, { once: true });
            video.addEventListener("loadedmetadata", handleLoadedMetadata, {
              once: true,
            });
            video.addEventListener("loadstart", handleLoadStart, {
              once: true,
            });

            // Initial play attempt
            attemptPlay();

            // Enhanced keep-alive mechanism
            const keepVideoAlive = setInterval(() => {
              if (video.paused && stream.active) {
                console.log("Video paused, restarting...");
                attemptPlay();
              }
            }, 1000);

            // Store for cleanup
            video.dataset.keepAliveId = keepVideoAlive.toString();
          } else {
            if (retryCount < 50) {
              // Max 5 seconds of retries
              console.log(
                `Video ref not available, retrying... (${retryCount + 1}/50)`,
              );
              setTimeout(() => setupVideo(retryCount + 1), 100);
            } else {
              console.error("Failed to find video element after 5 seconds");
              setError("Failed to initialize video element");
            }
          }
        };

        // Start video setup with a small delay to ensure DOM is ready
        setTimeout(() => setupVideo(), 200);

        // Initialize HandLandmarker with tasks-vision
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        );

        try {
          handLandmarkerRef.current = await HandLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                delegate: "GPU",
                modelAssetPath:
                  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              },
              runningMode: "VIDEO",
              numHands: 1,
            },
          );
        } catch (mpError) {
          console.error("HandLandmarker creation failed:", mpError);
          throw mpError;
        }

        setIsLoading(false);

        // Start processing frames with improved rate limiting and gesture stability
        const processFrame = async () => {
          // Rate limit to ~10 FPS for better responsiveness (reduced from 5 FPS)
          const now = Date.now();
          if (now - lastProcessTimeRef.current < 100) {
            animationFrameRef.current = requestAnimationFrame(processFrame);
            return;
          }
          lastProcessTimeRef.current = now;

          try {
            // Check all conditions before processing
            if (!handLandmarkerRef.current) {
              animationFrameRef.current = requestAnimationFrame(processFrame);
              return;
            }

            if (!videoRef.current) {
              animationFrameRef.current = requestAnimationFrame(processFrame);
              return;
            }

            if (videoRef.current.paused || videoRef.current.readyState < 2) {
              animationFrameRef.current = requestAnimationFrame(processFrame);
              return;
            }

            const results = await handLandmarkerRef.current.detectForVideo(
              videoRef.current,
              performance.now(),
            );

            if (!results.landmarks?.length) {
              // Handle no hand detected
              gestureHistoryRef.current = [];
              gestureCountRef.current.clear();
              stableGestureRef.current = "none";
              
              if (previousGestureRef.current !== "none") {
                previousGestureRef.current = "none";
                onGestureDetected?.("none", { x: 0, y: 0 });
              }
            } else {
              const landmarks = results.landmarks[0];
              const gesture = classifyGesture(landmarks);
              const position = { x: landmarks[0].x, y: landmarks[0].y };

              // Add to gesture history - smaller window for faster response
              gestureHistoryRef.current.push(gesture);
              if (gestureHistoryRef.current.length > 6) {
                gestureHistoryRef.current.shift();
              }

              // Count gesture occurrences in recent history
              const currentCount = gestureCountRef.current.get(gesture) || 0;
              gestureCountRef.current.set(gesture, currentCount + 1);

              // Reset other gesture counts that haven't been seen recently
              for (const [key] of gestureCountRef.current.entries()) {
                if (key !== gesture && !gestureHistoryRef.current.slice(-3).includes(key)) {
                  gestureCountRef.current.delete(key);
                }
              }

              // Determine stable gesture (reduced from 4 to 3 for faster response)
              const stableCount = gestureCountRef.current.get(gesture) || 0;
              let newStableGesture = stableGestureRef.current;

              if (stableCount >= 3) {
                // Only change if different from current stable gesture
                if (gesture !== stableGestureRef.current) {
                  newStableGesture = gesture;
                }
              }

              // Reset counter if gesture changes too much
              if (gestureHistoryRef.current.length > 6) {
                const recentGestures = gestureHistoryRef.current.slice(-6);
                const uniqueGestures = new Set(recentGestures);
                if (uniqueGestures.size > 3) {
                  // Too much variation, reset
                  gestureHistoryRef.current = [gesture];
                  gestureCountRef.current.clear();
                  gestureCountRef.current.set(gesture, 1);
                }
              }

              // Only trigger callback if stable gesture changed
              if (newStableGesture !== stableGestureRef.current) {
                stableGestureRef.current = newStableGesture;
                if (previousGestureRef.current !== newStableGesture) {
                  previousGestureRef.current = newStableGesture;
                  onGestureDetected?.(newStableGesture, position);
                }
              }
            }
          } catch (error) {
            console.error("MediaPipe processing error:", error);
            // Continue processing even on error
          }

          animationFrameRef.current = requestAnimationFrame(processFrame);
        };

        animationFrameRef.current = requestAnimationFrame(processFrame);
      } catch (err) {
        console.error("Detection initialization error:", err);
        setError("Failed to initialize camera or hand detection");
        setIsLoading(false);
      }
    };

    initializeDetection();

    return () => {
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (handLandmarkerRef.current) {
        handLandmarkerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isDetecting, onGestureDetected, retryKey]);

  // Video setup for gesture detection - moved to stream initialization

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-4">
        <p className="text-red-300 text-sm">{error}</p>
        <p className="text-red-400 text-xs mt-2">
          Please allow camera access and refresh the page
        </p>
        <button
          onClick={() => {
            setError(null);
            setIsLoading(true);
            // Trigger re-initialization by incrementing retry key
            setRetryKey(prev => prev + 1);
          }}
          className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
        >
          Retry Camera Access
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <p className="text-gray-300 text-sm">
          Initializing camera and hand detection...
        </p>
        <p className="text-gray-400 text-xs mt-2">
          Please allow camera access when prompted by your browser
        </p>
        <div className="mt-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Gesture emoji mapping
  const getGestureEmoji = (gesture: string): string => {
    switch (gesture) {
      case "POINT_UP": return "☝️";
      case "FIST": return "✊";
      case "OK_SIGN": return "👌";
      default: return "";
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Video element - mirrored for intuitive gesture control */}
      <video
        ref={videoRef}
        autoPlay
        muted
        className="w-full h-full object-cover rounded-lg bg-black transform scale-x-[-1]"
      />
      
      {/* Gesture overlay - show current gesture in top right */}
      {currentGesture && currentGesture !== "none" && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{getGestureEmoji(currentGesture)}</span>
            <div className="text-white">
              <p className="text-sm font-medium capitalize">
                {currentGesture.replace("_", " ").toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
