import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'onnxruntime-node', '@huggingface/transformers', '@orama/plugin-data-persistence'],
};

export default nextConfig;
