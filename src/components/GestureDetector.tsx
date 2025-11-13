import { useEffect, useRef, useState } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

interface GestureDetectorProps {
  onGestureDetected: (
    gesture: string,
    position: { x: number; y: number },
  ) => void;
  isDetecting: boolean;
}

export const GestureDetector: React.FC<GestureDetectorProps> = ({
  onGestureDetected,
  isDetecting,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousGestureRef = useRef<string>("none");
  const lastProcessTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const classifyGesture = (
    landmarks: { x: number; y: number; z?: number }[],
  ): string => {
    if (!landmarks?.length) return "none";

    // MediaPipe hand landmark indices
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerMcp = [2, 5, 9, 13, 17];

    let extendedFingers = 0;
    const fingerStates: boolean[] = [];

    // Thumb detection (upward or outward)
    const thumbTip = landmarks[fingerTips[0]];
    const thumbMcp = landmarks[fingerMcp[0]];

    const thumbUp =
      thumbTip.y < thumbMcp.y - 0.02 ||
      Math.abs(thumbTip.x - thumbMcp.x) > 0.06;

    fingerStates.push(thumbUp);
    if (thumbUp) extendedFingers++;

    // Other fingers detection (must be significantly extended)
    for (let i = 1; i < 5; i++) {
      const tip = landmarks[fingerTips[i]];
      const mcp = landmarks[fingerMcp[i]];

      const isExtended = tip.y < mcp.y - 0.08;
      fingerStates.push(isExtended);
      if (isExtended) extendedFingers++;
    }

    // Gesture recognition
    if (extendedFingers === 5) return "OPEN_HAND";
    if (extendedFingers === 0) return "FIST";

    if (
      fingerStates[1] &&
      fingerStates[2] &&
      !fingerStates[3] &&
      !fingerStates[4]
    ) {
      return "PEACE";
    }

    if (
      fingerStates[0] &&
      !fingerStates[1] &&
      !fingerStates[2] &&
      !fingerStates[3] &&
      !fingerStates[4]
    ) {
      return "THUMBS_UP";
    }

    if (
      !fingerStates[0] &&
      fingerStates[1] &&
      !fingerStates[2] &&
      !fingerStates[3] &&
      !fingerStates[4]
    ) {
      return "POINT";
    }

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

        // Set up video with retry mechanism
        const setupVideo = () => {
          if (videoRef.current) {
            const video = videoRef.current;
            video.srcObject = stream;

            const attemptPlay = () => {
              if (video.srcObject === stream && stream.active) {
                video.play().catch(() => {
                  // Silent retry on autoplay restrictions
                });
              }
            };

            attemptPlay();
            video.onloadedmetadata = attemptPlay;

            // Minimal keep-alive mechanism
            const keepVideoAlive = setInterval(() => {
              if (video.paused && stream.active) {
                attemptPlay();
              }
            }, 2000);

            // Store for cleanup
            video.dataset.keepAliveId = keepVideoAlive.toString();
          } else {
            setTimeout(setupVideo, 100);
          }
        };

        setupVideo();

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

        // Start processing frames with rate limiting
        const processFrame = async () => {
          // Rate limit to ~10 FPS
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
              if (previousGestureRef.current !== "none") {
                previousGestureRef.current = "none";
                onGestureDetected?.("none", { x: 0, y: 0 });
              }
            } else {
              const landmarks = results.landmarks[0];
              const gesture = classifyGesture(landmarks);
              const position = { x: landmarks[0].x, y: landmarks[0].y };

              if (gesture !== previousGestureRef.current) {
                onGestureDetected?.(gesture, position);
              }

              previousGestureRef.current = gesture;
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

  return (
    <div className="relative w-full h-full">
      {/* Video element - mirrored for intuitive gesture control */}
      <video
        ref={videoRef}
        autoPlay
        muted
        className="w-full h-full object-cover rounded-lg bg-black transform scale-x-[-1]"
      />
    </div>
  );
};
