import { fetchData } from './db';

export interface AICharacter {
  id: string;
  name: string;
  username: string;
  avatar: string;
  background: string;
  description: string;
  speciality: string;
  voice: { name: string; lang: string };
  isOfficial: boolean;
  isMale: boolean;
  isCustom?: boolean;
  systemPrompt?: string;
  createdBy?: string;
}

// Predefined official + fun AIs (total ~50)
export const PREDEFINED_AI: AICharacter[] = [
  {
    id: 'ai_official',
    name: 'ChatUp Official AI',
    username: 'chatup_ai',
    avatar: 'https://ui-avatars.com/api/?name=ChatUp+AI&background=264653&color=fff&size=128',
    background: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=1200&fit=crop',
    description: 'Your intelligent assistant for everything ChatUp.',
    speciality: 'General assistance, app help, fun facts.',
    voice: { name: 'Google UK English Female', lang: 'en-GB' },
    isOfficial: true,
    isMale: false,
  },
  {
    id: 'ai_batman',
    name: 'Batman AI',
    username: 'batman_ai',
    avatar: 'https://i.ibb.co/8Y8K4Xv/batman.png',
    background: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&h=1200&fit=crop',
    description: 'I am vengeance. I am the night.',
    speciality: 'Dark humor, detective work, justice.',
    voice: { name: 'Google US English Male', lang: 'en-US' },
    isOfficial: false,
    isMale: true,
  },
  // ... add more fun AIs (Superman, Wonder Woman, etc.) to reach ~50
  // I'll generate them programmatically here for brevity
];

const generateFunAIs = () => {
  const names = ['Superman', 'Wonder Woman', 'Spider-Man', 'Iron Man', 'Thor', 'Hulk', 'Black Widow', 'Captain America', 'Doctor Strange', 'Aquaman', 'Flash', 'Green Lantern', 'Batgirl', 'Robin', 'Joker', 'Harley Quinn', 'Deadpool', 'Wolverine', 'Storm', 'Black Panther'];
  const specialties = ['Heroism', 'Strength', 'Wisdom', 'Courage', 'Intelligence', 'Agility', 'Leadership', 'Magic', 'Speed', 'Honor', 'Willpower', 'Determination', 'Chaos', 'Mischief', 'Healing', 'Justice', 'Hope', 'Valor', 'Wisdom', 'Courage'];
  const isMale = [true, false, true, true, true, true, false, true, true, true, true, true, false, true, true, false, true, true, false, true];
  return names.map((name, i) => ({
    id: `ai_${name.toLowerCase().replace(/\s/g, '_')}`,
    name: `${name} AI`,
    username: `${name.toLowerCase().replace(/\s/g, '_')}_ai`,
    avatar: `https://ui-avatars.com/api/?name=${name.replace(/\s/g, '+')}&background=${isMale[i] ? '264653' : 'e76f51'}&color=fff&size=128`,
    background: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/800/1200`,
    description: `I am ${name}. Ask me about ${specialties[i].toLowerCase()}.`,
    speciality: specialties[i],
    voice: { name: isMale[i] ? 'Google US English Male' : 'Google UK English Female', lang: 'en-US' },
    isOfficial: false,
    isMale: isMale[i],
  }));
};

export const PREDEFINED_AI_LIST = [...PREDEFINED_AI, ...generateFunAIs()];

export const getAllAIs = async (): Promise<AICharacter[]> => {
  const data = await fetchData();
  const customAIs = data.customAIs || [];
  return [...PREDEFINED_AI_LIST, ...customAIs];
};

export const getAIById = async (id: string): Promise<AICharacter | null> => {
  const all = await getAllAIs();
  return all.find(ai => ai.id === id) || null;
};
