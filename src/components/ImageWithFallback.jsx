import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

export default function ImageWithFallback({ src, alt, className }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`grid place-items-center bg-gradient-to-br from-coffee via-charcoal to-ink text-gold ${className}`}>
        <ImageIcon size={36} />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setHasError(true)} />;
}
