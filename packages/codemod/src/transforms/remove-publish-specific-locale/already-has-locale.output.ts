// When locale is already present, publishSpecificLocale is just removed
const result = await payload.update({
  collection: 'posts',
  id: '123',
  data: { _status: 'published' },
  locale: 'en'
})
