/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Prisma is a server-only dependency; keep it external to the RSC/route bundles.
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  experimental: {
    // Server Actions are used across the app for mutations.
  },
};

export default nextConfig;
