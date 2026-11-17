const apiBaseUrl = (process.env.API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

/** @type {import("next").NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
