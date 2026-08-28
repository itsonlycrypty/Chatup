/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'res.cloudinary.com',
      'ui-avatars.com',
      'i.ibb.co',
      'images.unsplash.com',
      'picsum.photos',
    ],
  },
};

module.exports = nextConfig;
