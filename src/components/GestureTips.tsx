import React from 'react';

interface GestureTipsProps {
  currentGesture?: string;
  showFilePickerButton?: boolean;
}

const GestureTips: React.FC<GestureTipsProps> = ({ 
  currentGesture = '', 
  showFilePickerButton = false
}) => {
  // Don't show during file picker
  if (showFilePickerButton) {
    return null;
  }

  // Show pro tip when no action gesture is detected
  // Action gestures: POINT_UP, FIST, PEACE_SIGN
  const isActionGesture = currentGesture === "POINT_UP" || 
                         currentGesture === "FIST" || 
                         currentGesture === "PEACE_SIGN";

  if (!isActionGesture) {
    return (
      <div className="absolute top-4 right-4 z-20 animate-in slide-in-from-top-2 duration-300">
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 max-w-xs">
          <span className="text-lg">✋</span>
          <span className="text-sm text-gray-700">
            Show open hand before each gesture for better detection
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export default GestureTips;
