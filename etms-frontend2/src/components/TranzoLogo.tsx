import React from 'react';
import { Bus } from 'lucide-react';

interface TranzoLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export default function TranzoLogo({ size = 'medium', showText = true }: TranzoLogoProps) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg`}>
        <Bus className={`${iconSizes[size]} text-white`} />
      </div>
      {showText && (
        <div>
          <h2 className="text-white font-bold">TRANZO</h2>
          <p className="text-emerald-200 text-sm">Transport Management</p>
        </div>
      )}
    </div>
  );
}
