import { createRequire } from "module"
import path from "path"
import { fileURLToPath } from "url"

const require = createRequire(import.meta.url)
const { loadEnvConfig } = require("@next/env")

// Always resolve to this project folder, not a parent directory.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)))

// Ensure .env.local is loaded from the project root before Next reads config.
loadEnvConfig(projectRoot)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
}

export default nextConfig
