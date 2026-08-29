'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchData, saveData } from '@/lib/db';
import { getAIById } from '@/lib/aiData';
import {
  FaMicrophone, FaMicrophoneSlash, FaPaperPlane, FaArrowLeft, FaTrash,
  FaEdit, FaCheck, FaTimes, FaCog, FaEraser, FaFolderMinus, FaVolumeUp, FaVolumeMute,
  FaFont, FaPaperclip, FaFile, FaStop, FaUserPlus
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
  const [isGroup, setIsGroup] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // ----- Helper to generate chat ID -----
  const getChatId = (a: string, b: string) => [a, b].sort().join('_');

  // ----- Load recipient (AI, user, or group) -----
  useEffect(() => {
    const findRecipient = async () => {
      // Check if it's an AI
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
          systemPrompt: ai.systemPrompt || 'Never output any internal reasoning.',
          isCustom: ai.isCustom || false,
        });
        setIsAI(true);
        setIsOfficial(ai.isOfficial || false);
        setBackground(ai.background || '');
        setSystemPrompt(ai.systemPrompt || 'Never output any internal reasoning.');
        return;
      }
      // Check if it's a group
      const data = await fetchData();
      const groups = data.groups || [];
      const foundGroup = groups.find((g: any) => g.id === id);
      if (foundGroup) {
        setRecipient({
          id: foundGroup.id,
          displayName: foundGroup.name,
          username: foundGroup.name,
          photoURL: null,
          isGroup: true,
          members: foundGroup.members,
        });
        setIsGroup(true);
        setIsAI(false);
        setBackground('');
        return;
      }
      // Otherwise, it's a regular user
      const users = data.users || [];
      const found = users.find((u: any) => u.id === id);
      if (found) {
        setRecipient({ ...found, isAI: false, isGroup: false });
        setIsAI(false);
        setIsGroup(false);
        setBackground('');
      }
    };
    findRecipient();
  }, [id]);

  // ----- Load messages -----
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

  // ----- AI response (simplified fallback) -----
  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: systemPrompt,
          userMessage: userMessage,
          temperature,
          maxTokens,
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

  // ----- Send message with optional file/voice -----
  const sendMessage = async (mediaData?: string, mediaType?: string) => {
    if (!text.trim() && !mediaData) return;
    if (!user || !recipient) return;

    const chatId = getChatId(user.id, id as string);
    const data = await fetchData();
    const chats = data.chats || {};
    if (!chats[chatId]) chats[chatId] = [];

    const msg: any = {
      id: Date.now().toString(),
      senderId: user.id,
      text: text.trim() || '',
      timestamp: new Date().toISOString(),
    };
    if (mediaData) {
      msg.media = mediaData;
      msg.mediaType = mediaType || 'file';
    }
    chats[chatId].push(msg);
    await saveData({ ...data, chats });
    setText('');
    loadMessages();

    if (isAI && !mediaData) {
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

  // ----- File attachment handler -----
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      sendMessage(dataUrl, file.type);
    };
    reader.readAsDataURL(file);
  };

  // ----- Voice recording -----
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          sendMessage(dataUrl, 'audio/webm');
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Could not access microphone: ' + err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // ----- Render message content (text + media) -----
  const renderMessageContent = (m: any) => {
    if (m.media) {
      if (m.mediaType?.startsWith('image/')) {
        return <Image src={m.media} alt="Image" width={200} height={200} className="rounded max-w-full object-cover" />;
      } else if (m.mediaType?.startsWith('video/')) {
        return <video src={m.media} controls className="max-w-full rounded" />;
      } else if (m.mediaType?.startsWith('audio/')) {
        return <audio src={m.media} controls className="w-full max-w-[200px]" />;
      } else {
        return <a href={m.media} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">📎 Attachment</a>;
      }
    }
    return m.text;
  };

  // ----- Edit/Delete -----
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

  const startEditMessage = (message: any) => {
    if (message.senderId !== user?.id) return;
    setEditingMessageId(message.id);
    setEditText(message.text);
  };

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

  // ----- Reset / Delete chat -----
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
              {recipient.photoURL ? (
                <Image src={recipient.photoURL} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
              ) : isGroup ? (
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">G</div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {recipient.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <p className="text-white font-bold">{recipient.displayName}</p>
                <p className="text-gray-300 text-xs">
                  {isAI ? 'AI Assistant' : isGroup ? `${recipient.members?.length || 0} members` : `@${recipient.username}`}
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
                      {renderMessageContent(m)}
                      {m.text && <span className="block mt-1">{m.text}</span>}
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

        {/* Input with attachments and voice */}
        <div className="p-3 bg-black/50 backdrop-blur-sm flex gap-2 items-center">
          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-white hover:text-blue-400"
            title="Attach file"
          >
            <FaPaperclip size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          {/* Voice note button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`text-white hover:text-red-400 ${isRecording ? 'text-red-400 animate-pulse' : ''}`}
            title={isRecording ? 'Stop recording' : 'Record voice note'}
          >
            {isRecording ? <FaStop size={20} /> : <FaMicrophone size={20} />}
          </button>
          <input
            className="flex-1 bg-gray-800/80 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isRecording ? '🔴 Recording...' : 'Type a message...'}
            disabled={isRecording}
          />
          <button onClick={() => sendMessage()} className="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl text-white font-semibold transition">
            <FaPaperPlane />
          </button>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
              <h2 className="text-white text-xl font-bold mb-4">Chat Settings</h2>
              <div className="space-y-3">
                <button
                  onClick={resetChat}
                  className="w-full flex items-center gap-3 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-xl transition"
                >
                  <FaEraser size={18} />
                  <span>Reset Chat</span>
                </button>
                <button
                  onClick={deleteChat}
                  className="w-full flex items-center gap-3 bg-red-700 hover:bg-red-600 text-white p-3 rounded-xl transition"
                >
                  <FaFolderMinus size={18} />
                  <span>Delete Entire Chat</span>
                </button>
                <hr className="border-gray-600" />
                <div className="flex justify-between items-center">
                  <span className="text-white">Voice Output</span>
                  <button
                    onClick={() => {
                      setVoiceEnabled(!voiceEnabled);
                      if (voiceEnabled) speechSynth.current?.cancel();
                    }}
                    className={`px-4 py-1 rounded-full text-sm ${
                      voiceEnabled ? 'bg-blue-600' : 'bg-gray-600'
                    } text-white`}
                  >
                    {voiceEnabled ? 'On' : 'Off'}
                  </button>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl mt-2 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
    }
