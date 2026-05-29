/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const proxyTarget = process.env.API_PROXY_URL
  ? `http://${process.env.API_PROXY_URL}`
  : "http://localhost:8000";

nextConfig.rewrites = async () => [
  {
    source: "/api/:path*",
    destination: `${proxyTarget}/api/:path*`,
  },
];

module.exports = nextConfig;
