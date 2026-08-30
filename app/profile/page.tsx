'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FaCamera, FaSignOutAlt, FaEdit, FaCheck, FaTimes, FaHeart, FaPlus, FaClock, FaCheckCircle, FaCog, FaArrowLeft, FaBell, FaTrash
} from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FloatingPlusButton from '@/components/FloatingPlusButton';
import { fetchData, saveData } from '@/lib/db';

// ... (types and state remain the same as the previous corrected version)

export default function Profile() {
  // ... (all state, loadUserData, etc. from the previous version)

  // The main change: remove the story privacy buttons from the main profile view.
  // In the render, we keep the story upload input but no privacy picker.

  // We keep the edit modal with privacy settings.

  // ... (rest of the component)

  return (
    <>
      <div className="min-h-screen bg-[var(--bg)] pb-24">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-[var(--bg)] z-10 sticky top-0 border-b border-[var(--border)]">
          <h1 className="text-2xl font-bold text-[var(--text)]">Profile</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-[var(--text)] hover:text-blue-400 transition relative"
            >
              <FaBell size={22} />
              {notifications.filter((n: any) => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications.filter((n: any) => !n.read).length}
                </span>
              )}
            </button>
            <button onClick={() => setShowSettings(true)} className="text-[var(--text)] hover:text-blue-400 transition">
              <FaCog size={22} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center">
            <div
              onClick={() => document.getElementById('storyInput')?.click()}
              className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden cursor-pointer border-4 border-blue-500 hover:opacity-80 transition"
            >
              {photoURL ? (
                <Image src={photoURL} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-600 text-white">
                  {displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <input
              id="storyInput"
              type="file"
              accept="image/*,video/*"
              onChange={handleStoryUpload}
              className="hidden"
            />
            {/* Removed the privacy buttons from here */}
          </div>

          <div className="text-center mt-3">
            <h2 className={`text-xl font-bold text-[var(--text)]`}>
              {displayName}
              {isVerified && <span className="ml-1 text-blue-500"><FaCheckCircle className="inline" size={18} /></span>}
            </h2>
            <p className="text-gray-400 text-sm">@{username}</p>
            {bio && <p className="text-gray-300 text-sm mt-1">{bio}</p>}
            <button
              onClick={() => setShowEdit(true)}
              className="text-blue-400 text-xs mt-2 hover:text-blue-300"
            >
              <FaEdit className="inline mr-1" /> Edit Profile
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 justify-center">
            <div>
              <p className="text-[var(--text)] font-bold">{following?.length || 0}</p>
              <p className="text-gray-400 text-xs">Following</p>
            </div>
            <div>
              <p className="text-[var(--text)] font-bold">{followers?.length || 0}</p>
              <p className="text-gray-400 text-xs">Followers</p>
            </div>
            <div>
              <p className="text-[var(--text)] font-bold">{totalLikes}</p>
              <p className="text-gray-400 text-xs">Likes</p>
            </div>
          </div>

          <button onClick={logout} className="mt-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full text-sm transition mx-auto">
            <FaSignOutAlt /> Logout
          </button>
        </div>

        {/* Stories and Posts remain the same as before */}

        <FloatingPlusButton />
      </div>

      {/* Edit Modal (with privacy settings) */}
      {showEdit && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center p-4 bg-gray-900 border-b border-gray-700">
            <button onClick={() => setShowEdit(false)} className="text-white hover:text-gray-300 mr-4">
              <FaArrowLeft size={24} />
            </button>
            <h2 className="text-white text-xl font-bold">Edit Profile</h2>
            <button onClick={saveEdit} className="ml-auto bg-blue-600 text-white px-4 py-1 rounded-full text-sm">Save</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ... profile picture upload, fields ... */}
            {/* Privacy section */}
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-white font-semibold mb-2">Privacy</h3>
              <div className="flex justify-between items-center">
                <span className="text-white">Story Visibility</span>
                <select
                  className="bg-gray-700 text-white rounded p-1"
                  value={editData.privacy?.stories || user?.privacy?.stories || 'everyone'}
                  onChange={(e) => setEditData({ ...editData, privacy: { ...editData.privacy, stories: e.target.value } })}
                >
                  <option value="everyone">Everyone</option>
                  <option value="friends">Friends</option>
                  <option value="selected">Selected</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white">Post Visibility</span>
                <select
                  className="bg-gray-700 text-white rounded p-1"
                  value={editData.privacy?.posts || user?.privacy?.posts || 'everyone'}
                  onChange={(e) => setEditData({ ...editData, privacy: { ...editData.privacy, posts: e.target.value } })}
                >
                  <option value="everyone">Everyone</option>
                  <option value="friends">Friends</option>
                  <option value="selected">Selected</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
            </div>
            <button
              onClick={async () => {
                if (confirm('Delete your profile permanently?')) {
                  const data = await fetchData();
                  const users = data.users || [];
                  const idx = users.findIndex((u: any) => u.id === user.id);
                  if (idx !== -1) {
                    users.splice(idx, 1);
                    await saveData({ ...data, users });
                    logout();
                    router.push('/');
                  }
                }
              }}
              className="w-full bg-red-600 text-white py-2 rounded-xl mt-4 hover:bg-red-700 transition"
            >
              <FaTrash className="inline mr-2" /> Delete Profile
            </button>
          </div>
        </div>
      )}

      {/* Notifications and Settings modals (same as before) */}
    </>
  );
        }
