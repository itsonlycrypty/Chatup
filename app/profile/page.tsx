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
    return <div className="h-screen flex items-center justify-center bg-black"><div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full"></div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6">
        <div className="w-full max-w-sm bg-gray-800/50 backdrop-blur-md rounded-3xl p-8 border border-gray-700">
          <h1 className="text-4xl font-bold text-center text-white mb-8">Chat Up</h1>
          <div className="relative mb-4">
            <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
            <input className="w-full bg-gray-700/50 text-white pl-10 pr-4 py-3 rounded-xl" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="relative">
            <FaLock className="absolute left-3 top-3 text-gray-400" />
            <input className="w-full bg-gray-700/50 text-white pl-10 pr-12 py-3 rounded-xl" placeholder={isLogin ? "4-digit PIN" : "Create 4-digit PIN"} type={showPin ? 'text' : 'password'} maxLength={4} value={pin} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 4) setPin(v); }} />
            <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-3 text-gray-400">{showPin ? <FaEyeSlash /> : <FaEye />}</button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button onClick={async () => { try { await login(email, pin); } catch (err: any) { setError(err.message); } }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl mt-4 transition">{isLogin ? 'Log In' : 'Sign Up'}</button>
          <p className="text-center text-gray-400 cursor-pointer mt-4" onClick={() => { setIsLogin(!isLogin); setError(''); setPin(''); }}>{isLogin ? 'No account? Create one' : 'Already have an account?'}</p>
          <p className="text-gray-500 text-center text-xs mt-4">4-digit PIN • Stored locally on your device</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24">
      <div className="max-w-sm mx-auto bg-gray-800/50 rounded-3xl p-6">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl text-white">{user.email[0].toUpperCase()}</div>
          <h2 className="text-2xl font-bold text-white mt-4">{user.email}</h2>
          <button onClick={logout} className="mt-6 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl transition"><FaSignOutAlt /> Logout</button>
          <p className="text-gray-500 text-xs mt-4">Data stored locally on your device</p>
        </div>
      </div>
    </div>
  );
}
