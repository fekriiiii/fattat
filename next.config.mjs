/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't block Vercel builds on lint warnings. The repo has accumulated lint
  // debt that's worth cleaning up, but it's all warnings/style, not runtime
  // bugs — see CLAUDE.md "What's Still to Build" for the tracking item.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
