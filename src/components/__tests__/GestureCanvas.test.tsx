import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GestureCanvas } from '../GestureCanvas';
import { Point } from '../../types/gesture';

describe('GestureCanvas', () => {
  const defaultProps = {
    isCapturing: false,
    points: [],
    onPointAdd: vi.fn(),
    onStartCapture: vi.fn(),
    onEndCapture: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render canvas element', () => {
    render(<GestureCanvas {...defaultProps} />);
    
    const canvas = screen.getByRole('img'); // Canvas has img role by default
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('border-2', 'rounded-lg', 'cursor-crosshair');
  });

  it('should apply correct styling when capturing', () => {
    render(<GestureCanvas {...defaultProps} isCapturing={true} />);
    
    const canvas = screen.getByRole('img');
    expect(canvas).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('should apply correct styling when not capturing', () => {
    render(<GestureCanvas {...defaultProps} isCapturing={false} />);
    
    const canvas = screen.getByRole('img');
    expect(canvas).toHaveClass('border-gray-300', 'bg-white');
  });

  it('should show recording message when capturing', () => {
    render(<GestureCanvas {...defaultProps} isCapturing={true} />);
    
    expect(screen.getByText('Recording gesture... Release to finish')).toBeInTheDocument();
  });

  it('should not show recording message when not capturing', () => {
    render(<GestureCanvas {...defaultProps} isCapturing={false} />);
    
    expect(screen.queryByText('Recording gesture... Release to finish')).not.toBeInTheDocument();
  });

  it('should call onStartCapture when mousedown and not capturing', async () => {
    const user = userEvent.setup();
    render(<GestureCanvas {...defaultProps} isCapturing={false} />);
    
    const canvas = screen.getByRole('img');
    await user.click(canvas);
    
    expect(defaultProps.onStartCapture).toHaveBeenCalled();
    expect(defaultProps.onPointAdd).toHaveBeenCalledWith(0, 0); // Mock position
  });

  it('should not call onStartCapture when mousedown and already capturing', async () => {
    const user = userEvent.setup();
    render(<GestureCanvas {...defaultProps} isCapturing={true} />);
    
    const canvas = screen.getByRole('img');
    await user.click(canvas);
    
    expect(defaultProps.onStartCapture).not.toHaveBeenCalled();
    expect(defaultProps.onPointAdd).toHaveBeenCalledWith(0, 0);
  });

  it('should call onPointAdd when mouse moves during capture', async () => {
    const user = userEvent.setup();
    render(<GestureCanvas {...defaultProps} isCapturing={true} />);
    
    const canvas = screen.getByRole('img');
    await user.pointer([
      { keys: '[MouseLeft]', target: canvas },
      { pointerName: 'mouse', target: canvas, coords: { clientX: 10, clientY: 20 } }
    ]);
    
    expect(defaultProps.onPointAdd).toHaveBeenCalledWith(10, 20);
  });

  it('should call onEndCapture when mouse up during capture', async () => {
    const user = userEvent.setup();
    render(<GestureCanvas {...defaultProps} isCapturing={true} />);
    
    const canvas = screen.getByRole('img');
    await user.pointer([
      { keys: '[MouseLeft]', target: canvas },
      { keys: '[/MouseLeft]' }
    ]);
    
    expect(defaultProps.onEndCapture).toHaveBeenCalled();
  });

  it('should handle touch events', async () => {
    const user = userEvent.setup();
    render(<GestureCanvas {...defaultProps} isCapturing={false} />);
    
    const canvas = screen.getByRole('img');
    
    await user.touch(canvas);
    
    expect(defaultProps.onStartCapture).toHaveBeenCalled();
    expect(defaultProps.onPointAdd).toHaveBeenCalledWith(0, 0);
  });

  it('should handle touch move events', async () => {
    const user = userEvent.setup();
    render(<GestureCanvas {...defaultProps} isCapturing={true} />);
    
    const canvas = screen.getByRole('img');
    
    await user.pointer([
      { pointerName: 'touch', target: canvas, keys: '[TouchA]' },
      { pointerName: 'touch', coords: { clientX: 30, clientY: 40 } }
    ]);
    
    expect(defaultProps.onPointAdd).toHaveBeenCalledWith(30, 40);
  });

  it('should handle touch end events', async () => {
    const user = userEvent.setup();
    render(<GestureCanvas {...defaultProps} isCapturing={true} />);
    
    const canvas = screen.getByRole('img');
    
    await user.pointer([
      { pointerName: 'touch', target: canvas, keys: '[TouchA]' },
      { pointerName: 'touch', keys: '[/TouchA]' }
    ]);
    
    expect(defaultProps.onEndCapture).toHaveBeenCalled();
  });

  it('should call onEndCapture when mouse leaves canvas during capture', async () => {
    const user = userEvent.setup();
    render(<GestureCanvas {...defaultProps} isCapturing={true} />);
    
    const canvas = screen.getByRole('img');
    
    await user.pointer([
      { keys: '[MouseLeft]', target: canvas },
      { target: document.body } // Move outside canvas
    ]);
    
    expect(defaultProps.onEndCapture).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const customClass = 'custom-test-class';
    render(<GestureCanvas {...defaultProps} className={customClass} />);
    
    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveClass(customClass);
  });

  it('should display points count when points exist', () => {
    // This would be tested in the parent component, but we can verify the canvas renders
    const points: Point[] = [
      { x: 100, y: 200, timestamp: 0 },
      { x: 150, y: 250, timestamp: 10 }
    ];
    
    render(<GestureCanvas {...defaultProps} points={points} />);
    
    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
    // Canvas drawing logic would be tested through integration tests
  });

  it('should handle mouse events correctly without capturing', async () => {
    const user = userEvent.setup();
    render(<GestureCanvas {...defaultProps} isCapturing={false} />);
    
    const canvas = screen.getByRole('img');
    
    // Mouse move without mousedown first should not add points
    await user.hover(canvas);
    fireEvent.mouseMove(canvas, { clientX: 50, clientY: 60 });
    
    expect(defaultProps.onPointAdd).not.toHaveBeenCalled();
  });

  it('should prevent default on touch events', async () => {
    const user = userEvent.setup();
    render(<GestureCanvas {...defaultProps} isCapturing={false} />);
    
    const canvas = screen.getByRole('img');
    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [new Touch({ identifier: 1, target: canvas, clientX: 0, clientY: 0 })]
    });
    
    let defaultPrevented = false;
    touchStartEvent.preventDefault = () => { defaultPrevented = true; };
    
    canvas.dispatchEvent(touchStartEvent);
    
    expect(defaultPrevented).toBe(true);
  });
});
