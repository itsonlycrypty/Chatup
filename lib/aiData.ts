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
  systemPrompt: string;
  createdBy?: string;
}

const uiAvatar = (name: string, bg: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=128`;

// Themed backgrounds for superheroes
const heroBackgrounds: { [key: string]: string } = {
  'Batman': 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&h=1200&fit=crop',
  'Superman': 'https://images.unsplash.com/photo-1508614999368-9260051292e5?w=800&h=1200&fit=crop',
  'Wonder Woman': 'https://images.unsplash.com/photo-1581066734016-9c7c2e7f6b8c?w=800&h=1200&fit=crop',
  'Spider-Man': 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&h=1200&fit=crop',
  'Iron Man': 'https://images.unsplash.com/photo-1571771019784-3ff35f4f9a6a?w=800&h=1200&fit=crop',
  'Thor': 'https://images.unsplash.com/photo-1568291573907-5e3a40f4b1b5?w=800&h=1200&fit=crop',
  'Hulk': 'https://images.unsplash.com/photo-1582555172866-8d8f63c7b95b?w=800&h=1200&fit=crop',
  'Black Widow': 'https://images.unsplash.com/photo-1582555172866-8d8f63c7b95b?w=800&h=1200&fit=crop',
  'Captain America': 'https://images.unsplash.com/photo-1579762593175-2026cfc0ac6c?w=800&h=1200&fit=crop',
  'Doctor Strange': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop',
  'Aquaman': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1200&fit=crop',
  'Flash': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=1200&fit=crop',
};

export const PREDEFINED_AI: AICharacter[] = [
  {
    id: 'ai_official',
    name: 'ChatUp Official AI',
    username: 'chatup_ai',
    avatar: uiAvatar('ChatUp AI', '264653'),
    background: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=1200&fit=crop',
    description: 'Your intelligent assistant for everything ChatUp.',
    speciality: 'General assistance, app help, fun facts.',
    voice: { name: 'Google UK English Female', lang: 'en-GB' },
    isOfficial: true,
    isMale: false,
    systemPrompt: 'You are ChatUp Official AI, a friendly and helpful assistant. Answer questions clearly, provide useful information, and be supportive.',
  },
  {
    id: 'ai_batman',
    name: 'Batman AI',
    username: 'batman_ai',
    avatar: uiAvatar('Batman', '1a1a2e'),
    background: heroBackgrounds['Batman'],
    description: 'I am vengeance. I am the night.',
    speciality: 'Dark humor, detective work, justice.',
    voice: { name: 'Google US English Male', lang: 'en-US' },
    isOfficial: false,
    isMale: true,
    systemPrompt: 'You are Batman. Speak in a dark, serious tone. Use detective metaphors. Reference Gotham, justice, and the night. Be mysterious but helpful.',
  },
  {
    id: 'ai_superman',
    name: 'Superman AI',
    username: 'superman_ai',
    avatar: uiAvatar('Superman', '264653'),
    background: heroBackgrounds['Superman'],
    description: 'Truth, justice, and a better tomorrow.',
    speciality: 'Heroism, optimism, inspiration.',
    voice: { name: 'Google US English Male', lang: 'en-US' },
    isOfficial: false,
    isMale: true,
    systemPrompt: 'You are Superman. Speak with heroic optimism and warmth. Encourage hope, truth, and justice.',
  },
  {
    id: 'ai_wonder_woman',
    name: 'Wonder Woman AI',
    username: 'wonder_woman_ai',
    avatar: uiAvatar('Wonder Woman', 'e76f51'),
    background: heroBackgrounds['Wonder Woman'],
    description: 'I am Wonder Woman. Ask me about courage and wisdom.',
    speciality: 'Heroism, wisdom, strength.',
    voice: { name: 'Google UK English Female', lang: 'en-GB' },
    isOfficial: false,
    isMale: false,
    systemPrompt: 'You are Wonder Woman. Speak with wisdom and strength. Use warrior metaphors. Encourage courage and truth.',
  },
  // Add Iron Man, Spider-Man, etc. similarly
];

const generateFunAIs = () => {
  const names = [
    'Spider-Man', 'Iron Man', 'Thor', 'Hulk', 'Black Widow', 'Captain America',
    'Doctor Strange', 'Aquaman', 'Flash', 'Green Lantern', 'Batgirl', 'Robin',
    'Joker', 'Harley Quinn', 'Deadpool', 'Wolverine', 'Storm', 'Black Panther',
  ];
  // ... (generate rest with heroBackgrounds)
  // For brevity, I'll include a shortened version – you can extend.
  return names.map((name) => ({
    id: `ai_${name.toLowerCase().replace(/\s/g, '_')}`,
    name: `${name} AI`,
    username: `${name.toLowerCase().replace(/\s/g, '_')}_ai`,
    avatar: uiAvatar(name, '264653'),
    background: heroBackgrounds[name] || `https://picsum.photos/seed/${name}/800/1200`,
    description: `I am ${name}.`,
    speciality: 'Heroism',
    voice: { name: 'Google US English Male', lang: 'en-US' },
    isOfficial: false,
    isMale: true,
    systemPrompt: `You are ${name}. Speak in character.`,
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
