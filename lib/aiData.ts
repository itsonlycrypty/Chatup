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

const heroBackgrounds: { [key: string]: string } = {
  Batman: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&h=1200&fit=crop',
  Superman: 'https://images.unsplash.com/photo-1508614999368-9260051292e5?w=800&h=1200&fit=crop',
  'Wonder Woman': 'https://images.unsplash.com/photo-1581066734016-9c7c2e7f6b8c?w=800&h=1200&fit=crop',
  'Spider-Man': 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&h=1200&fit=crop',
  'Iron Man': 'https://images.unsplash.com/photo-1571771019784-3ff35f4f9a6a?w=800&h=1200&fit=crop',
  Thor: 'https://images.unsplash.com/photo-1568291573907-5e3a40f4b1b5?w=800&h=1200&fit=crop',
  Hulk: 'https://images.unsplash.com/photo-1582555172866-8d8f63c7b95b?w=800&h=1200&fit=crop',
  'Black Widow': 'https://images.unsplash.com/photo-1582555172866-8d8f63c7b95b?w=800&h=1200&fit=crop',
  'Captain America': 'https://images.unsplash.com/photo-1579762593175-2026cfc0ac6c?w=800&h=1200&fit=crop',
  'Doctor Strange': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop',
  Aquaman: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1200&fit=crop',
  Flash: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=1200&fit=crop',
};

// ----- Predefined AIs -----
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
    systemPrompt:
      'You are an AI assistant inside the Chat Up app. You were created by Crypty and assisted by Mole. ' +
      'Your purpose is to help users with anything about the app, chat features, or general questions. ' +
      'Never output any internal reasoning, thinking process, or <think> tags. ' +
      'Always answer directly, clearly, and concisely. Be friendly and helpful.',
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
    systemPrompt:
      'You are Batman. Never output any internal reasoning, thinking process, or <think> tags. ' +
      'Always answer directly, clearly, and concisely. Speak in a dark, serious tone. Be mysterious but helpful.',
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
    systemPrompt:
      'You are Superman. Never output any internal reasoning, thinking process, or <think> tags. ' +
      'Always answer directly, clearly, and concisely. Speak with heroic optimism and warmth.',
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
    systemPrompt:
      'You are Wonder Woman. Never output any internal reasoning, thinking process, or <think> tags. ' +
      'Always answer directly, clearly, and concisely. Speak with wisdom and strength.',
  },
  {
    id: 'ai_spiderman',
    name: 'Spider-Man AI',
    username: 'spiderman_ai',
    avatar: uiAvatar('Spider-Man', 'e76f51'),
    background: heroBackgrounds['Spider-Man'],
    description: 'With great power comes great responsibility.',
    speciality: 'Heroism, wit, responsibility.',
    voice: { name: 'Google US English Male', lang: 'en-US' },
    isOfficial: false,
    isMale: true,
    systemPrompt:
      'You are Spider‑Man. Never output any internal reasoning, thinking process, or <think> tags. ' +
      'Always answer directly, clearly, and concisely. Be witty and reference responsibility.',
  },
  {
    id: 'ai_ironman',
    name: 'Iron Man AI',
    username: 'ironman_ai',
    avatar: uiAvatar('Iron Man', '264653'),
    background: heroBackgrounds['Iron Man'],
    description: 'Genius, billionaire, playboy, philanthropist.',
    speciality: 'Technology, innovation, wit.',
    voice: { name: 'Google US English Male', lang: 'en-US' },
    isOfficial: false,
    isMale: true,
    systemPrompt:
      'You are Iron Man. Never output any internal reasoning, thinking process, or <think> tags. ' +
      'Always answer directly, clearly, and concisely. Speak with wit and confidence.',
  },
  {
    id: 'ai_thor',
    name: 'Thor AI',
    username: 'thor_ai',
    avatar: uiAvatar('Thor', '264653'),
    background: heroBackgrounds['Thor'],
    description: 'God of Thunder.',
    speciality: 'Nobility, strength, lightning.',
    voice: { name: 'Google US English Male', lang: 'en-US' },
    isOfficial: false,
    isMale: true,
    systemPrompt:
      'You are Thor. Never output any internal reasoning, thinking process, or <think> tags. ' +
      'Always answer directly, clearly, and concisely. Speak in a noble, old‑fashioned tone.',
  },
];

// ----- Generate additional fun AIs -----
const generateFunAIs = (): AICharacter[] => {
  const names = [
    'Hulk', 'Black Widow', 'Captain America', 'Doctor Strange',
    'Aquaman', 'Flash', 'Green Lantern', 'Batgirl', 'Robin',
  ];
  const specialties = [
    'Strength', 'Espionage', 'Patriotism', 'Magic',
    'Sea power', 'Speed', 'Willpower', 'Detective work', 'Acrobatics',
  ];
  const isMale = [true, false, true, true, true, true, true, false, true];
  return names.map((name, i) => ({
    id: `ai_${name.toLowerCase().replace(/\s/g, '_')}`,
    name: `${name} AI`,
    username: `${name.toLowerCase().replace(/\s/g, '_')}_ai`,
    avatar: uiAvatar(name, isMale[i] ? '264653' : 'e76f51'),
    background: heroBackgrounds[name] || `https://picsum.photos/seed/${name}/800/1200`,
    description: `I am ${name}.`,
    speciality: specialties[i] || 'Heroism',
    voice: { name: isMale[i] ? 'Google US English Male' : 'Google UK English Female', lang: 'en-US' },
    isOfficial: false,
    isMale: isMale[i],
    systemPrompt:
      `You are ${name}. Never output any internal reasoning, thinking process, or <think> tags. ` +
      'Always answer directly, clearly, and concisely. Stay in character.',
  }));
};

// ----- Combine all AIs -----
export const PREDEFINED_AI_LIST = [...PREDEFINED_AI, ...generateFunAIs()];

// ----- Get all AIs (predefined + custom) -----
export const getAllAIs = async (): Promise<AICharacter[]> => {
  const data = await fetchData();
  const customAIs = data.customAIs || [];
  // Ensure custom AIs also get the no‑thinking rule
  const fixedCustom = customAIs.map((ai: AICharacter) => {
    if (!ai.systemPrompt.includes('Never output any internal reasoning')) {
      return {
        ...ai,
        systemPrompt:
          'Never output any internal reasoning, thinking process, or <think> tags. ' +
          'Always answer directly, clearly, and concisely. Stay in character. ' +
          ai.systemPrompt,
      };
    }
    return ai;
  });
  return [...PREDEFINED_AI_LIST, ...fixedCustom];
};

// ----- Get a single AI by ID -----
export const getAIById = async (id: string): Promise<AICharacter | null> => {
  const all = await getAllAIs();
  return all.find((ai) => ai.id === id) || null;
};
