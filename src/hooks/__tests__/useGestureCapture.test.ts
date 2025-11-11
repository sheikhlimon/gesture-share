import { renderHook, act } from '@testing-library/react';
import { useGestureCapture } from '../useGestureCapture';
import { Gesture } from '../../types/gesture';

describe('useGestureCapture', () => {
  beforeEach(() => {
    // Clear any existing timers
    vi.clearAllTimers();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useGestureCapture());
    
    expect(result.current.isCapturing).toBe(false);
    expect(result.current.currentPoints).toEqual([]);
    expect(result.current.gestures).toEqual([]);
  });

  it('should start capture correctly', () => {
    const { result } = renderHook(() => useGestureCapture());
    
    act(() => {
      result.current.startCapture();
    });
    
    expect(result.current.isCapturing).toBe(true);
    expect(result.current.currentPoints).toEqual([]);
  });

  it('should add points during capture', () => {
    const { result } = renderHook(() => useGestureCapture());
    
    act(() => {
      result.current.startCapture();
    });
    
    act(() => {
      result.current.addPoint(100, 200);
    });
    
    expect(result.current.currentPoints).toHaveLength(1);
    expect(result.current.currentPoints[0]).toEqual({
      x: 100,
      y: 200,
      timestamp: expect.any(Number)
    });
  });

  it('should not add points when not capturing', () => {
    const { result } = renderHook(() => useGestureCapture());
    
    act(() => {
      result.current.addPoint(100, 200);
    });
    
    expect(result.current.currentPoints).toHaveLength(0);
  });

  it('should end capture and create gesture', () => {
    const { result } = renderHook(() => useGestureCapture());
    
    act(() => {
      result.current.startCapture();
      result.current.addPoint(100, 200);
      result.current.addPoint(150, 250);
    });
    
    let gesture: Gesture | null = null;
    act(() => {
      gesture = result.current.endCapture('Test Gesture', 'user-123', ['test']);
    });
    
    expect(gesture).not.toBeNull();
    expect(gesture!.name).toBe('Test Gesture');
    expect(gesture!.userId).toBe('user-123');
    expect(gesture!.tags).toEqual(['test']);
    expect(gesture!.points).toHaveLength(2);
    expect(result.current.isCapturing).toBe(false);
    expect(result.current.currentPoints).toEqual([]);
    expect(result.current.gestures).toHaveLength(1);
  });

  it('should not create gesture without points', () => {
    const { result } = renderHook(() => useGestureCapture());
    
    act(() => {
      result.current.startCapture();
    });
    
    let gesture: Gesture | null = null;
    act(() => {
      gesture = result.current.endCapture('Empty Gesture', 'user-123');
    });
    
    expect(gesture).toBeNull();
    expect(result.current.gestures).toHaveLength(0);
  });

  it('should not create gesture when not capturing', () => {
    const { result } = renderHook(() => useGestureCapture());
    
    let gesture: Gesture | null = null;
    act(() => {
      gesture = result.current.endCapture('Test Gesture', 'user-123');
    });
    
    expect(gesture).toBeNull();
    expect(result.current.gestures).toHaveLength(0);
  });

  it('should clear all gestures', () => {
    const { result } = renderHook(() => useGestureCapture());
    
    // Create some gestures first
    act(() => {
      result.current.startCapture();
      result.current.addPoint(100, 200);
      result.current.endCapture('Test 1', 'user-123');
      
      result.current.startCapture();
      result.current.addPoint(300, 400);
      result.current.endCapture('Test 2', 'user-123');
    });
    
    expect(result.current.gestures).toHaveLength(2);
    
    act(() => {
      result.current.clearGestures();
    });
    
    expect(result.current.gestures).toHaveLength(0);
  });

  it('should delete specific gesture', () => {
    const { result } = renderHook(() => useGestureCapture());
    
    // Create some gestures
    act(() => {
      result.current.startCapture();
      result.current.addPoint(100, 200);
      result.current.endCapture('Test 1', 'user-123');
    });
    
    expect(result.current.gestures).toHaveLength(1);
    
    const gestureToDelete = result.current.gestures[0];
    
    act(() => {
      result.current.deleteGesture(gestureToDelete.id);
    });
    
    expect(result.current.gestures).toHaveLength(0);
  });

  it('should generate unique gesture IDs', () => {
    const { result } = renderHook(() => useGestureCapture());
    
    const gestureIds: string[] = [];
    
    // Create multiple gestures
    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.startCapture();
        result.current.addPoint(100 + i * 10, 200 + i * 10);
        const gesture = result.current.endCapture(`Test ${i}`, 'user-123');
        if (gesture) {
          gestureIds.push(gesture.id);
        }
      });
    }
    
    // Check that all IDs are unique
    const uniqueIds = new Set(gestureIds);
    expect(uniqueIds.size).toBe(gestureIds.length);
  });

  it('should record gesture duration correctly', () => {
    const { result } = renderHook(() => useGestureCapture());
    
    act(() => {
      result.current.startCapture();
    });
    
    // Wait a bit
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    act(() => {
      result.current.addPoint(100, 200);
      result.current.endCapture('Timed Gesture', 'user-123');
    });
    
    const gesture = result.current.gestures[0];
    expect(gesture.duration).toBeGreaterThan(0);
    expect(gesture.duration).toBeLessThan(200); // Should be around 100ms
  });
});
