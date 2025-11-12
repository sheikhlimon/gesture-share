import { useEffect, useRef, useState } from "react";
import { Hands, type Results } from "@mediapipe/hands";

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
  const handsRef = useRef<Hands | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentGesture, setCurrentGesture] = useState<string>("none");
  const previousGestureRef = useRef<string>("none");
  const grabStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isDetecting) {
      // Cleanup when detection is disabled
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    // Only initialize if not already initialized
    if (handsRef.current) return;

    const initializeDetection = async () => {
      try {
        // Get camera stream first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Initialize MediaPipe Hands
        handsRef.current = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        handsRef.current.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        handsRef.current.onResults((results: Results) => {
          if (!results?.multiHandLandmarks?.length) {
            if (previousGestureRef.current !== "none") {
              setCurrentGesture("none");
              previousGestureRef.current = "none";
              onGestureDetected?.("none", { x: 0, y: 0 });
            }
            return;
          }

          const landmarks = results.multiHandLandmarks[0];
          const gesture = classifyGesture(landmarks);
          const position = { x: landmarks[0].x, y: landmarks[0].y };

          if (gesture !== previousGestureRef.current) {
            setCurrentGesture(gesture);
            onGestureDetected?.(gesture, position);
          }

          // Handle grab and send gesture
          if (
            previousGestureRef.current === "OPEN_HAND" &&
            gesture === "FIST"
          ) {
            grabStartRef.current = position;
          }

          if (
            previousGestureRef.current === "FIST" &&
            gesture === "OPEN_HAND" &&
            grabStartRef.current
          ) {
            const distance = Math.sqrt(
              Math.pow(position.x - grabStartRef.current.x, 2) +
                Math.pow(position.y - grabStartRef.current.y, 2),
            );

            if (distance > 0.05) {
              onGestureDetected?.("send", position);
              grabStartRef.current = null;
            }
          }

          previousGestureRef.current = gesture;
        });

        // Start processing frames
        const processFrame = async () => {
          if (
            handsRef.current &&
            videoRef.current &&
            !videoRef.current.paused
          ) {
            await handsRef.current.send({ image: videoRef.current });
          }
          requestAnimationFrame(processFrame);
        };

        processFrame();
        setIsLoading(false);
      } catch (err) {
        console.error("Detection initialization error:", err);
        setError("Failed to initialize camera or hand detection");
        setIsLoading(false);
      }
    };

    initializeDetection();

    return () => {
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isDetecting, onGestureDetected]);

  const classifyGesture = (
    landmarks: { x: number; y: number; z?: number }[],
  ): string => {
    if (!landmarks?.length) return "none";

    // MediaPipe hand landmark indices
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerMcp = [2, 5, 9, 13, 17];

    let extendedFingers = 0;
    const fingerStates: boolean[] = [];

    // Thumb (horizontal check)
    const thumbExtended =
      landmarks[fingerTips[0]].x > landmarks[fingerMcp[0]].x;
    fingerStates.push(thumbExtended);
    if (thumbExtended) extendedFingers++;

    // Other fingers (vertical check)
    for (let i = 1; i < 5; i++) {
      const isExtended = landmarks[fingerMcp[i]].y > landmarks[fingerTips[i]].y;
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
      !fingerStates[4] &&
      !fingerStates[0]
    )
      return "PEACE";
    if (
      fingerStates[0] &&
      !fingerStates[1] &&
      !fingerStates[2] &&
      !fingerStates[3] &&
      !fingerStates[4]
    )
      return "THUMBS_UP";
    if (
      !fingerStates[0] &&
      fingerStates[1] &&
      !fingerStates[2] &&
      !fingerStates[3] &&
      !fingerStates[4]
    )
      return "POINT";

    return "PARTIAL";
  };

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
        className="w-full h-96 object-cover rounded-lg shadow-lg transform scale-x-[-1]"
        style={{ display: isDetecting ? "block" : "none" }}
      />
      {!isDetecting && (
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Camera off</p>
        </div>
      )}
      <div className="mt-2 text-center text-sm text-gray-600">
        Status: {currentGesture}
      </div>
    </div>
  );
};
