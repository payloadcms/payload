// cannot use ts here, for nodejs sitemap and redirects module
// this means we have to send through the 'currentCategory' which is a url param not accessible within node

module.exports.formatPermalink = (reference, currentCategory) => {
  let permalink = ''

  const { relationTo, value } = reference

  if (typeof value === 'object' && value !== null) {
    const { slug } = value

    if (relationTo === 'pages') {
      permalink = slug
    }
  }

  return permalink
}
