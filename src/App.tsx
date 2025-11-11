import React, { useState } from 'react';
import { useGestureCapture } from './hooks/useGestureCapture';
import { GestureCanvas } from './components/GestureCanvas';
import { Gesture } from './types/gesture';

function App() {
  const [selectedGesture, setSelectedGesture] = useState<Gesture | null>(null);
  const [gestureName, setGestureName] = useState('');
  const [gestureTags, setGestureTags] = useState('');
  
  const {
    isCapturing,
    currentPoints,
    gestures,
    startCapture,
    addPoint,
    endCapture,
    deleteGesture
  } = useGestureCapture();

  const handleEndCapture = () => {
    if (gestureName.trim()) {
      const tags = gestureTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const gesture = endCapture(gestureName.trim(), 'user-1', tags);
      if (gesture) {
        setSelectedGesture(gesture);
        setGestureName('');
        setGestureTags('');
      }
    }
  };

  const handleGestureSelect = (gesture: Gesture) => {
    setSelectedGesture(gesture);
  };

  const handleShareGesture = async () => {
    if (selectedGesture) {
      // TODO: Implement sharing functionality
      console.log('Sharing gesture:', selectedGesture);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Gesture Share</h1>
          <p className="text-gray-600">Create, share, and collaborate with custom gestures</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gesture Capture Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Create Gesture</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gesture Name
                </label>
                <input
                  type="text"
                  value={gestureName}
                  onChange={(e) => setGestureName(e.target.value)}
                  placeholder="Enter gesture name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isCapturing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={gestureTags}
                  onChange={(e) => setGestureTags(e.target.value)}
                  placeholder="swipe, circle, tap..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isCapturing}
                />
              </div>
            </div>

            <GestureCanvas
              isCapturing={isCapturing}
              points={currentPoints}
              onPointAdd={addPoint}
              onStartCapture={startCapture}
              onEndCapture={handleEndCapture}
              className="mb-4"
            />

            <div className="text-sm text-gray-600">
              <p>Points recorded: {currentPoints.length}</p>
              <p>Total gestures: {gestures.length}</p>
            </div>
          </div>

          {/* Gesture Library Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Gesture Library</h2>
            
            {gestures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No gestures yet. Create your first gesture!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {gestures.map((gesture) => (
                  <div
                    key={gesture.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedGesture?.id === gesture.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleGestureSelect(gesture)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{gesture.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGesture(gesture.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Points: {gesture.points.length}</p>
                      <p>Duration: {(gesture.duration / 1000).toFixed(2)}s</p>
                      {gesture.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {gesture.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedGesture && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-3">Selected: {selectedGesture.name}</h3>
                <button
                  onClick={handleShareGesture}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Share Gesture
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Collaboration Panel */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Real-time Collaboration</h2>
          <div className="text-center py-8 text-gray-500">
            <p>Collaboration features coming soon...</p>
            <p className="text-sm mt-2">Share gestures with friends and work together in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
