/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

if (!process.env.NEXT_PUBLIC_API_URL) {
  nextConfig.rewrites = async () => [
    {
      source: "/api/:path*",
      destination: "http://localhost:8000/api/:path*",
    },
  ];
}

module.exports = nextConfig;
