'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ListingLightboxProps {
  images: Array<{ url: string; sortOrder?: number }>;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

/**
 * Optimizes an image URL to load at uncompressed/maximum crystal-clear resolution.
 */
function getHighResUrl(url: string): string {
  if (!url) return '';
  // Unsplash: upgrade w=800 to w=2000 and q=95
  if (url.includes('images.unsplash.com')) {
    return url.replace(/w=\d+/, 'w=2000').replace(/q=\d+/, 'q=95');
  }
  // Cloudinary: remove downscaling transformations
  if (url.includes('res.cloudinary.com')) {
    return url.replace(/\/c_[^/]+/, '');
  }
  return url;
}

export default function ListingLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}: ListingLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [touchDeltaY, setTouchDeltaY] = useState(0);
  const lastTapRef = useRef<number>(0);

  // Sync index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Mobile Touch Gestures (Swipe & Pull-down to dismiss)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setTouchDeltaX(0);
    setTouchDeltaY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isZoomed) return;
    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;
    setTouchDeltaX(deltaX);
    setTouchDeltaY(deltaY);
  };

  const handleTouchEnd = () => {
    if (isZoomed) return;

    // Pull-down threshold to dismiss modal (downward swipe > 90px)
    if (touchDeltaY > 90 && Math.abs(touchDeltaX) < 80) {
      onClose();
      return;
    }

    // Horizontal swipe threshold (> 50px)
    if (touchDeltaX < -50) {
      handleNext();
    } else if (touchDeltaX > 50) {
      handlePrev();
    }

    setTouchDeltaX(0);
    setTouchDeltaY(0);
  };

  // Double tap to zoom
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setIsZoomed((prev) => !prev);
    }
    lastTapRef.current = now;
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const highResSrc = getHighResUrl(currentImage.url);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Controls Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-black/80 to-transparent text-white">
        <div className="flex items-center gap-3">
          <span className="bg-white/10 border border-white/20 text-white font-mono text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
            {currentIndex + 1} / {images.length}
          </span>
          {title && (
            <span className="text-xs text-slate-300 font-medium truncate max-w-xs sm:max-w-md hidden sm:inline">
              {title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom toggle button */}
          <button
            onClick={() => setIsZoomed((prev) => !prev)}
            title={isZoomed ? 'Uzaklaştır' : 'Yakınlaştır (Çift Tık)'}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md cursor-pointer"
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-rose-600/80 text-white transition backdrop-blur-md cursor-pointer ml-1"
            title="Kapat (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleDoubleTap}
      >
        <div
          className={`relative max-w-full max-h-full transition-transform duration-200 flex items-center justify-center ${
            isZoomed ? 'scale-175 sm:scale-200 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          style={{
            transform: !isZoomed && touchDeltaY > 0 ? `translateY(${touchDeltaY * 0.7}px)` : undefined,
          }}
        >
          <img
            src={highResSrc}
            alt={title || 'İlan Fotoğrafı'}
            className="max-h-[82vh] max-w-[96vw] sm:max-w-[85vw] object-contain rounded-xl shadow-2xl transition-all"
            draggable={false}
          />
        </div>

        {/* Prev / Next Arrows for Desktop */}
        {images.length > 1 && !isZoomed && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition cursor-pointer"
              title="Önceki Fotoğraf"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition cursor-pointer"
              title="Sonraki Fotoğraf"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Bar: Touch Gestures Hint & Thumbnails */}
      <div className="relative z-20 px-4 py-3 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-2">
        <p className="text-[11px] text-slate-400 text-center font-medium">
          {isZoomed ? '🔍 Yakınlaştırıldı • Uzaklaştırmak için çift dokunun' : '👆 Fotoğrafı kaydırın • Çift dokunarak yakınlaştırın • Kapatmak için aşağı çekin'}
        </p>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto max-w-full py-1 px-2 no-scrollbar">
            {images.map((img, idx) => (
              <button
                key={img.url + idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(false);
                  setCurrentIndex(idx);
                }}
                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  currentIndex === idx ? 'border-emerald-500 scale-105' : 'border-white/20 opacity-50 hover:opacity-80'
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

