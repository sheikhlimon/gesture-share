import { useEffect, useRef, useState } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

interface GestureDetectorProps {
  onGestureDetected: (
    gesture: string,
    position: { x: number; y: number },
  ) => void;
  isDetecting: boolean;
  currentGesture?: string;
  onHandDetected?: (detected: boolean) => void;
}

export const GestureDetector: React.FC<GestureDetectorProps> = ({
  onGestureDetected,
  isDetecting,
  currentGesture,
  onHandDetected,
}) => {
  // Internal pro tip component that shows when no cooldown is active
  const GestureTips: React.FC = () => {
    // Show pro tip when no hand is detected or hand is not in action gesture
    // Show tip only when no hand is detected or gesture is none
    const shouldShowTip =
      !cooldownRemaining &&
      currentGesture !== "FILE_PICKER_ACTIVE" &&
      (!handDetected || currentGesture === "none");

    if (shouldShowTip) {
      return (
        <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur-lg border border-gray-600/50 rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-2xl">✋</span>
          <div className="text-gray-200 font-sans">
            <span className="text-base font-medium block">
              Show open hand before each gesture
            </span>
            <span className="text-xs text-gray-400 mt-1 block">
              Keep hand 1-2 feet from camera, well-lit, and in frame
            </span>
          </div>
        </div>
      );
    }

    return null;
  };
  const [retryKey, setRetryKey] = useState(0); // Force re-initialization when changed
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0); // For UI display
  const [handDetected, setHandDetected] = useState<boolean>(false);
  const [debugGesture, setDebugGesture] = useState<string>("none");
  const [confidence, setConfidence] = useState<number>(0);
  const previousGestureRef = useRef<string>("none");
  const lastProcessTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Gesture stability tracking
  const gestureHistoryRef = useRef<string[]>([]);
  const stableGestureRef = useRef<string>("none");
  const gestureCountRef = useRef<Map<string, number>>(new Map());

  // Cooldown tracking - prevent new gestures immediately after detection
  const lastGestureTimeRef = useRef<number>(0);
  const gestureCooldownRef = useRef<number>(3000); // 3 seconds cooldown
  const isInCooldownRef = useRef<boolean>(false);
  const cooldownIntervalRef = useRef<number | null>(null);

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
    const thumbUp = thumbTip.y < thumbIp.y - 0.005; // Further reduced threshold for better detection
    fingerStates.push(thumbUp);
    if (thumbUp) extendedFingers++;

    // Enhanced finger detection with adaptive thresholds
    for (let i = 1; i < 5; i++) {
      const tip = landmarks[fingerTips[i]];
      const pip = landmarks[fingerPip[i]];
      const mcp = landmarks[fingerMcp[i]];

      // Use both PIP and MCP for more robust detection - made much more lenient
      const pipExtended = tip.y < pip.y - 0.008; // Further reduced from 0.015
      const mcpExtended = tip.y < mcp.y - 0.015; // Further reduced from 0.03
      const isExtended = pipExtended || mcpExtended;

      fingerStates.push(isExtended);
      if (isExtended) extendedFingers++;
    }

    // Peace Sign detection - index and middle fingers extended
    if (fingerStates[1] && fingerStates[2]) {
      // Both index and middle extended
      // Check that other fingers are not extended (thumb can be extended, ring and pinky should be down)
      const otherFingersExtended = fingerStates[3] || fingerStates[4]; // Ring or pinky extended

      if (!otherFingersExtended) {
        // Additional validation: index and middle should be spread apart
        const middleTip = landmarks[fingerTips[2]];
        const indexMiddleDistance = Math.sqrt(
          Math.pow(indexTip.x - middleTip.x, 2) +
            Math.pow(indexTip.y - middleTip.y, 2),
        );

        // Index and middle fingers should be reasonably separated (forming V shape)
        if (indexMiddleDistance > 0.06) {
          // Reduced minimum separation for easier peace sign detection
          return "PEACE_SIGN";
        }
      }
    }

    // Real-world Point Up detection - prioritize this over fist
    if (fingerStates[1]) {
      // index finger extended
      // Check if index finger is pointing upward relative to hand orientation
      const wrist = landmarks[0]; // Wrist landmark
      const indexVector = {
        x: indexTip.x - wrist.x,
        y: indexTip.y - wrist.y,
      };

      // Calculate angle of index finger pointing up
      const indexAngle = Math.atan2(indexVector.y, indexVector.x);
      const pointingUp = indexAngle < -Math.PI / 4; // 45+ degrees (more lenient)

      if (pointingUp) {
        // For point up, allow thumb to be extended (common) but other fingers should be down
        if (extendedFingers <= 2) {
          // Index + optionally thumb
          return "POINT_UP";
        }
      }
    }

    // Enhanced Fist detection - stricter criteria after checking for point up
    if (extendedFingers <= 1) {
      // Only allow 0 or 1 finger for real fist
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
            // Get camera stream with permissive fallback constraints
            stream = await navigator.mediaDevices.getUserMedia({
              video:
                retryCount === 0
                  ? {
                      width: { ideal: 1280, max: 1920 },
                      height: { ideal: 720, max: 1080 },
                      facingMode: "user",
                      frameRate: { ideal: 30, max: 60 },
                    }
                  : {
                      width: { ideal: 640 },
                      height: { ideal: 480 },
                      facingMode: "user",
                    }, // Fallback to lower resolution on retry
              audio: false,
            });

            break;
          } catch (mediaError: unknown) {
            console.warn(
              `Camera access attempt ${retryCount + 1} failed:`,
              mediaError,
            );

            // Handle different permission errors
            if (
              mediaError instanceof Error &&
              mediaError.name === "NotAllowedError"
            ) {
              // User denied permission - don't retry automatically
              setError(
                "Camera permission denied. Please allow camera access and refresh the page.",
              );
              setIsLoading(false);
              return;
            } else if (
              mediaError instanceof Error &&
              mediaError.name === "NotFoundError"
            ) {
              // No camera found
              setError(
                "No camera detected. Please connect a camera and refresh the page.",
              );
              setIsLoading(false);
              return;
            } else if (
              mediaError instanceof Error &&
              mediaError.name === "NotReadableError"
            ) {
              // Camera is already in use
              if (retryCount < maxRetries - 1) {
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * (retryCount + 1)),
                );
                retryCount++;
                continue;
              } else {
                setError(
                  "Camera is already in use by another application. Please close other camera apps and refresh.",
                );
                setIsLoading(false);
                return;
              }
            } else {
              // Other errors - retry
              if (retryCount < maxRetries - 1) {
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * (retryCount + 1)),
                );
                retryCount++;
                continue;
              }
            }
          }
        }

        if (!stream) {
          setError(
            "Failed to access camera after multiple attempts. Please refresh the page and try again.",
          );
          setIsLoading(false);
          return;
        }

        streamRef.current = stream;

        // Initialize HandLandmarker with tasks-vision using multiple CDN fallbacks
        let vision;
        let visionError: Error | null = null;

        // Try different CDN URLs for better reliability
        const cdnUrls = [
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
          "https://unpkg.com/@mediapipe/tasks-vision@0.10.0/wasm",
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ];

        for (const cdnUrl of cdnUrls) {
          try {
            vision = await FilesetResolver.forVisionTasks(cdnUrl);

            visionError = null;
            break;
          } catch (error) {
            console.warn(`Failed to load MediaPipe from ${cdnUrl}:`, error);
            visionError = error as Error;
          }
        }

        if (!vision || visionError) {
          throw new Error(
            `Failed to load MediaPipe from all CDN sources. Last error: ${visionError?.message}`,
          );
        }

        try {
          // Try GPU delegation first, fallback to CPU
          let handLandmarker;
          try {
            handLandmarker = await HandLandmarker.createFromOptions(vision, {
              baseOptions: {
                delegate: "GPU",
                modelAssetPath:
                  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              },
              runningMode: "VIDEO",
              numHands: 1,
            });
          } catch (gpuError) {
            console.warn("GPU delegation failed, trying CPU:", gpuError);
            handLandmarker = await HandLandmarker.createFromOptions(vision, {
              baseOptions: {
                delegate: "CPU",
                modelAssetPath:
                  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              },
              runningMode: "VIDEO",
              numHands: 1,
            });
          }

          handLandmarkerRef.current = handLandmarker;
        } catch (mpError) {
          console.error("HandLandmarker creation failed:", mpError);
          throw new Error(
            `Failed to create HandLandmarker: ${mpError instanceof Error ? mpError.message : String(mpError)}`,
          );
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
              setHandDetected(false);
              onHandDetected?.(false);
              setDebugGesture("none");
              setConfidence(0);

              if (previousGestureRef.current !== "none") {
                previousGestureRef.current = "none";
                onGestureDetected?.("none", { x: 0, y: 0 });
              }
            } else {
              const landmarks = results.landmarks[0];
              const gesture = classifyGesture(landmarks);
              const position = { x: landmarks[0].x, y: landmarks[0].y };

              // Update debug state
              setHandDetected(true);
              onHandDetected?.(true);
              setDebugGesture(gesture);

              // Calculate confidence based on gesture consistency
              const currentCount = gestureCountRef.current.get(gesture) || 0;
              const confidenceScore = Math.min(currentCount / 3, 1); // Max confidence at 3 consistent detections
              setConfidence(Math.round(confidenceScore * 100));

              // Add to gesture history - smaller window for faster response
              gestureHistoryRef.current.push(gesture);
              if (gestureHistoryRef.current.length > 6) {
                gestureHistoryRef.current.shift();
              }

              // Count gesture occurrences in recent history
              gestureCountRef.current.set(gesture, currentCount + 1);

              // Reset other gesture counts that haven't been seen recently
              for (const [key] of gestureCountRef.current.entries()) {
                if (
                  key !== gesture &&
                  !gestureHistoryRef.current.slice(-3).includes(key)
                ) {
                  gestureCountRef.current.delete(key);
                }
              }

              // Determine stable gesture (reduced from 3 to 2 for much faster response)
              const stableCount = gestureCountRef.current.get(gesture) || 0;
              let newStableGesture = stableGestureRef.current;

              if (stableCount >= 2) {
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

              // Check cooldown before triggering callback
              const currentTime = Date.now();
              const timeSinceLastGesture =
                currentTime - lastGestureTimeRef.current;
              const cooldownActive =
                timeSinceLastGesture < gestureCooldownRef.current;

              // Only trigger callback if stable gesture changed and not in cooldown
              if (newStableGesture !== stableGestureRef.current) {
                stableGestureRef.current = newStableGesture;

                // Allow "none", "open hand", and "partial" gestures always (no cooldown)
                if (
                  newStableGesture === "none" ||
                  newStableGesture === "OPEN_HAND" ||
                  newStableGesture === "PARTIAL"
                ) {
                  if (previousGestureRef.current !== newStableGesture) {
                    previousGestureRef.current = newStableGesture;
                    onGestureDetected?.(newStableGesture, position);
                  }
                } else if (!cooldownActive) {
                  // Only apply cooldown to main gestures: POINT_UP, FIST, PEACE_SIGN
                  previousGestureRef.current = newStableGesture;
                  lastGestureTimeRef.current = currentTime;
                  onGestureDetected?.(newStableGesture, position);
                  isInCooldownRef.current = true;

                  // Start cooldown UI display
                  setCooldownRemaining(3);
                  if (cooldownIntervalRef.current) {
                    clearInterval(cooldownIntervalRef.current);
                  }
                  cooldownIntervalRef.current = window.setInterval(() => {
                    setCooldownRemaining((prev) => {
                      if (prev <= 1) {
                        clearInterval(cooldownIntervalRef.current!);
                        cooldownIntervalRef.current = null;
                        isInCooldownRef.current = false;
                        return 0;
                      }
                      return prev - 1;
                    });
                  }, 1000);
                } else {
                  // Main gesture detected but cooldown is active
                  const remainingTime = Math.ceil(
                    (gestureCooldownRef.current - timeSinceLastGesture) / 1000,
                  );
                  if (remainingTime > 0) {
                    setCooldownRemaining(remainingTime);
                  }
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
      // Clear cooldown interval on cleanup
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    };
  }, [isDetecting, onGestureDetected, onHandDetected, retryKey]);

  // Set up video stream when stream becomes available
  useEffect(() => {
    let timeoutId: number | null = null;

    const setupVideo = () => {
      const stream = streamRef.current;
      const currentVideo = videoRef.current;

      if (!stream || !currentVideo) {
        return false; // Not ready yet
      }

      // Check if already set up
      if (currentVideo.srcObject === stream) {
        return true; // Already set up
      }

      // Set the stream to the video element
      currentVideo.srcObject = stream;

      // Set video dimensions to prevent MediaPipe warning
      currentVideo.width = 640;
      currentVideo.height = 480;

      // Try to play the video
      currentVideo.play().catch((error) => {
        console.warn("Video autoplay failed:", error);
      });

      return true; // Setup complete
    };

    // Function to keep trying until setup is complete or timeout
    const attemptSetup = () => {
      if (setupVideo()) {
        // Success, stop trying
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };

    // Try immediately
    attemptSetup();

    // Keep trying every 100ms for up to 10 seconds
    timeoutId = setTimeout(() => {
      console.error("Video setup timeout after 10 seconds");
    }, 10000);

    const intervalId = setInterval(attemptSetup, 100);

    return () => {
      clearInterval(intervalId);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Cleanup when component unmounts - capture ref value at cleanup time
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const videoElement = videoRef.current;
      if (videoElement?.srcObject) {
        const currentStream = videoElement.srcObject as MediaStream;
        currentStream.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
      }
    };
  }, []); // Empty dependency array - effect handles its own ref checking

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
            setRetryKey((prev) => prev + 1);
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
      case "POINT_UP":
        return "☝️";
      case "FIST":
        return "✊";
      case "PEACE_SIGN":
        return "✌️";
      default:
        return "";
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Video element - mirrored for intuitive gesture control */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover rounded-lg bg-black transform scale-x-[-1]"
      />

      {/* Debug overlay - shows detection status */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${handDetected ? "bg-green-500" : "bg-red-500"}`}
          ></div>
          <span className="text-white text-xs">
            {handDetected ? "Hand Detected" : "No Hand"}
          </span>
          {handDetected && (
            <span className="text-white text-xs">
              | {debugGesture.replace("_", " ")} ({confidence}%)
            </span>
          )}
        </div>
      </div>

      {(!streamRef.current ||
        !videoRef.current ||
        videoRef.current.readyState < 2) && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <p className="text-white text-sm">Waiting for camera stream...</p>
        </div>
      )}

      {/* Pro tip - show when no cooldown is active */}
      <GestureTips />

      {/* Cooldown indicator - show in top left when active */}
      {cooldownRemaining > 0 && (
        <div className="absolute top-4 left-4 bg-orange-900/90 backdrop-blur-sm px-4 py-3 rounded-lg border border-orange-700/50 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-8 h-8 border-2 border-orange-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {cooldownRemaining}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-white">
              <p className="text-sm font-medium">Waiting...</p>
              <p className="text-xs text-orange-300">
                New gesture in {cooldownRemaining}s
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gesture overlay - show current gesture in top right */}
      {currentGesture && currentGesture !== "none" && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getGestureEmoji(currentGesture)}</span>
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
