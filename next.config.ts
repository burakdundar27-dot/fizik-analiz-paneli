import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Soru fotoğrafları Supabase Storage'dan signed URL ile gelir.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/**" }],
  },
};

export default nextConfig;
