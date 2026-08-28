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
    // ✅ Updated system prompt – tells the AI about its role and creators
    systemPrompt:
      'You are an AI assistant inside the Chat Up app. You were created by Crypty and assisted by Mole. ' +
      'Your purpose is to help users with anything about the app, chat features, or general questions. ' +
      'Never output any internal reasoning, thinking process, or <think> tags. ' +
      'Always answer directly, clearly, and concisely. Be friendly and helpful.',
  },
  // ... other AIs (Batman, Superman, etc.) – their prompts already have the “no thinking” rule.
];

// ... (rest of the file unchanged: generateFunAIs, getAllAIs, getAIById)
