/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    images: {
        remotePatterns: [],
        unoptimized: false,
    },
    // Server-side rendering will be handled by custom server
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:3000'],
        },
    },
};

module.exports = nextConfig;
