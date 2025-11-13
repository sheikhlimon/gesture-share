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

  // Show pro tip when idle (no active gesture)
  const isActionGesture = currentGesture === "POINT_UP" || 
                         currentGesture === "FIST" || 
                         currentGesture === "PEACE_SIGN";

  if (!isActionGesture) {
    return (
      <div className="absolute top-4 left-4 z-20 animate-pulse">
        <div className="bg-white/95 backdrop-blur-lg border border-white/30 rounded-2xl p-3 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 max-w-[280px]">
          <div className="text-2xl animate-pulse">
            ✋
          </div>
          <div className="text-sm font-medium text-gray-700">
            <span className="font-semibold text-gray-900">Pro Tip:</span> Show open hand before each gesture for better detection
          </div>
        </div>
      </div>
    );
  }

  // Don't show anything during active gesture detection
  return null;
};

export default GestureTips;
