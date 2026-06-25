import path from "path"
import { fileURLToPath } from "url"

// Always resolve to this project folder, not a parent like steven.com/ or ~/
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
}

export default nextConfig
