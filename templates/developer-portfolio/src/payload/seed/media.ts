import payload from 'payload'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function seedMedia() {
  const profileImage = await payload.create({
    collection: 'media',
    data: {
      alt: 'Profile picture',
    },
    filePath: `${__dirname}/media/headshot.jpg`,
  })

  const designDesignFeaturedScreenshot = await payload.create({
    collection: 'media',
    data: {
      alt: 'Marketing Image for Pre-Launch',
    },
    filePath: `${__dirname}/media/design-design-featured.jpg`,
  })

  const outsideAppFeaturedScreenshot = await payload.create({
    collection: 'media',
    data: {
      alt: 'Marketing Image for Pre-Launch',
    },
    filePath: `${__dirname}/media/outside-app-featured.jpg`,
  })

  const designAppFeaturedScreenshot = await payload.create({
    collection: 'media',
    data: {
      alt: 'Marketing Image for Pre-Launch',
    },
    filePath: `${__dirname}/media/design-app-featured.jpg`,
  })

  const artAppFeaturedScreenshot = await payload.create({
    collection: 'media',
    data: {
      alt: 'Marketing Image for Pre-Launch',
    },
    filePath: `${__dirname}/media/art-app-featured.jpg`,
  })

  const genericMarketingImageOne = await payload.create({
    collection: 'media',
    data: {
      alt: 'Marketing Image for Pre-Launch',
    },
    filePath: `${__dirname}/media/generic-1.jpg`,
  })

  const genericMarketingImageTwo = await payload.create({
    collection: 'media',
    data: {
      alt: 'Marketing Image for Pre-Launch',
    },
    filePath: `${__dirname}/media/generic-2.jpg`,
  })

  const genericMarketingImageThree = await payload.create({
    collection: 'media',
    data: {
      alt: 'UI/UX Examples',
    },
    filePath: `${__dirname}/media/generic-3.jpg`,
  })

  return {
    genericMarketingImageOne,
    genericMarketingImageTwo,
    genericMarketingImageThree,
    profileImage,
    designDesignFeaturedScreenshot,
    outsideAppFeaturedScreenshot,
    designAppFeaturedScreenshot,
    artAppFeaturedScreenshot,
  }
}

export type InitialMedia = Awaited<ReturnType<typeof seedMedia>>
