require('dotenv').config()

const imageDomains = ['localhost']
if (process.env.PAYLOAD_PUBLIC_SERVER_URL) {
  const { hostname } = new URL(process.env.PAYLOAD_PUBLIC_SERVER_URL)
  imageDomains.push(hostname)
}

// eslint-disable-next-line no-console
console.log('allowed image domains:', imageDomains.join(', '))

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: imageDomains,
  },
}
