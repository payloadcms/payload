module.exports.formatSlug = (reference) => {
  let slug = '';

  const {
    relationTo,
    value,
  } = reference;

  if (typeof value === 'object' && value !== null) {
    const {
      slug: referenceSlug,
      breadcrumbs,
    } = value;

    // pages could be nested, so use breadcrumbs
    if (relationTo === 'pages') {
      if (breadcrumbs) {
        const { url: lastCrumbURL = '' } = breadcrumbs?.[breadcrumbs.length - 1] || {}; // last crumb
        slug = lastCrumbURL;
      } else {
        slug = referenceSlug;
      }
    }

    if (relationTo !== 'pages') {
      slug = `/${relationTo}/${referenceSlug}`;


      if (relationTo === 'media') {
        slug = value.url;
      }
    }
  }

  return slug;
}
