import React from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";

interface QRDisplayProps {
  value: string;
  size?: number;
  title?: string;
  className?: string;
}

export const QRDisplay = React.memo<QRDisplayProps>(
  ({ value, size = 256, title = "Scan to connect", className = "" }) => (
    <div className={`qr-display ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">{title}</h3>
      <div className="inline-block p-4 bg-white rounded-lg border shadow-sm">
        <QRCode
          value={value}
          size={size}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
          includeMargin={true}
        />
      </div>

    </div>
  ),
);

QRDisplay.displayName = "QRDisplay";
