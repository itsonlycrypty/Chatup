<div className="px-2 mt-2">
  <div className="border-t border-gray-800 pt-4">
    <div className="flex justify-between items-center px-2 mb-3">
      <h3 className="text-white font-semibold">Your Posts</h3>
      <button onClick={() => router.push('/upload')} className="text-blue-400 text-sm">
        <FaPlus className="inline mr-1" /> New
      </button>
    </div>
    {userPosts.length === 0 ? (
      <p className="text-gray-400 text-center py-8">No posts yet. Tap + to upload!</p>
    ) : (
      <div className="grid grid-cols-3 gap-1">
        {userPosts.map((post) => (
          <div
            key={post.id}
            className="relative aspect-square bg-gray-800 rounded overflow-hidden group cursor-pointer"
            onClick={() => router.push(`/post/${post.id}`)}
          >
            {post.media?.startsWith('data:image') ? (
              <Image src={post.media} alt="Post" fill className="object-cover group-hover:scale-105 transition" />
            ) : post.media?.startsWith('data:video') ? (
              <video src={post.media} className="w-full h-full object-cover group-hover:scale-105 transition" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400 text-xs">
                🌐 Link
              </div>
            )}
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
              <FaHeart className="text-red-400" size={10} /> {post.likes || 0}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
