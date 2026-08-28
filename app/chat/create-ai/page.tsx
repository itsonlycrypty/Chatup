'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchData, saveData } from '@/lib/db';
import { FaArrowLeft } from 'react-icons/fa';

export default function CreateAI() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [avatar, setAvatar] = useState('');
  const [background, setBackground] = useState('');
  const [isMale, setIsMale] = useState(true);

  if (!user) return <div className="p-6 text-white">Please log in to create an AI.</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Name is required');
    const newAI = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      username: name.trim().toLowerCase().replace(/\s/g, '_') + '_ai',
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${isMale ? '264653' : 'e76f51'}&color=fff&size=128`,
      background: background || `https://picsum.photos/seed/${Date.now()}/800/1200`,
      description: description.trim() || 'A custom AI assistant.',
      speciality: speciality.trim() || 'General knowledge',
      voice: { name: isMale ? 'Google US English Male' : 'Google UK English Female', lang: 'en-US' },
      isOfficial: false,
      isMale,
      isCustom: true,
      createdBy: user.id,
      systemPrompt: systemPrompt.trim() || 'You are a helpful assistant.',
    };
    const data = await fetchData();
    const customAIs = data.customAIs || [];
    customAIs.push(newAI);
    await saveData({ ...data, customAIs });
    alert('AI created successfully!');
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <button onClick={() => router.back()} className="text-white hover:text-gray-400 flex items-center gap-2 mb-6">
        <FaArrowLeft /> Back
      </button>
      <h1 className="text-2xl font-bold text-white mb-6">Create Your AI Assistant</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <div>
          <label className="text-gray-300 block mb-1">Name *</label>
          <input
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My AI"
            required
          />
        </div>
        <div>
          <label className="text-gray-300 block mb-1">Description</label>
          <input
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., A creative assistant for writing"
          />
        </div>
        <div>
          <label className="text-gray-300 block mb-1">Speciality</label>
          <input
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={speciality}
            onChange={(e) => setSpeciality(e.target.value)}
            placeholder="e.g., Writing, Coding, Fun"
          />
        </div>
        <div>
          <label className="text-gray-300 block mb-1">System Prompt</label>
          <textarea
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={3}
            placeholder="e.g., You are a witty assistant who loves dad jokes."
          />
        </div>
        <div>
          <label className="text-gray-300 block mb-1">Avatar URL (optional)</label>
          <input
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://example.com/avatar.png"
          />
        </div>
        <div>
          <label className="text-gray-300 block mb-1">Background URL (optional)</label>
          <input
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="https://example.com/background.png"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="text-gray-300">Gender:</label>
          <button
            type="button"
            onClick={() => setIsMale(true)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${isMale ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
          >
            Male
          </button>
          <button
            type="button"
            onClick={() => setIsMale(false)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${!isMale ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-400'}`}
          >
            Female
          </button>
        </div>
        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition">
          Create AI
        </button>
      </form>
    </div>
  );
    }
