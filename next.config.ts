/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["i.ibb.co"],
  },
  turbopack: {}, // enable turbopack cleanly
};

module.exports = nextConfig;
