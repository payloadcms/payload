import type { Payload } from 'payload'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Article, Author, Category, Event, Media, Product } from './payload-types.js'

import { devUser } from '../credentials.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const richText = ({ text }: { text: string }): Article['body'] => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

const slug = ({ value }: { value: string }): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const seedCommunity = async (payload: Payload): Promise<void> => {
  await payload.create({
    collection: 'users',
    data: { email: devUser.email, password: devUser.password, role: 'admin' },
  })

  await payload.create({
    collection: 'users',
    data: { email: 'editor@example.com', password: devUser.password, role: 'editor' },
  })

  await payload.create({
    collection: 'users',
    data: { email: 'viewer@example.com', password: devUser.password, role: 'viewer' },
  })

  const categoryNames = ['Hiking', 'Camping', 'Climbing', 'Conservation', 'Field Notes']
  const categories: Category[] = []

  for (const [index, name] of categoryNames.entries()) {
    categories.push(
      await payload.create({
        collection: 'categories',
        data: {
          name,
          slug: slug({ value: name }),
          color: ['#517665', '#c29155', '#718db2', '#6b8e65', '#a47880'][index]!,
          description: `Stories, gear, and guides about ${name.toLowerCase()}.`,
          ...(index === 4 ? { parent: categories[0]!.id } : {}),
        },
      }),
    )
  }

  const authorSeeds = [
    { name: 'Maya Chen', bio: 'Trail writer and weekend backpacker.', specialty: 'hiking' },
    { name: 'Leo Martinez', bio: 'Climber and route photographer.', specialty: 'climbing' },
    { name: 'Avery Brooks', bio: 'Camp cook and gear tester.', specialty: 'camping' },
    { name: 'Sam Rivera', bio: 'Community organizer and naturalist.', specialty: 'conservation' },
  ] as const
  const authors: Author[] = []

  for (const author of authorSeeds) {
    authors.push(
      await payload.create({
        collection: 'authors',
        data: {
          ...author,
          slug: slug({ value: author.name }),
          socialLinks: [{ label: 'Website', url: 'https://example.com' }],
        },
      }),
    )
  }

  const imageSeeds = [
    { alt: 'Mountain landscape', credit: 'Demo library', file: '../uploads/image.jpg' },
    {
      alt: 'Colorful trail markers',
      credit: 'Demo library',
      file: '../uploads/horizontal-squares.jpg',
    },
    { alt: 'Outdoor camp scene', credit: 'Demo library', file: '../live-preview/seed/image-1.jpg' },
  ]
  const media: Media[] = []

  for (const image of imageSeeds) {
    const filePath = path.resolve(dirname, image.file)
    const data = await readFile(filePath)

    media.push(
      await payload.create({
        collection: 'media',
        data: { alt: image.alt, caption: image.alt, credit: image.credit },
        file: { name: path.basename(filePath), data, mimetype: 'image/jpeg', size: data.length },
      }),
    )
  }

  for (const [index, author] of authors.entries()) {
    await payload.update({
      id: author.id,
      collection: 'authors',
      data: { portrait: media[index % media.length]!.id },
    })
  }

  const productSeeds = [
    ['Ridgeline Daypack', 89, 24],
    ['Trailhead Water Bottle', 22, 80],
    ['Summit Trekking Poles', 64, 18],
    ['Camp Lantern', 38, 35],
    ['Alpine Rain Shell', 149, 12],
    ['Field Journal', 18, 50],
    ['Basecamp Mug', 16, 0],
    ['Switchback Tent', 239, 7],
  ] as const
  const products: Product[] = []

  for (const [index, [name, price, inventory]] of productSeeds.entries()) {
    products.push(
      await payload.create({
        collection: 'products',
        data: {
          name,
          slug: slug({ value: name }),
          _status: index === 6 ? 'draft' : 'published',
          categories: [categories[index % categories.length]!.id],
          description: `${name} is a sample product for the Northstar Field Co. catalog.`,
          gallery: [{ caption: name, image: media[index % media.length]!.id }],
          inventory,
          price,
          sku: `NFC-${String(index + 1).padStart(3, '0')}`,
          specifications: { material: 'Sample material', weightGrams: 250 + index * 75 },
          variants: [
            {
              inStock: inventory > 0,
              label: 'Standard',
              sku: `NFC-${String(index + 1).padStart(3, '0')}-STD`,
            },
          ],
        },
      }),
    )
  }

  const articleTitles = [
    'A first walk in the foothills',
    'How to pack a lighter day bag',
    'The quiet art of campsite setup',
    'Finding your first climbing route',
    'What belongs in a trail journal',
    'Five ways to care for local trails',
    'Planning a weekend under the stars',
    'A guide to changing weather',
    'Choosing gear that lasts',
    'Notes from the ridgeline',
  ]
  const articles: Article[] = []

  for (const [index, title] of articleTitles.entries()) {
    const sections: NonNullable<Article['sections']> = [
      {
        blockType: 'callout',
        text: 'Bring water, check the forecast, and tell someone where you are going.',
        tone: index % 3 === 0 ? 'tip' : 'note',
      },
    ]

    if (index % 3 === 0) {
      sections.push({
        blockType: 'gearList',
        heading: 'Recommended gear',
        products: [products[index % products.length]!.id],
      })
    }

    articles.push(
      await payload.create({
        collection: 'articles',
        data: {
          slug: slug({ value: title }),
          _status: index === 9 ? 'draft' : 'published',
          author: authors[index % authors.length]!.id,
          body: richText({
            text: `${title}. Take time to explore, prepare well, and leave the place better than you found it.`,
          }),
          categories: [categories[index % categories.length]!.id],
          cover: media[index % media.length]!.id,
          excerpt: `A short field guide: ${title.toLowerCase()}.`,
          featured: index < 3,
          publishedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
          sections,
          seo: { description: `Read ${title.toLowerCase()} from Northstar Field Co.`, title },
          title,
        },
      }),
    )
  }

  await payload.update({
    id: articles[0]!.id,
    collection: 'articles',
    data: { relatedArticles: [articles[1]!.id, articles[2]!.id] },
  })

  await payload.update({
    id: categories[0]!.id,
    collection: 'categories',
    data: { name: 'Senderismo', description: 'Historias, equipo y guías de senderismo.' },
    locale: 'es',
  })

  await payload.update({
    id: products[0]!.id,
    collection: 'products',
    data: { name: 'Mochila de montaña', description: 'Una mochila ligera para cada excursión.' },
    locale: 'es',
  })

  await payload.update({
    id: articles[0]!.id,
    collection: 'articles',
    data: {
      body: richText({ text: 'Explora las colinas con tiempo, agua y curiosidad.' }),
      excerpt: 'Una breve guía para empezar.',
      title: 'Un primer paseo por las colinas',
    },
    locale: 'es',
  })

  const eventTitles = [
    'Sunrise trail walk',
    'Intro to climbing',
    'Camp cooking workshop',
    'Community trail cleanup',
    'Gear care clinic',
    'Navigation basics',
    'Conservation Q&A',
    'Autumn field meetup',
  ]
  const events: Event[] = []
  const difficulties = ['beginner', 'intermediate', 'advanced'] as const

  for (const [index, title] of eventTitles.entries()) {
    const isOnline = index === 4 || index === 6

    events.push(
      await payload.create({
        collection: 'events',
        data: {
          slug: slug({ value: title }),
          description: `Join the Northstar community for ${title.toLowerCase()}.`,
          format: isOnline ? 'online' : 'in-person',
          startsAt: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
          title,
          ...(isOnline
            ? { meetingURL: 'https://example.com/events' }
            : {
                venue: {
                  name: 'Northstar Field House',
                  address: '123 Trail Lane',
                  city: 'Boulder',
                },
              }),
          capacity: 12 + index * 6,
          difficulty: difficulties[index % difficulties.length],
          hosts: [authors[index % authors.length]!.id],
          recommendedGear: [products[index % products.length]!.id],
        },
      }),
    )
  }

  const experimentNames = [
    'New article card layout',
    'Catalog filter labels',
    'Event signup flow',
    'Featured gear carousel',
    'Trail guide reading time',
  ]
  const statuses = ['planned', 'running', 'complete', 'paused'] as const

  for (const [index, name] of experimentNames.entries()) {
    await payload.create({
      collection: 'experiments',
      data: {
        name,
        enabled: index === 1 || index === 2,
        hypothesis: `${name} will make sample content easier to browse.`,
        observations: [
          {
            note: 'Initial sample observation.',
            recordedAt: new Date().toISOString(),
            result: 'inconclusive',
          },
        ],
        settings: { allocation: 25 + index * 10, audience: 'demo' },
        status: statuses[index % statuses.length],
        subjects: [
          { relationTo: 'articles', value: articles[index]!.id },
          {
            relationTo: index % 2 === 0 ? 'products' : 'events',
            value: (index % 2 === 0 ? products : events)[index]!.id,
          },
        ],
      },
    })
  }

  const editorialFolder = await payload.create({
    collection: 'folders',
    data: { name: 'Editorial' },
  })
  const guidesFolder = await payload.create({
    collection: 'folders',
    data: { name: 'Guides', _h_folders: editorialFolder.id },
  })
  const archiveFolder = await payload.create({
    collection: 'folders',
    data: { name: 'Archive' },
  })

  for (const [index, title] of [
    'Home',
    'About Northstar',
    'Explore the outdoors',
    'Gear guide',
    'Community events',
    'Contact',
  ].entries()) {
    await payload.create({
      collection: 'pages',
      data: {
        _h_folders: index < 2 ? undefined : index < 5 ? guidesFolder.id : archiveFolder.id,
        _status: index === 5 ? 'draft' : 'published',
        content: richText({
          text: `Welcome to ${title}. This is sample page content for the community demo.`,
        }),
        title,
      },
    })
  }

  for (const title of [
    'Trail notes from spring',
    'Our favorite camp recipes',
    'A weekend in the mountains',
    'Meet the Northstar team',
    'Care for the places we visit',
    'The new season gear checklist',
    'Small adventures close to home',
    'Field notes from our readers',
    'Planning your first overnight trip',
  ]) {
    await payload.create({
      collection: 'posts',
      data: {
        content: richText({ text: `${title}. Sample content for the community demo.` }),
        title,
      },
    })
  }

  await payload.create({ collection: 'posts', data: { title: 'example post' } })

  await payload.updateGlobal({
    slug: 'menu',
    data: { globalText: 'Explore stories, gear, and events from Northstar Field Co.' },
  })
  await payload.updateGlobal({
    slug: 'playground-settings',
    data: {
      announcement: 'Get outside and explore something new.',
      features: { showCatalog: true, showEvents: true },
      notes: 'Placeholder settings for the community demo.',
      siteName: 'Northstar Field Co.',
    },
  })
}
