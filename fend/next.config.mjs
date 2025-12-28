/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Standalone Build (Best for Docker/K8s)
  // This automatically copies only the necessary files for a production server,
  // reducing your image size from ~1GB to ~150MB.
  output: "standalone",

  // 2. Image Optimization for MinIO
  // This allows the <Image /> component to safely load farmer/product photos
  // from your 'of.kaayaka.in/storage' path.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "of.kaayaka.in",
        port: "",
        pathname: "/storage/**",
      },
    ],
  },

  // 3. Routing consistency
  // Helps Nginx and Next.js agree on whether a URL ends in a / or not.
  trailingSlash: false,

  // 4. Power-user: Experimental features (Optional)
  // Ensures that your server-side environment variables are handled correctly.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
