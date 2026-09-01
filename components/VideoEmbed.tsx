'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function VideoEmbed({ url, thumbnail }: { url: string; thumbnail?: string }) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [type, setType] = useState<'youtube' | 'direct' | 'image' | 'unknown'>('unknown');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!url) return;
    
    // YouTube
    if (url.includes('youtube.com/watch') || url.includes('youtu.be') || url.includes('youtube.com/shorts/')) {
      setType('youtube');
      let videoId = '';
      if (url.includes('shorts/')) {
        videoId = url.split('shorts/')[1]?.split('?')[0] || '';
      } else if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0] || '';
      } else {
        videoId = url.split('/').pop() || '';
      }
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`);
    }
    // Direct video
    else if (url.match(/\.(mp4|webm|mov|avi)$/i) || url.includes('mov_bbb.mp4')) {
      setType('direct');
      setEmbedUrl(url);
    }
    // Image
    else if (url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) {
      setType('image');
      setEmbedUrl(url);
    }
    else {
      setType('unknown');
      setEmbedUrl(url);
    }
  }, [url]);

  // Lazy load: only load video when it's in viewport
  useEffect(() => {
    if (type !== 'direct' || !videoRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const video = entry.target as HTMLVideoElement;
            if (video.dataset.src) {
              video.src = video.dataset.src;
              video.load();
            }
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [type]);

  if (type === 'youtube') {
    return (
      <div className="aspect-video bg-black w-full h-full">
        <iframe
          src={embedUrl || ''}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
        />
      </div>
    );
  }

  if (type === 'direct') {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          data-src={embedUrl || ''}
          className="w-full h-full object-contain"
          controls
          playsInline
          preload="metadata"
          poster={thumbnail || ''}
          loop
        />
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className="w-full h-full relative">
        <Image src={embedUrl || ''} alt="Content" fill className="object-cover" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-800 flex items-center justify-center p-4 text-gray-400">
      <span>Video not available</span>
    </div>
  );
                 }
