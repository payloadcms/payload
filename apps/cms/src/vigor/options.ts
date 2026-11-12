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
  // Semi-precious stone products, as on the old website (scripts/import-legacy-catalog.ts)
  'Beads',
  'Cabochons',
  'Pendants',
  'Carvings',
  'Globes',
  'Accessories',
])

/**
 * Semi-precious stones of the old website's catalog. scripts/import-legacy-catalog.ts maps the old
 * stone codes (AMY, PMK…) to these names.
 */
export const semiPreciousStones = [
  'Amazonite',
  'Amethyst',
  'Artistic jasper',
  'Bamboo coral (dyed)',
  'Black agate',
  'Black and white onyx',
  'Black line jasper',
  'Black obsidian',
  'Black onyx',
  'Black stone',
  'Blue agate',
  'Blue goldstone',
  'Blue lace agate',
  'Botswana agate',
  'Brecciated jasper',
  'Butter jasper',
  'Carnelian',
  "Cat's eye (synthetic)",
  'Citrine',
  'Crackle quartz',
  'Crystal quartz',
  'Dalmatian jasper',
  'Dumortierite',
  'Dyed howlite',
  'Fancy agate',
  'Flower jasper',
  'Fluorite',
  'Garnet',
  'Goldstone',
  'Green agate',
  'Green aventurine',
  'Green lace stone',
  'Hematite',
  'Hydrothermal citrine',
  'Imitation tourmaline',
  'Jadeite (B+C treated)',
  'Korea jade',
  'Labradorite',
  'Lapis lazuli',
  'Lavender agate',
  'Lavender amethyst',
  'Lemon new jade',
  'Lemon quartz',
  'Leopard skin jasper',
  'Lepidolite',
  'Malachite',
  'Mixed stones',
  'Moss agate',
  'Mookaite jasper',
  'Mother of pearl',
  'New jade',
  'Ocean jasper',
  'Olive quartz',
  'Peach aventurine',
  'Peach stone',
  'Picasso jasper',
  'Picture jasper',
  'Pink agate',
  'Purple agate (dyed)',
  'Qinghai jade',
  'Rainbow fluorite',
  'Red agate',
  'Red aventurine',
  'Red jasper',
  'Red picture jasper',
  'Rhodonite',
  'Rose quartz',
  'Rutilated quartz',
  'Smoky quartz',
  'Snowflake obsidian',
  'Sodalite',
  'South China jade',
  'Three-color tiger eye',
  'Tiger eye',
  'Tourmaline',
  'Turquoise',
  'Unakite',
  'White and dyed howlite',
  'White howlite',
  'White onyx',
  'White quartz',
  'Yellow calcite',
  'Yellow turquoise jasper',
  'Zebra jasper',
]

export const gemstones = options([
  'Emerald',
  'Diamond',
  'Lab-grown diamond',
  'Sapphire',
  'Ruby',
  'Pearl',
  'Tanzanite',
  ...semiPreciousStones,
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
  // Stone only, e.g. beads on an elastic cord
  'No metal',
])

export const units = options(['piece', 'pair', 'parcel', 'strand'])

export const badges = options(['New', 'Best seller'])

export const newsCategories = options(['Technology', 'Collections', 'Company', 'Sustainability'])

/** Icons of the highlights and features on the VgemsAI app page; the website draws each one */
export const appIcons = [
  { label: 'Vigor AI (sparkles)', value: 'assistant' },
  { label: 'Events (calendar)', value: 'events' },
  { label: 'Map pin', value: 'map' },
  { label: 'Products (gem)', value: 'products' },
  { label: 'Research (chart)', value: 'research' },
  { label: 'Widgets (tiles)', value: 'widgets' },
  { label: 'Security (shield)', value: 'security' },
  { label: 'Account (person)', value: 'account' },
  { label: 'Languages (globe)', value: 'languages' },
]
