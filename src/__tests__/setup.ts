import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock canvas context for gesture canvas tests
const mockCanvasContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  getContext: vi.fn(() => mockCanvasContext),
};

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => mockCanvasContext),
});

// Mock getBoundingClientRect
Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
  value: vi.fn(() => ({
    left: 0,
    top: 0,
    right: 400,
    bottom: 300,
    width: 400,
    height: 300,
    x: 0,
    y: 0,
    toJSON: vi.fn(),
  })),
});
