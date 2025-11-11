export interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export interface Gesture {
  id: string;
  name: string;
  points: Point[];
  duration: number;
  userId: string;
  createdAt: number;
  tags: string[];
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
}

export interface GestureShare {
  id: string;
  gesture: Gesture;
  sharedBy: string;
  sharedWith: string[];
  timestamp: number;
  message?: string;
}

export interface GestureSession {
  id: string;
  participants: User[];
  gestures: Gesture[];
  startTime: number;
  endTime?: number;
  isActive: boolean;
}
