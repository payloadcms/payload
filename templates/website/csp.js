const policies = {
  'child-src': ["'self'"],
  'connect-src': ["'self'", 'https://maps.googleapis.com'],
  'default-src': ["'self'"],
  'font-src': ["'self'"],
  'frame-src': ["'self'"],
  'img-src': ["'self'", 'https://raw.githubusercontent.com'],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://maps.googleapis.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
}

module.exports = Object.entries(policies)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key} ${value.join(' ')}`
    }
    return ''
  })
  .join('; ')
