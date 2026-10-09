/**
 * Choices for the catalog fields of the Vigor website. Each value is the English term the website
 * uses in its data, filters and translations (`glossary` in the website's shared/i18n/*.json).
 * When you add a value here, add its translations there too, or it shows in English.
 */
const options = (values: string[]) => values.map((value) => ({ label: value, value }))

export const productCategories = options([
  'Rings',
  'Necklaces',
  'Earrings',
  'Bracelets',
  'Loose gemstones',
  'Pearls',
])

export const gemstones = options([
  'Emerald',
  'Diamond',
  'Lab-grown diamond',
  'Sapphire',
  'Ruby',
  'Pearl',
  'Tanzanite',
])

export const metals = options([
  '18K yellow gold',
  '18K white gold',
  '18K rose gold',
  '14K yellow gold',
  '14K white gold',
  'Platinum',
  'Sterling silver',
  '18K yellow gold clasp',
  'Sterling silver clasp',
  'Loose (unset)',
])

export const units = options(['piece', 'pair', 'parcel', 'strand'])

export const badges = options(['New', 'Best seller'])

export const newsCategories = options(['Technology', 'Collections', 'Company', 'Sustainability'])
