'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function VideoEmbed({ url }: { url: string }) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [type, setType] = useState<'youtube' | 'instagram' | 'tiktok' | 'vimeo' | 'direct' | 'image' | 'unknown'>('unknown');

  useEffect(() => {
    if (!url) return;
    
    // YouTube (including shorts)
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
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}`);
    }
    // Instagram
    else if (url.includes('instagram.com')) {
      setType('instagram');
      setEmbedUrl(url);
    }
    // TikTok
    else if (url.includes('tiktok.com')) {
      setType('tiktok');
      setEmbedUrl(url);
    }
    // Vimeo
    else if (url.includes('vimeo.com')) {
      setType('vimeo');
      const videoId = url.split('/').pop();
      setEmbedUrl(`https://player.vimeo.com/video/${videoId}`);
    }
    // Direct image
    else if (url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) {
      setType('image');
      setEmbedUrl(url);
    }
    // Direct video
    else if (url.match(/\.(mp4|webm|mov|avi)$/i)) {
      setType('direct');
      setEmbedUrl(url);
    }
    else {
      setType('unknown');
      setEmbedUrl(url);
    }
  }, [url]);

  if (type === 'youtube') {
    return (
      <div className="aspect-video bg-black">
        <iframe
          src={embedUrl || ''}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }

  // ... rest of the component (instagram, tiktok, vimeo, image, direct, unknown) unchanged
  }
