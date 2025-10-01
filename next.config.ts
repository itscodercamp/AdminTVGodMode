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
    protocol: 'https',
    hostname: 'picsum.photos',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname:
      '9000-firebase-studio-1757611792048.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev',
    port: '',
    pathname: '/**',
  },
];

if (appUrl) {
  remotePatterns.push({
    protocol: 'http',
    hostname: appUrl,
  });
  remotePatterns.push({
    protocol: 'https',
    hostname: appUrl,
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
