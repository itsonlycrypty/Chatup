'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { FaCamera, FaSignOutAlt, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Profile() {
  const { user, loading, login, signup, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [photoURL, setPhotoURL] = useState<string>('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load user profile data
  useEffect(() => {
    if (user) {
      if (!db) return;
      const fetchUser = async () => {
        const docRef = doc(db!, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPhotoURL(data.photoURL || '');
          setDisplayName(data.displayName || user.email || '');
        } else {
          await setDoc(docRef, { email: user.email, photoURL: '', displayName: user.email });
        }
      };
      fetchUser();
    }
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!storage || !db) return alert('Firebase not initialized');
    try {
      const storageRef = ref(storage!, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db!, 'users', user.uid), { photoURL: url });
      setPhotoURL(url);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
  };

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Show loading screen while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Login / Signup screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-6">
        <div className="w-full max-w-sm bg-gray-800/50 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-gray-700">
          <h1 className="text-4xl font-bold text-center text-white mb-8">Chat Up</h1>
          <div className="space-y-4">
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
              <input
                className="w-full bg-gray-700/50 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <FaLock className="absolute left-3 top-3 text-gray-400" />
              <input
                className="w-full bg-gray-700/50 text-white pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <button
              onClick={handleAuth}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-200"
            >
              {isLogin ? 'Log In' : 'Sign Up'}
            </button>
            <p
              className="text-center text-gray-400 cursor-pointer hover:text-white transition"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'No account? Create one' : 'Already have an account? Log in'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Profile screen (logged in)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6 pb-24">
      <div className="max-w-sm mx-auto">
        <div className="bg-gray-800/50 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-gray-700">
          <div className="flex flex-col items-center">
            <div
              onClick={() => fileRef.current?.click()}
              className="relative w-32 h-32 rounded-full bg-gray-700 overflow-hidden cursor-pointer border-4 border-blue-500 hover:opacity-80 transition"
            >
              {photoURL ? (
                <Image src={photoURL} alt="Profile" width={128} height={128} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-600">📷</div>
              )}
              <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 border-2 border-gray-900">
                <FaCamera className="text-white text-sm" />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <h2 className="text-2xl font-bold text-white mt-4">{displayName}</h2>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <button
              onClick={logout}
              className="mt-6 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl transition"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
            }
