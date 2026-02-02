/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  transpilePackages: ['@packages/lib'],
  images: {
    dangerouslyAllowSVG: true,
    domains: [],
    formats: ['image/avif', 'image/webp']
  }
};

module.exports = nextConfig;
