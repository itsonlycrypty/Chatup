'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function VideoEmbed({ url }: { url: string }) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [type, setType] = useState<'youtube' | 'instagram' | 'tiktok' | 'vimeo' | 'direct' | 'image' | 'unknown'>('unknown');
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    
    // YouTube
    if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
      setType('youtube');
      let videoId = '';
      if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0] || '';
      } else {
        videoId = url.split('/').pop() || '';
      }
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}`);
      setThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
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

  if (type === 'vimeo') {
    return (
      <div className="aspect-video bg-black">
        <iframe
          src={embedUrl || ''}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
        />
      </div>
    );
  }

  if (type === 'instagram') {
    return (
      <div className="p-4 bg-gray-800 rounded">
        <a href={embedUrl || url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-2">
          📸 View on Instagram
        </a>
      </div>
    );
  }

  if (type === 'tiktok') {
    return (
      <div className="p-4 bg-gray-800 rounded">
        <a href={embedUrl || url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-2">
          🎵 View on TikTok
        </a>
      </div>
    );
  }

  if (type === 'image') {
    return (
      <Image src={embedUrl || url} alt="External" width={400} height={400} className="w-full h-auto object-cover" />
    );
  }

  if (type === 'direct') {
    return (
      <video src={embedUrl || url} controls className="w-full h-auto object-cover" />
    );
  }

  if (type === 'unknown') {
    return (
      <div className="p-4 bg-gray-800 rounded">
        <a href={embedUrl || url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
          🔗 Open Link
        </a>
      </div>
    );
  }

  return null;
    }
