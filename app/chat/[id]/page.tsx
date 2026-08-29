'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchData, saveData } from '@/lib/db';
import { getAIById } from '@/lib/aiData';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperPlane,
  FaArrowLeft,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaCog,
  FaEraser,
  FaFolderMinus,
  FaVolumeUp,
  FaVolumeMute,
  FaFont,
} from 'react-icons/fa';

export default function ChatRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [isAI, setIsAI] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);
  const [background, setBackground] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(250);
  const [responseStyle, setResponseStyle] = useState('concise');
  const bottomRef = useRef<HTMLDivElement>(null);
  const speechSynth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynth.current = window.speechSynthesis;
      // Load saved settings from localStorage
      const savedTemp = localStorage.getItem('ai_temperature');
      const savedTokens = localStorage.getItem('ai_maxTokens');
      const savedStyle = localStorage.getItem('ai_responseStyle');
      if (savedTemp) setTemperature(parseFloat(savedTemp));
      if (savedTokens) setMaxTokens(parseInt(savedTokens));
      if (savedStyle) setResponseStyle(savedStyle);
    }
  }, []);

  const getChatId = (a: string, b: string) => [a, b].sort().join('_');

  useEffect(() => {
    const findRecipient = async () => {
      const ai = await getAIById(id as string);
      if (ai) {
        setRecipient({
          id: ai.id,
          displayName: ai.name,
          username: ai.username,
          photoURL: ai.avatar,
          isAI: true,
          isOfficial: ai.isOfficial || false,
          background: ai.background,
          description: ai.description,
          voice: ai.voice,
          isMale: ai.isMale,
          systemPrompt: ai.systemPrompt || 'Never output any internal reasoning, thinking process, or <think> tags. Always answer directly, clearly, and concisely.',
          isCustom: ai.isCustom || false,
        });
        setIsAI(true);
        setIsOfficial(ai.isOfficial || false);
        setBackground(ai.background || '');
        setSystemPrompt(ai.systemPrompt || 'Never output any internal reasoning, thinking process, or <think> tags. Always answer directly, clearly, and concisely.');
        return;
      }
      const data = await fetchData();
      const users = data.users || [];
      const found = users.find((u: any) => u.id === id);
      if (found) {
        setRecipient({ ...found, isAI: false });
        setIsAI(false);
        setBackground('');
      }
    };
    findRecipient();
  }, [id]);

  const loadMessages = async () => {
    if (!user || !id) return;
    const chatId = getChatId(user.id, id as string);
    const data = await fetchData();
    const chats = data.chats || {};
    const msgs = chats[chatId] || [];
    setMessages(msgs);
    if (voiceEnabled && isAI && msgs.length > 0) {
      const last = msgs[msgs.length - 1];
      if (last.senderId === id && last.text) {
        speakText(last.text);
      }
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [id, user]);

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: systemPrompt,
          userMessage: userMessage,
          temperature: temperature,
          maxTokens: maxTokens,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'API error');
      }
      const data = await res.json();
      return data.reply || 'Sorry, I could not generate a response.';
    } catch (e: any) {
      console.error('AI fetch error:', e);
      return `⚠️ Error: ${e.message || 'Could not reach the AI service.'}`;
    }
  };

  // ----- Delete a single message -----
  const deleteMessage = async (messageId: string) => {
    if (!user) return;
    const chatId = getChatId(user.id, id as string);
    const data = await fetchData();
    const chats = data.chats || {};
    if (!chats[chatId]) return;
    const updatedMessages = chats[chatId].filter((m: any) => m.id !== messageId);
    chats[chatId] = updatedMessages;
    await saveData({ ...data, chats });
    loadMessages();
  };

  // ----- Edit message (start) -----
  const startEditMessage = (message: any) => {
    if (message.senderId !== user?.id) return;
    setEditingMessageId(message.id);
    setEditText(message.text);
  };

  // ----- Edit message (save) -----
  const saveEditMessage = async () => {
    if (!editingMessageId || !editText.trim()) return;
    const chatId = getChatId(user.id, id as string);
    const data = await fetchData();
    const chats = data.chats || {};
    if (!chats[chatId]) return;
    const idx = chats[chatId].findIndex((m: any) => m.id === editingMessageId);
    if (idx === -1) return;
    chats[chatId][idx].text = editText.trim();
    chats[chatId][idx].edited = true;
    await saveData({ ...data, chats });
    setEditingMessageId(null);
    setEditText('');
    loadMessages();
  };

  // ----- Reset chat (clear all messages) -----
  const resetChat = async () => {
    if (!user || !id) return;
    if (!confirm('Reset this chat? All messages will be deleted.')) return;
    const chatId = getChatId(user.id, id as string);
    const data = await fetchData();
    const chats = data.chats || {};
    if (chats[chatId]) {
      chats[chatId] = [];
      await saveData({ ...data, chats });
      loadMessages();
    }
    setShowSettings(false);
  };

  // ----- Delete entire chat -----
  const deleteChat = async () => {
    if (!user || !id) return;
    if (!confirm('Delete this entire chat? All messages will be permanently removed.')) return;
    const chatId = getChatId(user.id, id as string);
    const data = await fetchData();
    const chats = data.chats || {};
    if (chats[chatId]) {
      delete chats[chatId];
      await saveData({ ...data, chats });
      router.push('/chat');
    }
    setShowSettings(false);
  };

  // ----- Send message -----
  const sendMessage = async () => {
    if (!text.trim() || !user || !recipient) return;
    const chatId = getChatId(user.id, id as string);
    const data = await fetchData();
    const chats = data.chats || {};
    if (!chats[chatId]) chats[chatId] = [];
    const msg = {
      id: Date.now().toString(),
      senderId: user.id,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    chats[chatId].push(msg);
    await saveData({ ...data, chats });
    setText('');
    loadMessages();

    if (isAI) {
      setTimeout(async () => {
        const aiReply = await getAIResponse(text.trim());
        const aiMsg = {
          id: Date.now().toString(),
          senderId: recipient.id,
          text: aiReply,
          timestamp: new Date().toISOString(),
        };
        const updatedData = await fetchData();
        const updatedChats = updatedData.chats || {};
        if (!updatedChats[chatId]) updatedChats[chatId] = [];
        updatedChats[chatId].push(aiMsg);
        await saveData({ ...updatedData, chats: updatedChats });
        loadMessages();
      }, 1000);
    }
  };

  // ----- Text‑to‑speech -----
  const speakText = (text: string) => {
    if (!speechSynth.current || !voiceEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (recipient?.voice) {
      utterance.voice = speechSynth.current.getVoices().find(v => v.name === recipient.voice.name) || null;
      utterance.lang = recipient.voice.lang || 'en-US';
    }
    utterance.rate = 1;
    const name = recipient?.name || '';
    if (name.includes('Batman')) utterance.pitch = 0.7;
    else if (name.includes('Superman') || name.includes('Spider-Man')) utterance.pitch = 0.9;
    else if (name.includes('Wonder Woman') || name.includes('Black Widow')) utterance.pitch = 1.2;
    else if (name.includes('Thor')) utterance.pitch = 0.8;
    else if (name.includes('Hulk')) utterance.pitch = 0.6;
    else utterance.pitch = recipient?.isMale ? 0.9 : 1.1;
    speechSynth.current.speak(utterance);
  };

  const toggleVoice = () => {
    setVoiceEnabled(prev => {
      if (prev) speechSynth.current?.cancel();
      return !prev;
    });
  };

  // ----- Navigate to AI profile -----
  const goToAIProfile = () => {
    if (isAI && recipient) {
      router.push(`/ai-profile/${recipient.id}`);
    }
  };

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('ai_temperature', String(temperature));
    localStorage.setItem('ai_maxTokens', String(maxTokens));
    localStorage.setItem('ai_responseStyle', responseStyle);
    setShowSettings(false);
  };

  if (!recipient) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
  }

  return (
    <div
      className="flex flex-col h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: background ? `url(${background})` : 'none' }}
    >
      <div className={`absolute inset-0 ${background ? 'bg-black/60' : 'bg-black'}`} />
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-white hover:text-gray-300">
              <FaArrowLeft size={20} />
            </button>
            <div
              onClick={goToAIProfile}
              className={`flex items-center gap-3 ${isAI ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              {recipient.photoURL && (
                <Image src={recipient.photoURL} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
              )}
              <div>
                <p className="text-white font-bold">{recipient.displayName}</p>
                <p className="text-gray-300 text-xs">
                  {isAI ? 'AI Assistant' : `@${recipient.username}`}
                  {isOfficial && <span className="ml-1 text-blue-400">✓ Verified</span>}
                  {recipient.isCustom && <span className="ml-1 text-green-400">Custom</span>}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleVoice} className="text-white hover:text-blue-400">
              {voiceEnabled ? <FaVolumeUp size={20} /> : <FaVolumeMute size={20} />}
            </button>
            <button onClick={() => setShowSettings(true)} className="text-white hover:text-gray-300">
              <FaCog size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isOwn = m.senderId === user?.id;
            const isEditing = editingMessageId === m.id;
            return (
              <div key={m.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3 rounded max-w-[75%] ${
                    isOwn ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        className="bg-gray-800 text-white p-1 rounded flex-1"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                      />
                      <button onClick={saveEditMessage} className="text-green-400 hover:text-green-300">
                        <FaCheck size={18} />
                      </button>
                      <button onClick={() => setEditingMessageId(null)} className="text-red-400 hover:text-red-300">
                        <FaTimes size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      {m.text}
                      {m.edited && <span className="text-xs text-gray-400 ml-1">(edited)</span>}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {isOwn && !isEditing && (
                    <>
                      <button
                        onClick={() => startEditMessage(m)}
                        className="text-gray-400 hover:text-blue-400 text-sm"
                        title="Edit message"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => deleteMessage(m.id)}
                        className="text-gray-400 hover:text-red-400 text-sm"
                        title="Delete message"
                      >
                        <FaTrash size={16} />
                      </button>
                    </>
                  )}
                  {!isOwn && (
                    <button
                      onClick={() => deleteMessage(m.id)}
                      className="text-gray-400 hover:text-red-400 text-sm"
                      title="Delete message"
                    >
                      <FaTrash size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-black/50 backdrop-blur-sm flex gap-2">
          <input
            className="flex-1 bg-gray-800/80 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl text-white font-semibold transition">
            <FaPaperPlane />
          </button>
        </div>

        {/* Settings Modal – Full Screen */}
        {showSettings && (
          <div className="absolute inset-0 bg-black z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
              <h2 className="text-white text-xl font-bold">AI Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                <FaTimes size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Chat Actions */}
              <div className="space-y-3">
                <h3 className="text-gray-400 text-sm uppercase tracking-wider">Chat Actions</h3>
                <button
                  onClick={resetChat}
                  className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-xl transition"
                >
                  <FaEraser size={18} />
                  <span>Reset Chat (clear all messages)</span>
                </button>
                <button
                  onClick={deleteChat}
                  className="w-full flex items-center gap-3 bg-red-800 hover:bg-red-700 text-white p-4 rounded-xl transition"
                >
                  <FaFolderMinus size={18} />
                  <span>Delete Entire Chat</span>
                </button>
              </div>

              <hr className="border-gray-700" />

              {/* Voice Settings */}
              <div className="space-y-3">
                <h3 className="text-gray-400 text-sm uppercase tracking-wider">Voice & Audio</h3>
                <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl">
                  <span className="text-white">Voice Output</span>
                  <button
                    onClick={() => {
                      setVoiceEnabled(!voiceEnabled);
                      if (voiceEnabled) speechSynth.current?.cancel();
                    }}
                    className={`px-4 py-2 rounded-full text-sm ${
                      voiceEnabled ? 'bg-blue-600' : 'bg-gray-600'
                    } text-white`}
                  >
                    {voiceEnabled ? 'On' : 'Off'}
                  </button>
                </div>
              </div>

              <hr className="border-gray-700" />

              {/* AI Response Settings */}
              <div className="space-y-4">
                <h3 className="text-gray-400 text-sm uppercase tracking-wider">AI Response Settings</h3>
                
                <div className="bg-gray-800 p-4 rounded-xl">
                  <label className="text-white block mb-2">Temperature: {temperature.toFixed(1)}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <p className="text-gray-400 text-xs mt-1">Lower = more predictable, Higher = more creative</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-xl">
                  <label className="text-white block mb-2">Max Tokens: {maxTokens}</label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <p className="text-gray-400 text-xs mt-1">Controls response length</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-xl">
                  <label className="text-white block mb-2">Response Style</label>
                  <select
                    value={responseStyle}
                    onChange={(e) => setResponseStyle(e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded-lg"
                  >
                    <option value="concise">Concise (Short & Direct)</option>
                    <option value="detailed">Detailed (Explanatory)</option>
                    <option value="friendly">Friendly (Warm & Chatty)</option>
                  </select>
                </div>
              </div>

              <hr className="border-gray-700" />

              {/* Save & Close */}
              <button
                onClick={saveSettings}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
