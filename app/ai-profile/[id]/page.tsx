'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAIById } from '@/lib/aiData';
import { FaArrowLeft } from 'react-icons/fa';

export default function AIProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [ai, setAi] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAI = async () => {
      const data = await getAIById(id as string);
      setAi(data);
      setLoading(false);
    };
    loadAI();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
  }
  if (!ai) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">AI not found</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-white hover:text-gray-300">
          <FaArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">AI Profile</h1>
      </div>

      {/* Avatar and basic info */}
      <div className="flex flex-col items-center">
        {ai.avatar && (
          <Image src={ai.avatar} alt={ai.name} width={120} height={120} className="rounded-full border-4 border-blue-500 object-cover" />
        )}
        <h2 className="text-3xl font-bold mt-4">{ai.name}</h2>
        <p className="text-gray-400">@{ai.username}</p>
        {ai.isOfficial && <span className="mt-1 text-blue-400 text-sm">✓ Verified Official AI</span>}
        {ai.isCustom && <span className="mt-1 text-green-400 text-sm">Custom AI</span>}
      </div>

      {/* Detailed info */}
      <div className="mt-8 space-y-4 bg-gray-900 rounded-2xl p-6">
        <div>
          <h3 className="text-gray-400 text-sm">Description</h3>
          <p className="text-white">{ai.description || 'No description provided.'}</p>
        </div>
        <div>
          <h3 className="text-gray-400 text-sm">Speciality</h3>
          <p className="text-white">{ai.speciality || 'General'}</p>
        </div>
        <div>
          <h3 className="text-gray-400 text-sm">Voice</h3>
          <p className="text-white">{ai.voice?.name || 'Default'}</p>
        </div>
        <div>
          <h3 className="text-gray-400 text-sm">Gender</h3>
          <p className="text-white">{ai.isMale ? 'Male' : 'Female'}</p>
        </div>
        {ai.systemPrompt && (
          <div>
            <h3 className="text-gray-400 text-sm">System Prompt (non‑editable)</h3>
            <p className="text-white text-xs bg-gray-800 p-2 rounded">{ai.systemPrompt}</p>
          </div>
        )}
        {ai.createdBy && (
          <div>
            <h3 className="text-gray-400 text-sm">Created by</h3>
            <p className="text-white">{ai.createdBy}</p>
          </div>
        )}
      </div>

      {/* Back button (extra) */}
      <button
        onClick={() => router.back()}
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
      >
        Back to Chat
      </button>
    </div>
  );
    }
