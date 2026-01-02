"use client";

import { useState, useEffect, useRef } from 'react';

export default function GalleryItem({ img, idx, onClick }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl bg-[#1a1a1a] cursor-zoom-in transition-transform hover:scale-[1.02] hover:z-10 ${img.type === 'PC' ? 'col-span-2 row-span-1' : 'col-span-1 row-span-2'}`}
    >
      <img 
        ref={imgRef}
        src={`/images/${img.src}`} 
        alt="gallery image" 
        className={`w-full h-full object-cover block transition-all duration-500 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
        loading={idx < 12 ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
      />
    </div>
  );
}
