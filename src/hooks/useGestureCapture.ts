import { useState, useRef, useCallback } from "react";
import type { Point, Gesture } from "../types/gesture";

// Simple ID generator function
const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useGestureCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [gestures, setGestures] = useState<Gesture[]>([]);
  const startTimeRef = useRef<number>(0);

  const startCapture = useCallback(() => {
    setIsCapturing(true);
    setCurrentPoints([]);
    startTimeRef.current = Date.now();
  }, []);

  const addPoint = useCallback(
    (x: number, y: number) => {
      if (!isCapturing) return;

      const point: Point = {
        x,
        y,
        timestamp: Date.now() - startTimeRef.current,
      };

      setCurrentPoints((prev) => [...prev, point]);
    },
    [isCapturing],
  );

  const endCapture = useCallback(
    (name: string, userId: string, tags: string[] = []) => {
      if (!isCapturing || currentPoints.length === 0) return null;

      const gesture: Gesture = {
        id: `gesture_${generateId()}`,
        name,
        points: currentPoints,
        duration: Date.now() - startTimeRef.current,
        userId,
        createdAt: Date.now(),
        tags,
      };

      setGestures((prev) => [...prev, gesture]);
      setIsCapturing(false);
      setCurrentPoints([]);
      return gesture;
    },
    [isCapturing, currentPoints],
  );

  const clearGestures = useCallback(() => {
    setGestures([]);
  }, []);

  const deleteGesture = useCallback((gestureId: string) => {
    setGestures((prev) => prev.filter((g) => g.id !== gestureId));
  }, []);

  return {
    isCapturing,
    currentPoints,
    gestures,
    startCapture,
    addPoint,
    endCapture,
    clearGestures,
    deleteGesture,
  };
};
