import type { Config } from 'payload'

// Calling payload.update() with publishSpecificLocale and no locale prop
const result1 = await payload.update({
  collection: 'posts',
  id: '123',
  data: { _status: 'published' },
  publishSpecificLocale: 'en',
})

// Calling payload.updateGlobal() with publishSpecificLocale and no locale prop
const result2 = await payload.updateGlobal({
  slug: 'settings',
  data: { _status: 'published' },
  publishSpecificLocale: req.locale,
})
