import { useEffect, useRef, useState, useCallback } from "react";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import "@tensorflow/tfjs-backend-webgl";

interface KeyPoint {
  x: number;
  y: number;
  z?: number;
}

interface DetectedHand {
  keypoints: KeyPoint[];
  score?: number;
}

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
  const detectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousGestureRef = useRef<string>("none");
  const grabStartRef = useRef<{ x: number; y: number } | null>(null);

  const initializeDetector = useCallback(async () => {
    try {
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig: handPoseDetection.MediaPipeHandsTfjsModelConfig = {
        runtime: "tfjs",
        modelType: "lite",
        maxHands: 1,
      };

      const detector = await handPoseDetection.createDetector(
        model,
        detectorConfig,
      );
      detectorRef.current = detector;
      setIsLoading(false);
    } catch {
      setError("Failed to initialize hand detection");
      setIsLoading(false);
    }
  }, []);

  const startVideoStream = useCallback(async () => {
    try {
      // Stop any existing stream
      if (videoRef.current?.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video metadata to load before starting detection
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;

          // Set a timeout in case video loading takes too long
          const timeout = setTimeout(() => {
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("error", handleError);
            reject(new Error("Video loading timeout"));
          }, 5000);

          const handleLoadedMetadata = () => {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("error", handleError);

            // Also wait for the first frame to ensure dimensions are available
            video
              .play()
              .then(() => {
                // Give a brief moment for the first frame to render
                setTimeout(resolve, 100);
              })
              .catch(reject);
          };

          const handleError = () => {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("error", handleError);
            reject(new Error("Video failed to load"));
          };

          video.addEventListener("loadedmetadata", handleLoadedMetadata);
          video.addEventListener("error", handleError);
        });
      }
    } catch (err) {
      console.error("Camera initialization error:", err);
      setError(
        "Failed to access camera. Please ensure camera permissions are granted.",
      );
      setIsLoading(false);
    }
  }, []);

  const classifyGesture = useCallback((landmarks: DetectedHand[]) => {
    if (!landmarks.length || !landmarks[0]?.keypoints) return "none";

    const hand = landmarks[0];
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerBases = [3, 6, 10, 14, 18];
    const keypoints = hand.keypoints;

    let extendedFingers = 0;

    // Thumb (special case - compare x coordinates)
    if (keypoints[fingerTips[0]]?.x > keypoints[fingerBases[0]]?.x) {
      extendedFingers++;
    }

    // Other fingers (compare y coordinates)
    for (let i = 1; i < fingerTips.length; i++) {
      if (keypoints[fingerTips[i]]?.y < keypoints[fingerBases[i]]?.y) {
        extendedFingers++;
      }
    }

    if (extendedFingers === 5) return "OPEN_HAND";
    if (extendedFingers === 0) return "FIST";
    return "PARTIAL";
  }, []);

  const detectHandPosition = useCallback((landmarks: DetectedHand[]) => {
    if (!landmarks.length || !landmarks[0]?.keypoints) return { x: 0, y: 0 };

    const hand = landmarks[0];
    const palmBase = hand.keypoints[0];
    return {
      x: palmBase?.x || 0,
      y: palmBase?.y || 0,
    };
  }, []);

  const detectGestures = useCallback(async () => {
    if (!isDetecting || !detectorRef.current || !videoRef.current) return;

    try {
      // Validate video dimensions before processing
      if (
        videoRef.current.videoWidth === 0 ||
        videoRef.current.videoHeight === 0
      ) {
        // Video not ready yet, skip this frame with a small delay
        setTimeout(() => {
          if (isDetecting) requestAnimationFrame(detectGestures);
        }, 100);
        return;
      }

      const hands = await detectorRef.current.estimateHands(videoRef.current);

      // Add extra validation for hands data
      if (!hands || !Array.isArray(hands)) {
        console.warn("Invalid hands data received:", hands);
        requestAnimationFrame(detectGestures);
        return;
      }

      const currentGesture = classifyGesture(hands);
      const position = detectHandPosition(hands);

      // Gesture sequence detection for "send" gesture
      if (
        previousGestureRef.current === "OPEN_HAND" &&
        currentGesture === "FIST"
      ) {
        grabStartRef.current = position;
      }

      if (
        previousGestureRef.current === "FIST" &&
        currentGesture === "OPEN_HAND" &&
        grabStartRef.current
      ) {
        const distance = Math.sqrt(
          Math.pow(position.x - grabStartRef.current.x, 2) +
            Math.pow(position.y - grabStartRef.current.y, 2),
        );

        // Detect forward movement (simplified - using distance threshold)
        if (distance > 0.1) {
          onGestureDetected("send", position);
          grabStartRef.current = null;
        }
      }

      previousGestureRef.current = currentGesture;

      // Continue detection loop
      requestAnimationFrame(detectGestures);
    } catch (err) {
      console.error("Detection error:", err);

      // Add a small delay before retrying to prevent error spam
      setTimeout(() => {
        if (isDetecting) requestAnimationFrame(detectGestures);
      }, 1000);
    }
  }, [isDetecting, classifyGesture, detectHandPosition, onGestureDetected]);

  useEffect(() => {
    if (isDetecting) {
      initializeDetector();
      startVideoStream();
    }
  }, [isDetecting, initializeDetector, startVideoStream]);

  useEffect(() => {
    if (isDetecting && !isLoading && !error) {
      detectGestures();
    }
  }, [isDetecting, isLoading, error, detectGestures]);

  useEffect(() => {
    return () => {
      // Cleanup video stream
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const videoElement = videoRef.current;
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600 text-sm">Initializing hand detection...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-w-md mx-auto rounded-lg shadow-lg transform scale-x-[-1]"
        style={{ display: isDetecting ? "block" : "none" }}
      />
      {!isDetecting && (
        <div className="w-full max-w-md mx-auto h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Camera off</p>
        </div>
      )}
      <div className="mt-2 text-center text-sm text-gray-600">
        Status: {previousGestureRef.current || "none"}
      </div>
    </div>
  );
};
