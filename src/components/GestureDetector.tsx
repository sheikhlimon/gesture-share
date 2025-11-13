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

    // Thumb detection - more lenient criteria for better detection
    const thumbTip = landmarks[fingerTips[0]];
    const thumbIp = landmarks[fingerPip[0]];
    const indexTip = landmarks[fingerTips[1]];

    // Thumb is extended if tip is above IP joint (reduced threshold)
    const thumbUp = thumbTip.y < thumbIp.y - 0.02;

    fingerStates.push(thumbUp);
    if (thumbUp) extendedFingers++;

    // Other fingers detection - more lenient criteria
    for (let i = 1; i < 5; i++) {
      const tip = landmarks[fingerTips[i]];
      const pip = landmarks[fingerPip[i]];

      // Finger is extended if tip is above PIP joint (reduced threshold)
      const isExtended = tip.y < pip.y - 0.03;
      fingerStates.push(isExtended);
      if (isExtended) extendedFingers++;
    }

    // OK Sign detection - thumb and index finger touching (increased threshold)
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2),
    );

    // Check if thumb and index are close and other fingers are down
    if (
      thumbIndexDistance < 0.08 && // Increased from 0.05 to 0.08 for easier detection
      !fingerStates[2] && // middle down
      !fingerStates[3] && // ring down
      !fingerStates[4]    // pinky down
    ) {
      // Additional check: thumb should be somewhat extended for OK sign
      if (thumbUp) {
        return "OK_SIGN";
      }
    }

    // Fist detection - allow very minimal finger extension
    if (extendedFingers <= 1) return "FIST";

    // Point Up - only index finger extended and pointing up
    if (
      fingerStates[1] && // index extended
      extendedFingers === 1 // only index finger extended
    ) {
      // Check if index finger is pointing up (reduced threshold)
      const indexMcp = landmarks[fingerMcp[1]];
      const indexPointingUp = indexTip.y < indexMcp.y - 0.08;

      if (indexPointingUp) {
        return "POINT_UP";
      }
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
        // Get camera stream with desktop-optimized constraints
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: "user",
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        });

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

        // Start processing frames with rate limiting and gesture stability
        const processFrame = async () => {
          // Rate limit to ~5 FPS for more stable detection
          const now = Date.now();
          if (now - lastProcessTimeRef.current < 200) {
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

              // Add to gesture history
              gestureHistoryRef.current.push(gesture);
              if (gestureHistoryRef.current.length > 8) {
                gestureHistoryRef.current.shift();
              }

              // Count gesture occurrences in recent history
              const currentCount = gestureCountRef.current.get(gesture) || 0;
              gestureCountRef.current.set(gesture, currentCount + 1);

              // Reset other gesture counts that haven't been seen recently
              for (const [key] of gestureCountRef.current.entries()) {
                if (key !== gesture && !gestureHistoryRef.current.slice(-4).includes(key)) {
                  gestureCountRef.current.delete(key);
                }
              }

              // Determine stable gesture (need 4+ consistent detections)
              const stableCount = gestureCountRef.current.get(gesture) || 0;
              let newStableGesture = stableGestureRef.current;

              if (stableCount >= 4) {
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
  }, [isDetecting, onGestureDetected]);

  // Video setup for gesture detection - moved to stream initialization

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-4">
        <p className="text-red-300 text-sm">{error}</p>
        <p className="text-red-400 text-xs mt-2">
          Please allow camera access and refresh the page
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <p className="text-gray-300 text-sm">
          Initializing camera and hand detection...
        </p>
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
