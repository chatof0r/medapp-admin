/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // pdf-parse v1 ne doit pas être bundlé par webpack — on le laisse en require natif
      config.externals.push('pdf-parse')
    }
    return config
  },
}

export default nextConfig
