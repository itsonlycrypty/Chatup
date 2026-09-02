'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function VideoEmbed({ url, thumbnail }: { url: string; thumbnail?: string }) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [type, setType] = useState<'youtube' | 'direct' | 'image' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    
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
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&enablejsapi=1`);
      // YouTube iframe will trigger 'load' event
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
      setLoading(false);
    }
    else {
      setType('unknown');
      setEmbedUrl(url);
      setLoading(false);
    }
  }, [url]);

  // Lazy load for direct video
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
              // Once loaded, hide loading spinner
              video.oncanplay = () => setLoading(false);
              video.onerror = () => setLoading(false);
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
      <div className="relative w-full h-full">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="animate-spin h-10 w-10 border-t-4 border-b-4 border-blue-500 rounded-full" />
          </div>
        )}
        <iframe
          src={embedUrl || ''}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
          onLoad={() => setLoading(false)}
        />
      </div>
    );
  }

  if (type === 'direct') {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="animate-spin h-10 w-10 border-t-4 border-b-4 border-blue-500 rounded-full" />
          </div>
        )}
        <video
          ref={videoRef}
          data-src={embedUrl || ''}
          className="w-full h-full object-contain"
          controls
          playsInline
          preload="metadata"
          poster={thumbnail || ''}
          loop
          onLoadedData={() => setLoading(false)}
          onError={() => setLoading(false)}
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
