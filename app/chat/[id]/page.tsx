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
  FaPaperclip, FaStop, FaEllipsisV, FaCopy,
  FaShare, FaStar, FaBookmark, FaShareAlt, FaSmile, FaCheckCircle, FaHeart, FaLaugh, FaSadTear, FaAngry, FaSurprise
} from 'react-icons/fa';
import StickerPicker from '@/components/StickerPicker';

// Default WhatsApp‑style background
const DEFAULT_CHAT_BG = 'https://www.transparenttextures.com/patterns/white-diamond.png';

// Predefined reaction emojis
const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎'];

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
  const [isChannel, setIsChannel] = useState(false);
  const [background, setBackground] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(250);
  const [showMenu, setShowMenu] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showStickers, setShowStickers] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ messageId: string | null, show: boolean }>({ messageId: null, show: false });
  const [showReactionPicker, setShowReactionPicker] = useState<{ messageId: string | null, show: boolean }>({ messageId: null, show: false });
  const bottomRef = useRef<HTMLDivElement>(null);
  const speechSynth = useRef<SpeechSynthesis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const getChatId = (a: string, b: string) => [a, b].sort().join('_');

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

  // ----- Request microphone permission -----
  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (err) {
      alert('Please allow microphone access in your browser settings to send voice notes.');
      return false;
    }
  };

  // ----- Load recipient -----
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
          systemPrompt: ai.systemPrompt || 'Never output any internal reasoning.',
          isCustom: ai.isCustom || false,
        });
        setIsAI(true);
        setIsOfficial(ai.isOfficial || false);
        setBackground(ai.background || '');
        setSystemPrompt(ai.systemPrompt || 'Never output any internal reasoning.');
        return;
      }
      const data = await fetchData();
      const groups = data.groups || [];
      const foundGroup = groups.find((g: any) => g.id === id);
      if (foundGroup) {
        setRecipient({
          id: foundGroup.id,
          displayName: foundGroup.name,
          username: foundGroup.name,
          photoURL: foundGroup.picture || null,
          isGroup: true,
          members: foundGroup.members,
          admins: foundGroup.admins || [],
          settings: foundGroup.settings || {},
          createdBy: foundGroup.createdBy,
        });
        setIsGroup(true);
        setIsAI(false);
        const users = data.users || [];
        const currentUser = users.find((u: any) => u.id === user?.id);
        setBackground(currentUser?.chatBackground || DEFAULT_CHAT_BG);
        return;
      }
      const channels = data.channels || [];
      const foundChannel = channels.find((c: any) => c.id === id);
      if (foundChannel) {
        setRecipient({
          id: foundChannel.id,
          displayName: foundChannel.name,
          username: foundChannel.name,
          photoURL: foundChannel.picture || null,
          isChannel: true,
          members: foundChannel.members || [],
          admins: foundChannel.admins || [],
          owner: foundChannel.owner,
          onlyAdminsCanSend: foundChannel.onlyAdminsCanSend || false,
          reactionEmojis: foundChannel.reactionEmojis || REACTION_EMOJIS,
        });
        setIsChannel(true);
        setIsAI(false);
        const users = data.users || [];
        const currentUser = users.find((u: any) => u.id === user?.id);
        setBackground(currentUser?.chatBackground || DEFAULT_CHAT_BG);
        return;
      }
      const users = data.users || [];
      const found = users.find((u: any) => u.id === id);
      if (found) {
        setRecipient({ ...found, isAI: false, isGroup: false, isChannel: false });
        setIsAI(false);
        setIsGroup(false);
        setIsChannel(false);
        const currentUser = users.find((u: any) => u.id === user?.id);
        setBackground(currentUser?.chatBackground || DEFAULT_CHAT_BG);
      }
    };
    findRecipient();
  }, [id]);

  // ----- Load messages -----
  const loadMessages = async () => {
    if (!user || !id) return;
    let key: string;
    if (isGroup || isChannel) {
      key = id as string;
    } else {
      key = getChatId(user.id, id as string);
    }
    const data = await fetchData();
    const chats = data.chats || {};
    const msgs = chats[key] || [];
    // Filter out messages hidden for this user
    const visibleMsgs = msgs.filter((m: any) => !m.hiddenFor?.includes(user.id));
    setMessages(visibleMsgs);
    if (voiceEnabled && isAI && visibleMsgs.length > 0) {
      const last = visibleMsgs[visibleMsgs.length - 1];
      if (last.senderId === id && last.text) {
        speakText(last.text);
      }
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [id, user, isGroup, isChannel]);

  // ----- AI response -----
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

  // ----- Send message -----
  const sendMessage = async (mediaData?: string, mediaType?: string) => {
    if (!text.trim() && !mediaData) return;
    if (!user || !recipient) return;

    if (isGroup) {
      if (recipient.settings?.preventMediaShare && mediaData) {
        alert('Media sharing is disabled in this group.');
        return;
      }
    }
    if (isChannel) {
      const isAdmin = recipient.admins?.includes(user.id);
      if (recipient.onlyAdminsCanSend && !isAdmin) {
        alert('Only admins can send messages in this channel.');
        return;
      }
    }

    let key: string;
    if (isGroup || isChannel) {
      key = id as string;
    } else {
      key = getChatId(user.id, id as string);
    }

    const data = await fetchData();
    const chats = data.chats || {};
    if (!chats[key]) chats[key] = [];

    const msg: any = {
      id: Date.now().toString(),
      senderId: user.id,
      text: text.trim() || '',
      timestamp: new Date().toISOString(),
      reactions: {}, // { emoji: [userId, ...] }
    };
    if (mediaData) {
      if (mediaType === 'sticker') {
        msg.sticker = mediaData;
      } else {
        msg.media = mediaData;
        msg.mediaType = mediaType || 'file';
      }
    }
    chats[key].push(msg);
    await saveData({ ...data, chats });
    setText('');
    loadMessages();

    // Notifications (same as before)
    // ... (keep existing notification code)

    if (isAI && !mediaData) {
      setTimeout(async () => {
        const aiReply = await getAIResponse(text.trim());
        const aiMsg = {
          id: Date.now().toString(),
          senderId: recipient.id,
          text: aiReply,
          timestamp: new Date().toISOString(),
          reactions: {},
        };
        const updatedData = await fetchData();
        const updatedChats = updatedData.chats || {};
        if (!updatedChats[key]) updatedChats[key] = [];
        updatedChats[key].push(aiMsg);
        await saveData({ ...updatedData, chats: updatedChats });
        loadMessages();
      }, 1000);
    }
  };

  // ----- File attachment -----
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
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;
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

  // ----- Render message content -----
  const renderMessageContent = (m: any) => {
    if (m.sticker) {
      return <Image src={m.sticker} alt="Sticker" width={120} height={120} className="rounded" />;
    }
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

  // ----- Reactions -----
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    let key: string;
    if (isGroup || isChannel) {
      key = id as string;
    } else {
      key = getChatId(user.id, id as string);
    }
    const data = await fetchData();
    const chats = data.chats || {};
    if (!chats[key]) return;
    const msgIndex = chats[key].findIndex((m: any) => m.id === messageId);
    if (msgIndex === -1) return;
    const msg = chats[key][msgIndex];
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const userIndex = msg.reactions[emoji].indexOf(user.id);
    if (userIndex === -1) {
      msg.reactions[emoji].push(user.id);
    } else {
      msg.reactions[emoji].splice(userIndex, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    }
    await saveData({ ...data, chats });
    loadMessages();
    setShowReactionPicker({ messageId: null, show: false });
  };

  // ----- Delete message with modal -----
  const openDeleteModal = (messageId: string) => {
    setShowDeleteModal({ messageId, show: true });
  };

  const handleDelete = async (option: 'forMe' | 'forEveryone') => {
    const { messageId } = showDeleteModal;
    if (!messageId || !user) return;
    let key: string;
    if (isGroup || isChannel) {
      key = id as string;
    } else {
      key = getChatId(user.id, id as string);
    }
    const data = await fetchData();
    const chats = data.chats || {};
    if (!chats[key]) return;
    const msgIndex = chats[key].findIndex((m: any) => m.id === messageId);
    if (msgIndex === -1) return;
    const msg = chats[key][msgIndex];

    if (option === 'forEveryone') {
      // Check if user is admin (for groups/channels) – if not, deny
      const isAdmin = isGroup ? recipient.admins?.includes(user.id) : (isChannel ? recipient.admins?.includes(user.id) : false);
      if (!isAdmin) {
        alert('Only admins can delete for everyone.');
        setShowDeleteModal({ messageId: null, show: false });
        return;
      }
      chats[key].splice(msgIndex, 1);
    } else {
      // Delete for me: hide this message for this user
      if (!msg.hiddenFor) msg.hiddenFor = [];
      if (!msg.hiddenFor.includes(user.id)) {
        msg.hiddenFor.push(user.id);
        chats[key][msgIndex] = msg;
      }
    }
    await saveData({ ...data, chats });
    loadMessages();
    setShowDeleteModal({ messageId: null, show: false });
    setSelectMode(false);
    setSelectedMessages([]);
  };

  // ----- Selection mode actions (copy, star, save, share) -----
  const toggleSelectMessage = (messageId: string) => {
    setSelectedMessages(prev =>
      prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]
    );
  };

  // ----- Clear all messages (admin only) -----
  const clearAllMessages = async () => {
    if (!user) return;
    if (!confirm('Clear all messages? This cannot be undone.')) return;
    const isAdmin = isGroup ? recipient.admins?.includes(user.id) : (isChannel ? recipient.admins?.includes(user.id) : false);
    if (!isAdmin) {
      alert('Only admins can clear all messages.');
      return;
    }
    let key: string;
    if (isGroup || isChannel) {
      key = id as string;
    } else {
      key = getChatId(user.id, id as string);
    }
    const data = await fetchData();
    const chats = data.chats || {};
    if (chats[key]) {
      chats[key] = [];
      await saveData({ ...data, chats });
      loadMessages();
    }
    setShowMenu(false);
  };

  // ----- Copy selected message -----
  const copySelectedMessage = () => {
    if (selectedMessages.length === 0) return alert('Select a message first');
    const msgs = messages.filter(m => selectedMessages.includes(m.id));
    const text = msgs.map(m => m.text).join('\n');
    navigator.clipboard?.writeText(text).then(() => alert('Copied!'));
  };

  // ----- Star selected message -----
  const starSelectedMessage = async () => {
    if (selectedMessages.length === 0) return alert('Select a message first');
    const data = await fetchData();
    const starred = data.starredMessages || [];
    for (const id of selectedMessages) {
      const msg = messages.find(m => m.id === id);
      if (msg && !starred.find((s: any) => s.id === msg.id)) {
        starred.push({ ...msg, userId: user.id, starredAt: new Date().toISOString() });
      }
    }
    await saveData({ ...data, starredMessages: starred });
    alert('Starred!');
    setSelectMode(false);
    setSelectedMessages([]);
  };

  // ----- Save selected message -----
  const saveSelectedMessage = async () => {
    if (selectedMessages.length === 0) return alert('Select a message first');
    const data = await fetchData();
    const saved = data.savedMessages || [];
    for (const id of selectedMessages) {
      const msg = messages.find(m => m.id === id);
      if (msg && !saved.find((s: any) => s.id === msg.id)) {
        saved.push({ ...msg, userId: user.id, savedAt: new Date().toISOString() });
      }
    }
    await saveData({ ...data, savedMessages: saved });
    alert('Saved!');
    setSelectMode(false);
    setSelectedMessages([]);
  };

  // ----- Share selected message -----
  const shareSelectedMessage = () => {
    if (selectedMessages.length === 0) return alert('Select a message first');
    const msgs = messages.filter(m => selectedMessages.includes(m.id));
    const text = msgs.map(m => m.text).join('\n');
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => alert('Copied to clipboard!'));
    }
  };

  // ----- Edit message -----
  const startEditMessage = (message: any) => {
    if (message.senderId !== user?.id) return;
    setEditingMessageId(message.id);
    setEditText(message.text);
  };

  const saveEditMessage = async () => {
    if (!editingMessageId || !editText.trim()) return;
    let key: string;
    if (isGroup || isChannel) {
      key = id as string;
    } else {
      key = getChatId(user.id, id as string);
    }
    const data = await fetchData();
    const chats = data.chats || {};
    if (!chats[key]) return;
    const idx = chats[key].findIndex((m: any) => m.id === editingMessageId);
    if (idx === -1) return;
    chats[key][idx].text = editText.trim();
    chats[key][idx].edited = true;
    await saveData({ ...data, chats });
    setEditingMessageId(null);
    setEditText('');
    loadMessages();
  };

  // ----- Toggle voice -----
  const toggleVoice = () => {
    setVoiceEnabled(prev => {
      if (prev) speechSynth.current?.cancel();
      return !prev;
    });
  };

  // ----- Navigate to profile -----
  const goToProfile = () => {
    if (isAI) {
      router.push(`/ai-profile/${recipient.id}`);
    } else if (isGroup) {
      router.push(`/group-profile/${recipient.id}`);
    } else if (isChannel) {
      router.push(`/channel/${recipient.id}`);
    } else {
      router.push(`/profile/${recipient.id}`);
    }
  };

  if (!recipient) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: background && !isAI ? `url(${background})` : (isAI ? `url(${background})` : 'none') }}
    >
      {!isAI && background && (
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${background})` }} />
      )}
      <div className={`absolute inset-0 ${background && !isAI ? 'bg-black/40' : (isAI ? 'bg-black/60' : 'bg-black/60')}`} />
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-black/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-white hover:text-gray-300">
              <FaArrowLeft size={20} />
            </button>
            <div
              onClick={goToProfile}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80"
            >
              {recipient.photoURL ? (
                <Image src={recipient.photoURL} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
              ) : isGroup ? (
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">G</div>
              ) : isChannel ? (
                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-sm">C</div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {recipient.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <p className="text-white font-bold">{recipient.displayName}</p>
                <p className="text-gray-300 text-xs">
                  {isAI ? 'AI Assistant' : isGroup ? `${recipient.members?.length || 0} members` : isChannel ? 'Channel' : `@${recipient.username}`}
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
            <button onClick={() => setShowMenu(true)} className="text-white hover:text-gray-300">
              <FaEllipsisV size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-2">
          {messages.map((m) => {
            const isOwn = m.senderId === user?.id;
            const isEditing = editingMessageId === m.id;
            const isSelected = selectedMessages.includes(m.id);
            const reactions = m.reactions || {};
            return (
              <div key={m.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {selectMode && (
                  <button
                    onClick={() => toggleSelectMessage(m.id)}
                    className={`w-5 h-5 rounded border ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'} flex items-center justify-center mr-2`}
                  >
                    {isSelected && <FaCheck className="text-white text-xs" />}
                  </button>
                )}
                <div
                  className={`p-3 rounded max-w-[75%] ${
                    isOwn ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
                  }`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setShowReactionPicker({ messageId: m.id, show: true });
                  }}
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
                  {/* Reactions display */}
                  {Object.keys(reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(reactions).map(([emoji, users]) => (
                        <span key={emoji} className="bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          {emoji} {users.length}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {/* Reaction button */}
                  <button
                    onClick={() => setShowReactionPicker({ messageId: m.id, show: true })}
                    className="text-gray-400 hover:text-yellow-400 text-sm"
                    title="React"
                  >
                    <FaSmile size={14} />
                  </button>
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
                        onClick={() => openDeleteModal(m.id)}
                        className="text-gray-400 hover:text-red-400 text-sm"
                        title="Delete message"
                      >
                        <FaTrash size={16} />
                      </button>
                    </>
                  )}
                  {!isOwn && (
                    <button
                      onClick={() => openDeleteModal(m.id)}
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

        {/* Input (sticky at bottom) */}
        <div className="sticky bottom-0 bg-black/70 backdrop-blur-sm p-4 flex gap-2 items-center flex-shrink-0 border-t border-gray-700">
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
          <button
            onClick={() => setShowStickers(true)}
            className="text-white hover:text-yellow-400"
            title="Stickers"
          >
            <FaSmile size={20} />
          </button>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`text-white hover:text-red-400 ${isRecording ? 'text-red-400 animate-pulse' : ''}`}
            title={isRecording ? 'Stop recording' : 'Record voice note'}
          >
            {isRecording ? <FaStop size={20} /> : <FaMicrophone size={20} />}
          </button>
          <input
            className="flex-1 bg-gray-700/80 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isRecording ? '🔴 Recording...' : 'Type a message...'}
            disabled={isRecording}
          />
          <button onClick={() => sendMessage()} className="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl text-white font-semibold transition flex-shrink-0">
            <FaPaperPlane />
          </button>
        </div>

        {/* Sticker Picker */}
        {showStickers && (
          <StickerPicker
            onSelect={(sticker) => {
              sendMessage(sticker, 'sticker');
              setShowStickers(false);
            }}
            onClose={() => setShowStickers(false)}
          />
        )}

        {/* Reaction Picker */}
        {showReactionPicker.show && showReactionPicker.messageId && (
          <div className="absolute bottom-24 left-4 bg-gray-800 rounded-2xl p-2 flex gap-2 shadow-lg z-50">
            {(isChannel ? recipient.reactionEmojis || REACTION_EMOJIS : REACTION_EMOJIS).map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(showReactionPicker.messageId!, emoji)}
                className="text-2xl hover:scale-125 transition"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setShowReactionPicker({ messageId: null, show: false })}
              className="text-gray-400 hover:text-white text-sm"
            >
              <FaTimes size={16} />
            </button>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal.show && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
              <h2 className="text-white text-xl font-bold mb-4">Delete Message</h2>
              <div className="space-y-3">
                {!isAI && !isGroup && !isChannel ? (
                  <>
                    <button
                      onClick={() => handleDelete('forMe')}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition"
                    >
                      Delete for me
                    </button>
                    <button
                      onClick={() => setShowDeleteModal({ messageId: null, show: false })}
                      className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {(isGroup || isChannel) && recipient.admins?.includes(user.id) && (
                      <button
                        onClick={() => handleDelete('forEveryone')}
                        className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-xl transition"
                      >
                        Delete for everyone (admin)
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete('forMe')}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition"
                    >
                      Delete for me
                    </button>
                    <button
                      onClick={() => setShowDeleteModal({ messageId: null, show: false })}
                      className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Three‑Dot Menu */}
        {showMenu && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="flex items-center p-4 bg-gray-900 border-b border-gray-700">
              <button onClick={() => setShowMenu(false)} className="text-white hover:text-gray-300 mr-4">
                <FaTimes size={24} />
              </button>
              <h2 className="text-white text-xl font-bold">Chat Options</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <button onClick={clearAllMessages} className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition">
                <FaEraser /> Clear All Messages (Admin only)
              </button>
              <button onClick={() => setSelectMode(!selectMode)} className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition">
                <FaCheck /> {selectMode ? 'Exit Selection Mode' : 'Select Messages'}
              </button>
              {selectMode && (
                <>
                  <button onClick={copySelectedMessage} className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition">
                    <FaCopy /> Copy Selected
                  </button>
                  <button onClick={starSelectedMessage} className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition">
                    <FaStar /> Star Selected
                  </button>
                  <button onClick={saveSelectedMessage} className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition">
                    <FaBookmark /> Save Selected
                  </button>
                  <button onClick={shareSelectedMessage} className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition">
                    <FaShareAlt /> Share to Other App
                  </button>
                </>
              )}
              <button onClick={() => { setShowMenu(false); router.push('/saved-messages'); }} className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition">
                <FaBookmark /> Saved Messages
              </button>
              <button onClick={() => { setShowMenu(false); router.push('/starred-messages'); }} className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition">
                <FaStar /> Starred Messages
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  }
