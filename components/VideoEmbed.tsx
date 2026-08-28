'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function VideoEmbed({ url }: { url: string }) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [type, setType] = useState<'youtube' | 'direct' | 'image' | 'unknown'>('unknown');

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
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`);
    }
    // Direct video (mp4, webm, etc.)
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

  if (type === 'youtube') {
    return (
      <div className="aspect-video bg-black w-full h-full">
        <iframe
          src={embedUrl || ''}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }

  if (type === 'direct') {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <video
          src={embedUrl || ''}
          className="w-full h-full object-contain"
          controls
          autoPlay
          playsInline
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
    <div className="w-full h-full bg-gray-800 flex items-center justify-center p-4">
      <a href={embedUrl || url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
        🔗 Open Link
      </a>
    </div>
  );
             }
