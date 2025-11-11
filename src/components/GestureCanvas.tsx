import { useState, useRef, useEffect, useCallback } from "react";
import type { Point } from "../types/gesture";

interface GestureCanvasProps {
  isCapturing: boolean;
  points: Point[];
  onPointAdd: (x: number, y: number) => void;
  onStartCapture: () => void;
  onEndCapture: () => void;
  className?: string;
}

export const GestureCanvas: React.FC<GestureCanvasProps> = ({
  isCapturing,
  points,
  onPointAdd,
  onStartCapture,
  onEndCapture,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw gesture points
    if (points.length > 0) {
      ctx.strokeStyle = isCapturing ? "#3b82f6" : "#10b981";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      // Draw points
      ctx.fillStyle = isCapturing ? "#3b82f6" : "#10b981";
      points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [points, isCapturing]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isCapturing) {
        onStartCapture();
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDrawing(true);
      onPointAdd(x, y);
    },
    [isCapturing, onStartCapture, onPointAdd],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !isCapturing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      onPointAdd(x, y);
    },
    [isDrawing, isCapturing, onPointAdd],
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      if (isCapturing) {
        onEndCapture();
      }
    }
  }, [isDrawing, isCapturing, onEndCapture]);

  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      if (isCapturing) {
        onEndCapture();
      }
    }
  }, [isDrawing, isCapturing, onEndCapture]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isCapturing) {
        onStartCapture();
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      setIsDrawing(true);
      onPointAdd(x, y);
    },
    [isCapturing, onStartCapture, onPointAdd],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing || !isCapturing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      onPointAdd(x, y);
    },
    [isDrawing, isCapturing, onPointAdd],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (isDrawing) {
        setIsDrawing(false);
        if (isCapturing) {
          onEndCapture();
        }
      }
    },
    [isDrawing, isCapturing, onEndCapture],
  );

  return (
    <div className={`gesture-canvas-container ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className={`border-2 rounded-lg cursor-crosshair ${
          isCapturing
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-white"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {isCapturing && (
        <div className="mt-2 text-sm text-blue-600 animate-pulse">
          Recording gesture... Release to finish
        </div>
      )}
    </div>
  );
};
