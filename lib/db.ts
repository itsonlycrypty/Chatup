const BIN_ID = '6a8e0fb3da38895dfe106f8c';
const API_KEY = '$2a$10$r1kHroezSkMDu0f2HTVOQerg29AfetwH4AAKa6X8TDTIbliIda/OS';

export const fetchData = async () => {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    const data = await res.json();
    // Ensure all expected fields exist, including 'shorts'
    const record = data.record || {};
    return {
      users: record.users || [],
      posts: record.posts || [],
      stories: record.stories || [],
      chats: record.chats || {},
      shorts: record.shorts || [],  // ← added shorts array
    };
  } catch (e) {
    console.error('Fetch error:', e);
    return { users: [], posts: [], stories: [], chats: {}, shorts: [] };
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
