import React from "react";
import type { NotificationState } from "../types";

export const NotificationDisplay: React.FC<{
  notification: NotificationState;
  onClose: () => void;
}> = React.memo(({ notification, onClose }) => {
  if (!notification.show) return null;

  const isSuccess = notification.type === "success";
  const bgClass = isSuccess
    ? "bg-white/95 backdrop-blur-lg border-green-200 shadow-green-100"
    : "bg-white/95 backdrop-blur-lg border-red-200 shadow-red-100";
  const iconBgClass = isSuccess
    ? "bg-green-100 text-green-600"
    : "bg-red-100 text-red-600";
  const textClass = isSuccess ? "text-green-800" : "text-red-800";
  const subTextClass = isSuccess ? "text-green-600" : "text-red-600";
  const hoverClass = isSuccess
    ? "hover:bg-green-100 text-green-400"
    : "hover:bg-red-100 text-red-400";
  const pulseClass = isSuccess ? "bg-green-500" : "bg-red-500";

  return (
    <div
      className={`fixed top-20 right-4 z-50 max-w-sm transform transition-all duration-300 ease-out animate-in slide-in-from-right-5 ${bgClass} border-2 rounded-2xl shadow-2xl p-4`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 rounded-full p-2 ${iconBgClass}`}>
          {isSuccess ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm font-display ${textClass}`}>
            {isSuccess ? "Success" : "Error"}
          </p>
          <p className={`text-sm mt-1 ${subTextClass}`}>
            {notification.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 rounded-full p-1 transition-colors ${hoverClass}`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className={`mt-3 flex items-center gap-2 text-xs ${subTextClass}`}>
        <div
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${pulseClass}`}
        />
        <span>Auto-dismissing in 4 seconds</span>
      </div>
    </div>
  );
});

NotificationDisplay.displayName = "NotificationDisplay";
