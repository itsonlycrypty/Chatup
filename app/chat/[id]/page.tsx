'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchData, saveData } from '@/lib/db';
import { getAIById } from '@/lib/aiData';
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane, FaArrowLeft, FaTrash } from 'react-icons/fa';

export default function ChatRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [isAI, setIsAI] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);
  const [background, setBackground] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const speechSynth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynth.current = window.speechSynthesis;
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
          systemPrompt: ai.systemPrompt || 'You are a helpful assistant.',
          isCustom: ai.isCustom || false,
        });
        setIsAI(true);
        setIsOfficial(ai.isOfficial || false);
        setBackground(ai.background || '');
        setSystemPrompt(ai.systemPrompt || 'You are a helpful assistant.');
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

  // ----- AI response via our API route (which uses Grok) -----
  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: systemPrompt,
          userMessage: userMessage,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'API error');
      }
      const data = await res.json();
      return data.reply || 'Sorry, I could not generate a response.';
    } catch (e) {
      console.error('AI fetch error:', e);
      // Fallback to rule‑based
      return getFallbackResponse(userMessage);
    }
  };

  // Fallback rule‑based response (in case the API fails)
  const getFallbackResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase().trim();
    const name = recipient?.displayName || 'AI';
    if (lower.includes('hello') || lower.includes('hi')) return `Hello! I'm ${name}. How can I help?`;
    if (lower.includes('how are you')) return `I'm an AI, but I'm functioning perfectly!`;
    if (lower.includes('who are you')) return `I'm ${name}, an AI assistant.`;
    if (lower.includes('help')) return `Sure! I'm here to help.`;
    if (lower.includes('bye')) return 'Goodbye! Take care.';
    return `That's interesting. Could you tell me more? (I'm ${name})`;
  };

  // ----- Delete any message -----
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

  // ----- Text-to-speech -----
  const speakText = (text: string) => {
    if (!speechSynth.current || !voiceEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (recipient?.voice) {
      utterance.voice = speechSynth.current.getVoices().find(v => v.name === recipient.voice.name) || null;
      utterance.lang = recipient.voice.lang || 'en-US';
    }
    utterance.rate = 1;
    utterance.pitch = recipient?.isMale ? 0.9 : 1.1;
    speechSynth.current.speak(utterance);
  };

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
        <div className="flex items-center gap-3 p-3 bg-black/50 backdrop-blur-sm">
          <button onClick={() => window.history.back()} className="text-white hover:text-gray-300">
            <FaArrowLeft size={20} />
          </button>
          {recipient.photoURL && (
            <Image src={recipient.photoURL} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
          )}
          <div className="flex-1">
            <p className="text-white font-bold">{recipient.displayName}</p>
            <p className="text-gray-300 text-xs">
              {isAI ? 'AI Assistant' : `@${recipient.username}`}
              {isOfficial && <span className="ml-1 text-blue-400">✓ Verified</span>}
              {recipient.isCustom && <span className="ml-1 text-green-400">Custom</span>}
            </p>
          </div>
          {isAI && (
            <button onClick={toggleVoice} className="text-white hover:text-blue-400">
              {voiceEnabled ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${
                m.senderId === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.senderId !== user?.id && recipient.photoURL && (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <Image src={recipient.photoURL} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" />
                </div>
              )}
              <div
                className={`p-2 rounded max-w-[70%] ${
                  m.senderId === user?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {m.text}
              </div>
              <button
                onClick={() => deleteMessage(m.id)}
                className="text-gray-400 hover:text-red-400 text-xs self-center"
                title="Delete message"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

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
      </div>
    </div>
  );
    }
