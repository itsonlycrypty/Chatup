const BIN_ID = '6a8e0fb3da38895dfe106f8c';
const API_KEY = '$2a$10$r1kHroezSkMDu0f2HTVOQerg29AfetwH4AAKa6X8TDTIbliIda/OS';

// Default sticker pack (free emoji images)
const DEFAULT_STICKERS = [
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f600.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f601.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f602.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f603.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f604.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f605.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f606.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f607.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f608.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f609.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60a.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60b.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60c.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60d.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60e.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60f.png',
];

export const fetchData = async () => {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    const data = await res.json();
    const record = data.record || {};
    return {
      users: record.users || [],
      posts: record.posts || [],
      stories: record.stories || [],
      chats: record.chats || {},
      shorts: record.shorts || [],
      customAIs: record.customAIs || [],
      groups: record.groups || [],
      channels: record.channels || [],
      groupInvites: record.groupInvites || [],
      notifications: record.notifications || [],
      stickers: record.stickers || [],
      stickerPacks: record.stickerPacks || [],
      starredMessages: record.starredMessages || [],
      savedMessages: record.savedMessages || [],
      aiFollowers: record.aiFollowers || {},
    };
  } catch (e) {
    console.error('Fetch error:', e);
    return {
      users: [],
      posts: [],
      stories: [],
      chats: {},
      shorts: [],
      customAIs: [],
      groups: [],
      channels: [],
      groupInvites: [],
      notifications: [],
      stickers: [],
      stickerPacks: [],
      starredMessages: [],
      savedMessages: [],
      aiFollowers: {},
    };
  }
};

export const saveData = async (data: any) => {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error('Save error:', e);
  }
};

// Helper to seed default stickers if none exist
export const seedDefaultStickers = async () => {
  const data = await fetchData();
  if (!data.stickers || data.stickers.length === 0) {
    data.stickers = DEFAULT_STICKERS;
    await saveData(data);
    console.log('Default stickers seeded.');
  }
};
