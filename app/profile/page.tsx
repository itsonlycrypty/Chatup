'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function Profile() {
  const { user, login, signup, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [photoURL, setPhotoURL] = useState<string>('');
  const [displayName, setDisplayName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Load user profile data
  useEffect(() => {
    if (user) {
      const fetchUser = async () => {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPhotoURL(data.photoURL || '');
          setDisplayName(data.displayName || user.email || '');
        } else {
          // create user document on first login
          await setDoc(docRef, { email: user.email, photoURL: '', displayName: user.email });
        }
      };
      fetchUser();
    }
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const storageRef = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
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

  if (!user) {
    return (
      <div className="p-6 h-screen flex flex-col justify-center">
        <h1 className="text-3xl font-bold text-center mb-8">Chat Up</h1>
        <input
          className="bg-gray-800 p-3 rounded mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="bg-gray-800 p-3 rounded mb-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleAuth} className="bg-blue-600 p-3 rounded font-bold">
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
        <p
          className="text-center mt-4 text-gray-400 cursor-pointer"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'No account? Sign Up' : 'Have an account? Login'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24">
      <div className="flex flex-col items-center">
        <div
          onClick={() => fileRef.current?.click()}
          className="w-32 h-32 rounded-full bg-gray-700 overflow-hidden cursor-pointer border-4 border-blue-500"
        >
          {photoURL ? (
            <Image src={photoURL} alt="Profile" width={128} height={128} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        <h2 className="text-xl mt-4">{displayName || user.email}</h2>
        <p className="text-sm text-gray-400">{user.email}</p>
        <button onClick={logout} className="mt-6 bg-red-600 px-6 py-2 rounded">
          Logout
        </button>
        <p className="text-xs text-gray-500 mt-6">Built for AppCreator24 APK</p>
      </div>
    </div>
  );
}
