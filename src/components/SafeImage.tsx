import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-teal-50 text-slate-600 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Briefcase className="w-8 h-8 text-teal-700 mb-2" />
        {fallbackLabel && (
          <span className="text-xs font-medium text-slate-700">{fallbackLabel}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
