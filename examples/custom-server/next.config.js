require('dotenv').config()

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_PAYLOAD_URL],
  },
}
