import React from "react";
import { QRCode } from "qrcode.react";

interface QRDisplayProps {
  value: string;
  size?: number;
  title?: string;
  className?: string;
}

export const QRDisplay = React.memo<QRDisplayProps>(
  ({ value, size = 256, title = "Scan to connect", className = "" }) => (
    <div className={`qr-display ${className}`}>
      <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>
      <div className="bg-white p-4 rounded-lg shadow-lg inline-block">
        <QRCode
          value={value}
          size={size}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
          includeMargin={true}
        />
      </div>
      <p className="text-sm text-gray-600 text-center mt-4">
        Or enter this code:{" "}
        <span className="font-mono bg-gray-100 px-2 py-1 rounded">{value}</span>
      </p>
    </div>
  ),
);

QRDisplay.displayName = "QRDisplay";
