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
  FaFont, FaPaperclip, FaFile, FaStop, FaUserPlus, FaEllipsisV, FaCopy,
  FaShare, FaStar, FaBookmark, FaShareAlt, FaSmile, FaCheckCircle
} from 'react-icons/fa';
import StickerPicker from '@/components/StickerPicker';

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const speechSynth = useRef<SpeechSynthesis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // ----- Helper -----
  const getChatId = (a: string, b: string) => [a, b].sort().join('_');

  // ----- Text‑to‑speech (defined BEFORE loadMessages) -----
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
        setBackground('');
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
        });
        setIsChannel(true);
        setIsAI(false);
        setBackground('');
        return;
      }
      const users = data.users || [];
      const found = users.find((u: any) => u.id === id);
      if (found) {
        setRecipient({ ...found, isAI: false, isGroup: false, isChannel: false });
        setIsAI(false);
        setIsGroup(false);
        setIsChannel(false);
        setBackground('');
      }
    };
    findRecipient();
  }, [id]);

  // ----- Load messages (speakText is now defined above) -----
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

    // Permission checks
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

    // Notifications (simplified)
    if (isGroup || isChannel) {
      const members = recipient.members || [];
      const notifText = `${user.displayName} sent a message in ${recipient.displayName}`;
      for (const memberId of members) {
        if (memberId !== user.id) {
          const notif = {
            id: `notif_${Date.now()}_${Math.random()}`,
            userId: memberId,
            text: notifText,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'group_message',
            chatId: id,
          };
          const notifData = await fetchData();
          const notifications = notifData.notifications || [];
          notifications.push(notif);
          await saveData({ ...notifData, notifications });
        }
      }
    } else if (!isAI) {
      const otherUserId = recipient.id;
      if (otherUserId !== user.id) {
        const notif = {
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: otherUserId,
          text: `${user.displayName} sent you a message.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'private_message',
          chatId: id,
        };
        const notifData = await fetchData();
        const notifications = notifData.notifications || [];
        notifications.push(notif);
        await saveData({ ...notifData, notifications });
      }
    }

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

  // ----- Voice recording with permission check -----
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

  // ----- Delete message (shortened for brevity) -----
  const deleteMessage = async (messageId: string, permanent: boolean = false) => {
    // ... same as before (we keep the full implementation in the actual file)
  };

  // ----- Selection, copy, forward, star, save, share (same as before) -----

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

  // ----- Toggle voice -----
  const toggleVoice = () => {
    setVoiceEnabled(prev => {
      if (prev) speechSynth.current?.cancel();
      return !prev;
    });
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isOwn = m.senderId === user?.id;
            const isEditing = editingMessageId === m.id;
            const isSelected = selectedMessages.includes(m.id);
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
                        onClick={() => deleteMessage(m.id, false)}
                        className="text-gray-400 hover:text-red-400 text-sm"
                        title="Delete message (for me)"
                      >
                        <FaTrash size={16} />
                      </button>
                    </>
                  )}
                  {!isOwn && (
                    <button
                      onClick={() => deleteMessage(m.id, false)}
                      className="text-gray-400 hover:text-red-400 text-sm"
                      title="Delete message (for me)"
                    >
                      <FaTrash size={16} />
                    </button>
                  )}
                  {isGroup && recipient.admins?.includes(user.id) && (
                    <button
                      onClick={() => deleteMessage(m.id, true)}
                      className="text-red-500 hover:text-red-400 text-sm"
                      title="Permanently delete for everyone (admin)"
                    >
                      <FaTrash size={16} className="text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input (sticky at bottom) */}
        <div className="sticky bottom-0 bg-black/50 backdrop-blur-sm p-3 flex gap-2 items-center">
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

        {/* Full‑screen Three‑Dot Menu */}
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
                  <button onClick={forwardSelectedMessage} className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition">
                    <FaShare /> Forward Selected
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
