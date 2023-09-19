import payload from 'payload'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const seedTechnologies = async () => {
  const [webflowDoc, inVisionDoc, figmaDoc, illustratorDoc] = await Promise.all([
    payload.create({
      collection: 'technologies',
      data: {
        name: 'Webflow',
      },
    }),
    payload.create({
      collection: 'technologies',
      data: {
        name: 'InVision',
      },
    }),
    payload.create({
      collection: 'technologies',
      data: {
        name: 'Figma',
      },
    }),
    payload.create({
      collection: 'technologies',
      data: {
        name: 'Illustrator',
      },
    }),
  ])

  return {
    webflowDoc,
    inVisionDoc,
    figmaDoc,
    illustratorDoc,
  }
}

export type InitialTechnologies = Awaited<ReturnType<typeof seedTechnologies>>
