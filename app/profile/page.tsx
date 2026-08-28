'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaCamera, FaSignOutAlt, FaEdit, FaCheck, FaTimes, FaHeart, FaPlus, FaClock, FaCheckCircle, FaCog } from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FloatingPlusButton from '@/components/FloatingPlusButton';
import { fetchData } from '@/lib/db';

export default function Profile() {
  const { user, loading, login, logout, updateUser } = useAuth();
  const router = useRouter();
  // ... (existing state variables remain the same) ...
  const [showSettings, setShowSettings] = useState(false);
  // Settings state
  const [settings, setSettings] = useState({
    darkMode: true,
    language: 'English',
    notificationSounds: true,
    aiVoice: true,
    autoPlayVideos: true,
    autoSaveChats: true,
    showTypingIndicator: true,
    messageReadReceipts: true,
    mediaAutoDownload: false,
    privacyMode: false,
    twoFactorAuth: false,
    biometricLogin: false,
    screenLock: false,
    appTheme: 'Dark',
    textSize: 'Medium',
    chatBubbleStyle: 'Rounded',
    sendOnEnter: true,
    offlineMode: false,
    dataSaver: false,
    highQualityMedia: true,
    storyAutoPlay: true,
    storyMute: false,
    notificationPreview: 'Name & Message',
    callNotification: 'Ring & Vibrate',
    groupNotification: 'All Messages',
  });

  const toggleSetting = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ... (rest of the component code remains the same, but we'll include the full updated settings modal)

  // For brevity, I'll only show the new settings modal content:
  return (
    // ... (existing JSX)
    {showSettings && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-xl font-bold">Settings</h2>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
              <FaTimes size={20} />
            </button>
          </div>
          <div className="space-y-3">
            {/* 20+ settings */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Dark Mode</span>
              <button onClick={() => toggleSetting('darkMode')} className={`px-4 py-1 rounded-full text-sm ${settings.darkMode ? 'bg-blue-600' : 'bg-gray-600'}`}>
                {settings.darkMode ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Language</span>
              <select className="bg-gray-700 text-white rounded p-1" value={settings.language} onChange={(e) => setSettings({...settings, language: e.target.value})}>
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Chinese</option>
                <option>Japanese</option>
              </select>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Notification Sounds</span>
              <button onClick={() => toggleSetting('notificationSounds')} className={`px-4 py-1 rounded-full text-sm ${settings.notificationSounds ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.notificationSounds ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">AI Voice</span>
              <button onClick={() => toggleSetting('aiVoice')} className={`px-4 py-1 rounded-full text-sm ${settings.aiVoice ? 'bg-purple-600' : 'bg-gray-600'}`}>
                {settings.aiVoice ? 'Enable' : 'Disable'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Auto‑Play Videos</span>
              <button onClick={() => toggleSetting('autoPlayVideos')} className={`px-4 py-1 rounded-full text-sm ${settings.autoPlayVideos ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.autoPlayVideos ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Auto‑Save Chats</span>
              <button onClick={() => toggleSetting('autoSaveChats')} className={`px-4 py-1 rounded-full text-sm ${settings.autoSaveChats ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.autoSaveChats ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Show Typing Indicator</span>
              <button onClick={() => toggleSetting('showTypingIndicator')} className={`px-4 py-1 rounded-full text-sm ${settings.showTypingIndicator ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.showTypingIndicator ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Message Read Receipts</span>
              <button onClick={() => toggleSetting('messageReadReceipts')} className={`px-4 py-1 rounded-full text-sm ${settings.messageReadReceipts ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.messageReadReceipts ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Media Auto‑Download</span>
              <button onClick={() => toggleSetting('mediaAutoDownload')} className={`px-4 py-1 rounded-full text-sm ${settings.mediaAutoDownload ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.mediaAutoDownload ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Privacy Mode</span>
              <button onClick={() => toggleSetting('privacyMode')} className={`px-4 py-1 rounded-full text-sm ${settings.privacyMode ? 'bg-red-600' : 'bg-gray-600'}`}>
                {settings.privacyMode ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Two‑Factor Auth</span>
              <button onClick={() => toggleSetting('twoFactorAuth')} className={`px-4 py-1 rounded-full text-sm ${settings.twoFactorAuth ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.twoFactorAuth ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Biometric Login</span>
              <button onClick={() => toggleSetting('biometricLogin')} className={`px-4 py-1 rounded-full text-sm ${settings.biometricLogin ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.biometricLogin ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Screen Lock</span>
              <button onClick={() => toggleSetting('screenLock')} className={`px-4 py-1 rounded-full text-sm ${settings.screenLock ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.screenLock ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">App Theme</span>
              <select className="bg-gray-700 text-white rounded p-1" value={settings.appTheme} onChange={(e) => setSettings({...settings, appTheme: e.target.value})}>
                <option>Dark</option>
                <option>Light</option>
                <option>System</option>
              </select>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Text Size</span>
              <select className="bg-gray-700 text-white rounded p-1" value={settings.textSize} onChange={(e) => setSettings({...settings, textSize: e.target.value})}>
                <option>Small</option>
                <option>Medium</option>
                <option>Large</option>
              </select>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Chat Bubble Style</span>
              <select className="bg-gray-700 text-white rounded p-1" value={settings.chatBubbleStyle} onChange={(e) => setSettings({...settings, chatBubbleStyle: e.target.value})}>
                <option>Rounded</option>
                <option>Square</option>
                <option>Sharp</option>
              </select>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Send on Enter</span>
              <button onClick={() => toggleSetting('sendOnEnter')} className={`px-4 py-1 rounded-full text-sm ${settings.sendOnEnter ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.sendOnEnter ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Offline Mode</span>
              <button onClick={() => toggleSetting('offlineMode')} className={`px-4 py-1 rounded-full text-sm ${settings.offlineMode ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.offlineMode ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Data Saver</span>
              <button onClick={() => toggleSetting('dataSaver')} className={`px-4 py-1 rounded-full text-sm ${settings.dataSaver ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.dataSaver ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">High Quality Media</span>
              <button onClick={() => toggleSetting('highQualityMedia')} className={`px-4 py-1 rounded-full text-sm ${settings.highQualityMedia ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.highQualityMedia ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Story Auto‑Play</span>
              <button onClick={() => toggleSetting('storyAutoPlay')} className={`px-4 py-1 rounded-full text-sm ${settings.storyAutoPlay ? 'bg-green-600' : 'bg-gray-600'}`}>
                {settings.storyAutoPlay ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Story Mute</span>
              <button onClick={() => toggleSetting('storyMute')} className={`px-4 py-1 rounded-full text-sm ${settings.storyMute ? 'bg-red-600' : 'bg-gray-600'}`}>
                {settings.storyMute ? 'Muted' : 'Unmuted'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Notification Preview</span>
              <select className="bg-gray-700 text-white rounded p-1" value={settings.notificationPreview} onChange={(e) => setSettings({...settings, notificationPreview: e.target.value})}>
                <option>Name & Message</option>
                <option>Name Only</option>
                <option>None</option>
              </select>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Call Notification</span>
              <select className="bg-gray-700 text-white rounded p-1" value={settings.callNotification} onChange={(e) => setSettings({...settings, callNotification: e.target.value})}>
                <option>Ring & Vibrate</option>
                <option>Ring Only</option>
                <option>Vibrate Only</option>
                <option>Silent</option>
              </select>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full bg-red-600 text-white py-2 rounded-xl mt-4 hover:bg-red-700 transition">
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    // ... (rest)
  );
        }
