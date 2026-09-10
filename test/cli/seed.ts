import type { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<void> => {
  await payload.create({
    action: 'publish',
    collection: 'pages',
    data: { title: 'Seeded page' },
  } as never)

  const fileData = Buffer.from('Seeded media')

  await payload.create({
    action: 'publish',
    collection: 'media',
    data: { title: 'Seeded media' },
    file: {
      name: 'seed.txt',
      data: fileData,
      mimetype: 'text/plain',
      size: fileData.length,
    },
  } as never)

  await payload.updateGlobal({
    action: 'publish',
    slug: 'settings',
    data: { title: 'Seeded settings' },
  } as never)
}
