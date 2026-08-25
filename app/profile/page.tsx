'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaEnvelope, FaLock, FaSignOutAlt, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Profile() {
  const { user, loading, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
                placeholder={isLogin ? "Enter 4-digit PIN" : "Create 4-digit PIN"}
                type={showPin ? 'text' : 'password'}
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 4) setPin(val);
                }}
                onKeyDown={(e) => e.key === 'Enter' && login(email, pin)}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showPin ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={async () => {
                try {
                  await login(email, pin);
                } catch (err: any) {
                  setError(err.message || 'Login failed');
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-200"
            >
              {isLogin ? 'Log In' : 'Sign Up'}
            </button>
            <p
              className="text-center text-gray-400 cursor-pointer hover:text-white transition"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setPin('');
              }}
            >
              {isLogin ? 'No account? Create one' : 'Already have an account? Log in'}
            </p>
            <p className="text-gray-500 text-center text-xs">Use a 4-digit PIN to log in on any device</p>
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
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl text-white">
              {user.email[0].toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-white mt-4">{user.email}</h2>
            <p className="text-gray-400 text-sm">Logged in with PIN</p>
            <button
              onClick={logout}
              className="mt-6 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl transition"
            >
              <FaSignOutAlt /> Logout
            </button>
            <p className="text-gray-500 text-xs mt-4">Data stored on Vercel Redis (free tier)</p>
          </div>
        </div>
      </div>
    </div>
  );
              }
