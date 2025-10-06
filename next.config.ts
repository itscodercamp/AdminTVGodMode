import type {NextConfig} from 'next';

const appUrl = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : '';

const remotePatterns: NextConfig['images']['remotePatterns'] = [
  {
    protocol: 'https',
    hostname: 'placehold.co',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https'
    ,
    hostname: 'picsum.photos',
    port: '',
    pathname: '/**',
  },
];

if (appUrl) {
  remotePatterns.push({
    protocol: appUrl.startsWith('localhost') ? 'http' : 'https',
    hostname: appUrl,
    port: '',
    pathname: '/**',
  });
}


const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns,
  },
};

export default nextConfig;
