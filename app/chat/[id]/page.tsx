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

  // ... (existing useEffect for loading recipient, messages, etc.) ...

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
      // AI response logic (only for text messages)
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

  // ... (rest of the component remains the same, but we add attachment/voice UI in the input area)

  return (
    // ... existing JSX, but replace the input section with:
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
  );
}
