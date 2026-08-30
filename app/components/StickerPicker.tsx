'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchData, saveData } from '@/lib/db';
import { FaPlus, FaTimes } from 'react-icons/fa';

export default function StickerPicker({ onSelect, onClose }: { onSelect: (sticker: string) => void, onClose: () => void }) {
  const [stickers, setStickers] = useState<string[]>([]);
  const [customStickers, setCustomStickers] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await fetchData();
      const stickerPack = data.stickers || [];
      setStickers(stickerPack);
    };
    load();
  }, []);

  const addCustomSticker = async () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const data = await fetchData();
      const custom = data.stickers || [];
      custom.push(dataUrl);
      await saveData({ ...data, stickers: custom });
      setStickers(custom);
      setFile(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl p-4 max-w-md w-full max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-bold">Stickers</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FaTimes /></button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {stickers.map((s, i) => (
            <div key={i} onClick={() => onSelect(s)} className="cursor-pointer hover:scale-105 transition">
              <Image src={s} alt="Sticker" width={80} height={80} className="rounded object-cover" />
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-gray-700 pt-4">
          <p className="text-gray-400 text-sm mb-2">Add custom sticker</p>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-white bg-gray-700 rounded p-1 text-sm"
            />
            <button onClick={addCustomSticker} className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm">
              <FaPlus className="inline mr-1" /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
            }
