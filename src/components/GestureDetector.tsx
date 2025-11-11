import { useEffect, useRef, useState, useCallback } from "react";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import "@tensorflow/tfjs-backend-webgl";

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Failed to access camera");
      setIsLoading(false);
    }
  }, []);

  const classifyGesture = useCallback((landmarks: handPoseDetection.Hand[]) => {
    if (!landmarks.length) return "none";

    const hand = landmarks[0];
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerBases = [3, 6, 10, 14, 18];

    let extendedFingers = 0;

    // Thumb (special case - compare x coordinates)
    if (hand.landmarks[fingerTips[0]].x > hand.landmarks[fingerBases[0]].x) {
      extendedFingers++;
    }

    // Other fingers (compare y coordinates)
    for (let i = 1; i < fingerTips.length; i++) {
      if (hand.landmarks[fingerTips[i]].y < hand.landmarks[fingerBases[i]].y) {
        extendedFingers++;
      }
    }

    if (extendedFingers === 5) return "OPEN_HAND";
    if (extendedFingers === 0) return "FIST";
    return "PARTIAL";
  }, []);

  const detectHandPosition = useCallback(
    (landmarks: handPoseDetection.Hand[]) => {
      if (!landmarks.length) return { x: 0, y: 0 };

      const hand = landmarks[0];
      const palmBase = hand.landmarks[0];
      return {
        x: palmBase.x,
        y: palmBase.y,
      };
    },
    [],
  );

  const detectGestures = useCallback(async () => {
    if (!isDetecting || !detectorRef.current || !videoRef.current) return;

    try {
      const hands = await detectorRef.current.estimateHands(videoRef.current);
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
