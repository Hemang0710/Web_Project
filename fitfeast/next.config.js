/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['spoonacular.com', 'edamam-product-images.s3.amazonaws.com'],
  },
  // Add any other Next.js config options here
};

export default nextConfig;
