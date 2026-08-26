'use client';
import { useState, useEffect, useRef } from 'react';
import {
  FaHeart, FaSearch, FaComment, FaPaperPlane, FaUserPlus, FaUserCheck,
  FaShare, FaVideo, FaTimes, FaYoutube, FaSync, FaFire, FaClock,
  FaUserCircle
} from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import FloatingPlusButton from '@/components/FloatingPlusButton';
import { useAuth } from '@/context/AuthContext';
import { fetchData, saveData } from '@/lib/db';
import VideoEmbed from '@/components/VideoEmbed';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

export default function Feed() {
  const { user, allUsers, followUser } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [shorts, setShorts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'shorts'>('home');
  const [showSearch, setShowSearch] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchVideos, setSearchVideos] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchActiveTab, setSearchActiveTab] = useState<'users' | 'videos'>('users');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasFetched = useRef(false);

  // ... (loadData, fetchTrendingAndShorts, useEffect, handleRefresh, like, addComment, sharePost, getUser, isFollowing, searchYouTube, performSearch, openSearch remain the same as before)

  // ----- Render functions -----
  const renderPost = (p: any, isShort: boolean = false) => {
    const postUser = getUser(p.userId);
    const isFollowingUser = isFollowing(p.userId);

    // Override display name for youtube_bot
    const displayName = p.userId === 'youtube_bot'
      ? (isShort ? 'Shorts' : 'Trending Videos')
      : (postUser?.displayName || 'Unknown');

    const username = p.userId === 'youtube_bot'
      ? (isShort ? 'Shorts' : 'Trending')
      : (postUser?.username || '');

    return (
      <div key={p.id} className="bg-gray-900 rounded-2xl overflow-hidden mb-4">
        {/* User header – wrap in Link to profile */}
        <div className="flex items-center justify-between p-3">
          <Link href={p.userId === 'youtube_bot' ? '#' : `/profile/${p.userId}`} className="flex items-center gap-3 flex-1">
            {postUser?.photoURL ? (
              <Image src={postUser.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
            ) : p.userId === 'youtube_bot' ? (
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm">
                <FaYoutube />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                {postUser?.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <p className="text-white font-semibold text-sm">
                {displayName}
                {postUser?.isAdmin && <span className="ml-1 text-yellow-400 text-xs">⭐</span>}
                {postUser?.isVerified && <span className="ml-1 text-blue-500 text-xs">✓</span>}
                {p.userId === 'youtube_bot' && <span className="ml-1 text-red-500 text-xs">🔥</span>}
                {isShort && <span className="ml-1 text-purple-400 text-xs">#Shorts</span>}
              </p>
              <p className="text-gray-400 text-xs">
                {p.userId === 'youtube_bot' ? (isShort ? 'Shorts' : 'Trending') : `@${username}`}
              </p>
            </div>
          </Link>
          {user && postUser && postUser.id !== user.id && postUser.id !== 'youtube_bot' && (
            <button
              onClick={() => followUser(postUser.id)}
              className={`text-xs px-3 py-1 rounded-full transition ${
                isFollowingUser ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isFollowingUser ? <FaUserCheck className="inline mr-1" /> : <FaUserPlus className="inline mr-1" />}
              {isFollowingUser ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Media */}
        {p.media && p.media.startsWith('data:image') && (
          <Image src={p.media} alt="Post" width={400} height={400} className="w-full h-auto object-cover" />
        )}
        {p.media && p.media.startsWith('data:video') && (
          <video src={p.media} controls className="w-full h-auto object-cover" />
        )}
        {p.media && p.media.startsWith('http') && !p.media.startsWith('data:') && (
          <VideoEmbed url={p.media} />
        )}

        {p.text && <div className="px-3 py-1"><p className="text-white text-sm">{p.text}</p></div>}

        <div className="flex items-center gap-6 px-3 py-2 text-gray-400 text-sm">
          <button onClick={() => like(p.id, isShort)} className="flex items-center gap-1 hover:text-red-400 transition">
            <FaHeart className="text-red-400" /> {p.likes || 0}
          </button>
          <button
            onClick={() => {
              // Navigate to post detail
              window.location.href = `/post/${p.id}`;
            }}
            className="flex items-center gap-1 hover:text-blue-400 transition"
          >
            <FaComment /> {(p.comments?.length || 0)}
          </button>
          <button onClick={() => sharePost(p)} className="flex items-center gap-1 hover:text-blue-400 transition">
            <FaShare /> Share
          </button>
        </div>

        {/* Comments preview – now clicking the comment icon takes to detail page */}
        {(p.comments?.length || 0) > 0 && (
          <div className="px-3 pb-2 space-y-1">
            {p.comments.slice(-2).map((c: any) => (
              <div key={c.id} className="text-sm">
                <span className="text-blue-400 font-semibold">@{c.username}</span>
                <span className="text-gray-300 ml-2">{c.text}</span>
              </div>
            ))}
            {p.comments.length > 2 && <p className="text-gray-500 text-xs">+{p.comments.length - 2} more</p>}
          </div>
        )}

        {/* No YouTube source label – removed */}
      </div>
    );
  };

  const renderShort = (s: any) => {
    const postUser = getUser(s.userId);
    const isFollowingUser = isFollowing(s.userId);

    // Override display name for youtube_bot shorts
    const displayName = s.userId === 'youtube_bot' ? 'Shorts' : (postUser?.displayName || 'Unknown');
    const username = s.userId === 'youtube_bot' ? '' : (postUser?.username || '');

    return (
      <div key={s.id} className="relative h-screen w-full bg-black snap-start snap-always">
        <div className="absolute inset-0">
          {s.media && s.media.startsWith('http') ? (
            <VideoEmbed url={s.media} />
          ) : s.media?.startsWith('data:video') ? (
            <video src={s.media} controls className="w-full h-full object-cover" />
          ) : s.media?.startsWith('data:image') ? (
            <Image src={s.media} fill className="object-cover" alt="Short" />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500">
              No media
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-28 left-4 right-20 z-10">
          <Link href={s.userId === 'youtube_bot' ? '#' : `/profile/${s.userId}`} className="flex items-center gap-2">
            {postUser?.photoURL ? (
              <Image src={postUser.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover border-2 border-white" />
            ) : (
              <FaUserCircle size={32} className="text-white/80" />
            )}
            <span className="text-white font-semibold text-sm">
              {displayName}
              {postUser?.isAdmin && <span className="ml-1 text-yellow-400 text-xs">⭐</span>}
              {postUser?.isVerified && <span className="ml-1 text-blue-400 text-xs">✓</span>}
            </span>
          </Link>
          {user && postUser && postUser.id !== user.id && postUser.id !== 'youtube_bot' && (
            <button
              onClick={() => followUser(postUser.id)}
              className={`text-xs px-3 py-1 rounded-full transition ${
                isFollowingUser ? 'bg-gray-600/70 text-gray-200' : 'bg-blue-600/80 text-white hover:bg-blue-700'
              }`}
            >
              {isFollowingUser ? 'Following' : 'Follow'}
            </button>
          )}
          {s.text && <p className="text-white text-sm mt-1 line-clamp-2">{s.text}</p>}
        </div>

        <div className="absolute bottom-40 right-4 z-10 flex flex-col items-center gap-5">
          <button onClick={() => like(s.id, true)} className="flex flex-col items-center text-white">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition">
              <FaHeart size={24} className="text-red-400" />
            </div>
            <span className="text-xs mt-1">{s.likes || 0}</span>
          </button>

          <button
            onClick={() => { window.location.href = `/post/${s.id}`; }}
            className="flex flex-col items-center text-white"
          >
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition">
              <FaComment size={24} />
            </div>
            <span className="text-xs mt-1">{s.comments?.length || 0}</span>
          </button>

          <button onClick={() => sharePost(s)} className="flex flex-col items-center text-white">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition">
              <FaShare size={24} />
            </div>
            <span className="text-xs mt-1">Share</span>
          </button>
        </div>

        {user && (
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5 border border-white/20">
            <input
              className="flex-1 bg-transparent text-white placeholder-gray-300 p-2 text-sm focus:outline-none"
              placeholder="Add a comment..."
              value={commentText[s.id] || ''}
              onChange={(e) => setCommentText({ ...commentText, [s.id]: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addComment(s.id, true)}
            />
            <button onClick={() => addComment(s.id, true)} className="text-blue-400 hover:text-blue-300 p-1">
              <FaPaperPlane size={18} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // ... (rest of the component: render, return JSX with tabs, search modal)
}
