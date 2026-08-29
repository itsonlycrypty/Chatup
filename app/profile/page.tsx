'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaCamera, FaSignOutAlt, FaEdit, FaCheck, FaTimes, FaHeart, FaPlus, FaClock, FaCheckCircle, FaCog, FaArrowLeft } from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FloatingPlusButton from '@/components/FloatingPlusButton';
import { fetchData } from '@/lib/db';

// ... (all the existing imports and types, same as before)

export default function Profile() {
  const { user, loading, login, logout, updateUser } = useAuth();
  const router = useRouter();
  // ... state variables ...

  const loadUserData = async () => {
    if (!user) return;
    // ... load displayName, username, bio, photoURL, isAdmin, isVerified, etc.

    // Hardcode followers and likes for admin account
    const isCrypty = user.username === 'Onlycrypty' || user.username === 'crypty' || user.email === 'wmax8808@gmail.com';
    if (isCrypty) {
      setFollowers(['dummy']); // just to show 4M
      setFollowing(['dummy']); // just to show 4M
      setTotalLikes(19000000);
    } else {
      setFollowers(user.followers || []);
      setFollowing(user.following || []);
      // compute likes normally
    }
    // ... rest
  };

  // In the render, for the stats, if isAdmin, show formatted numbers:
  // Following: 4M, Followers: 4M, Likes: 19M

  // For the badge visibility, the Owner badge and Verified badge already use isAdmin and isVerified, which are true for crypty.
  // Others will see them in the profile page when they visit /profile/[id] (we'll also update that).

  // ...

  return (
    // ... rest of the UI
    <div className="flex gap-6 mt-4 text-center">
      <div>
        <p className="text-white font-bold">{isAdmin ? '4M' : following.length}</p>
        <p className="text-gray-400 text-xs">Following</p>
      </div>
      <div>
        <p className="text-white font-bold">{isAdmin ? '4M' : followers.length}</p>
        <p className="text-gray-400 text-xs">Followers</p>
      </div>
      <div>
        <p className="text-white font-bold">{isAdmin ? '19M' : totalLikes}</p>
        <p className="text-gray-400 text-xs">Likes</p>
      </div>
    </div>
    // ...
  );
}
