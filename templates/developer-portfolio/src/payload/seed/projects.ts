import payload from 'payload'

import type { InitialMedia } from './media'
import type { InitialTechnologies } from './technologies'

const outsideAppMockDescription = [
  {
    children: [
      {
        text: 'As Lead UI/UX Designer for the "Outside App," I spearheaded the creation of an innovative mobile platform connecting users with nature. Conducting extensive research, I ideated with the team to design user-friendly interfaces and seamless navigation. Crafting a vibrant visual identity, we aimed to evoke adventure and user engagement.',
      },
    ],
  },
  {
    children: [
      {
        text: "To ensure a user-centric approach, I began by conducting thorough research to understand the needs and behaviors of outdoor enthusiasts. Collaborating with a multidisciplinary team, I engaged in user interviews, conducted competitor analyses, and gathered valuable insights to inform the design strategy. This research formed the bedrock upon which I sculpted the app's intuitive interface and seamless user journey.",
      },
    ],
  },
]

const outsideAppMockDetailedDescription = [
  {
    children: [
      {
        text: "Navigating the balance between aesthetics and functionality, I meticulously crafted wireframes and prototypes that manifested the app's core functionalities. My goal was to create an effortless interaction paradigm, guiding users through activities like trail discovery, location-based services, and event participation. Iterative testing and refinement ensured that every tap and swipe resonated with a sense of ease and fluidity.",
      },
    ],
  },
  {
    children: [
      {
        text: 'A cohesive visual identity was pivotal in encapsulating the essence of the "Outside App." Drawing inspiration from nature\'s palette, I curated a color scheme that evoked a sense of adventure and tranquility. The choice of typography and iconography echoed this sentiment, creating a visual harmony that translated seamlessly from high-resolution displays to smaller mobile screens. The resulting interface not only looked inviting but also fostered intuitive navigation.',
      },
    ],
  },
]

const designAppMockDescription = [
  {
    children: [
      {
        text: 'In the dynamic realm of UI/UX design, my role in shaping the transformative "Design App" project stands as a testament to my commitment to delivering exceptional digital experiences. As the lead UI/UX designer, I embarked on a journey to create an application that not only empowers designers but also redefines the creative process itself.',
      },
    ],
  },
  {
    children: [
      {
        text: "From the project's inception, I placed user needs and preferences at the forefront of the design process. Collaborating closely with researchers and developers, I immersed myself in comprehensive user research, diving into the minds of designers to uncover pain points and aspirations. This groundwork enabled me to design an app that seamlessly integrates with the design workflow while enhancing the user experience.",
      },
    ],
  },
]

const designAppMockDetailedDescription = [
  {
    children: [
      {
        text: 'Translating user insights into design decisions, I meticulously crafted user journeys that flow effortlessly from one task to another within the app. Through the meticulous creation of wireframes and interactive prototypes, I aimed to strike the delicate balance between simplicity and functionality. The result was an app that fosters a harmonious design experience, making creativity the focal point.',
      },
    ],
  },
  {
    children: [
      {
        text: 'Beyond functionality, the "Design App" demanded a cohesive visual identity that resonates with the design community. Drawing inspiration from contemporary design trends, I curated a visual language characterized by vibrant color palettes, typography that embodies creativity, and iconography that encapsulates the essence of the app\'s purpose. The result was an interface that not only looked visually appealing but also fostered intuitive navigation.',
      },
    ],
  },
]

const designDesignMockDescription = [
  {
    children: [
      {
        text: 'The "Design Design" app project stands as a quintessential embodiment of my passion for crafting seamless digital experiences that elevate creativity. As the lead UI/UX designer, I embarked on a mission to redefine the design process by creating an application that seamlessly marries innovative technology with artistic ingenuity.',
      },
    ],
  },
  {
    children: [
      {
        text: 'Following its launch, the "Design Design" app rapidly garnered attention from industry professionals and budding designers alike. Its intuitive interface and groundbreaking features have not only reshaped the way we think about design, but also established a new benchmark in the realm of digital design tools. Its success underscores the importance of fusing technological prowess with design sensibilities.',
      },
    ],
  },
]

const designDesignMockDetailedDescription = [
  {
    children: [
      {
        text: "To establish a strong brand presence, I developed the app's visual identity, creating a vibrant color scheme and selecting modern typography that resonated with our target audience. The objective was to evoke a sense of adventure and connection with nature, while also emphasizing the app's ease of use.",
      },
    ],
  },
  {
    children: [
      {
        text: "Working closely with the usability testing team, I conducted multiple rounds of user testing and gathered valuable feedback. This iterative process allowed us to fine-tune the app's design and address any pain points experienced by the testers. As a result, we optimized the app for a seamless and enjoyable user experience.",
      },
    ],
  },
]

const artAppMockDescription = [
  {
    children: [
      {
        text: 'Within the realm of UI/UX design, my journey with the "Art App" project represents an embodiment of my passion for crafting seamless digital experiences that empower creative souls. As the lead UI/UX designer, I embarked on a mission to redefine artistic expression by designing an application that seamlessly fuses technology with the artistic journey.',
      },
    ],
  },
  {
    children: [
      {
        text: "From the project's inception, I placed the user experience at the core of my design approach. Collaborating closely with cross-functional teams, I engaged in extensive user research, diving deep into the minds of artists to understand their creative process, challenges, and aspirations. This research-driven approach allowed me to design an app that truly resonates with the artistic community.",
      },
    ],
  },
]

const artAppMockDetailedDescription = [
  {
    children: [
      {
        text: "Transforming insights into actionable design decisions, I meticulously constructed user journeys that guide artists seamlessly through the app's functionalities. Using wireframes and interactive prototypes, I aimed to strike a delicate balance between simplicity and functionality. The app's navigation and interactions were carefully tailored to provide an immersive experience that complements the artist's creative flow.",
      },
    ],
  },
  {
    children: [
      {
        text: 'An integral aspect of my design philosophy is continuous refinement. I conducted rigorous user testing, gathering insights and feedback that were thoughtfully integrated into subsequent design iterations. This iterative approach ensured that the "Art App" evolved as more than just a tool; it became a canvas of user preferences, industry standards, and design innovation.',
      },
    ],
  },
]

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const seedProjects = async (media: InitialMedia, technologies: InitialTechnologies) => {
  const { genericMarketingImageOne, genericMarketingImageTwo, genericMarketingImageThree } = media
  const technologiesUsed = Object.values(technologies).map(technology => technology.id)

  const [designDesign, outsideApp, designApp, artApp] = await Promise.all([
    payload.create({
      collection: 'projects',
      data: {
        title: 'Design Design',
        description: designDesignMockDescription,
        role: ['uiUxDesigner'],
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-01-31'),
        technologiesUsed,
        featuredImage: media.designDesignFeaturedScreenshot.id,
        layout: [
          {
            mediaContentFields: [
              {
                alignment: 'mediaContent',
                mediaSize: 'twoThirds',
                richText: designDesignMockDetailedDescription,
                media: genericMarketingImageOne.id,
                mediaFit: 'contain',
              },
            ],
            blockType: 'mediaContent',
          },
          {
            mediaFields: [
              {
                size: 'oneThird',
                media: genericMarketingImageTwo.id,
              },
              {
                size: 'twoThirds',
                media: genericMarketingImageThree.id,
              },
            ],
            blockType: 'mediaBlock',
          },
        ],
        _status: 'published',
      },
    }),
    payload.create({
      collection: 'projects',
      data: {
        title: 'Outside App',
        description: outsideAppMockDescription,
        role: ['uiUxDesigner'],
        startDate: new Date('2023-02-01'),
        endDate: new Date('2023-02-28'),
        technologiesUsed,
        featuredImage: media.outsideAppFeaturedScreenshot.id,
        layout: [
          {
            mediaContentFields: [
              {
                alignment: 'mediaContent',
                mediaSize: 'twoThirds',
                richText: outsideAppMockDetailedDescription,
                media: genericMarketingImageOne.id,
              },
            ],
            blockType: 'mediaContent',
          },
          {
            mediaFields: [
              {
                size: 'oneThird',
                media: genericMarketingImageTwo.id,
              },
              {
                size: 'twoThirds',
                media: genericMarketingImageThree.id,
              },
            ],
            blockType: 'mediaBlock',
          },
        ],
        _status: 'published',
      },
    }),
    payload.create({
      collection: 'projects',
      data: {
        title: 'Design App',
        description: designAppMockDescription,
        role: ['uiUxDesigner'],
        startDate: new Date('2021-03-01'),
        endDate: new Date('2021-03-31'),
        technologiesUsed,
        featuredImage: media.designAppFeaturedScreenshot.id,
        layout: [
          {
            mediaContentFields: [
              {
                alignment: 'mediaContent',
                mediaSize: 'twoThirds',
                richText: designAppMockDetailedDescription,
                media: genericMarketingImageOne.id,
              },
            ],
            blockType: 'mediaContent',
          },
          {
            mediaFields: [
              {
                size: 'oneThird',
                media: genericMarketingImageTwo.id,
              },
              {
                size: 'twoThirds',
                media: genericMarketingImageThree.id,
              },
            ],
            blockType: 'mediaBlock',
          },
        ],
        _status: 'published',
      },
    }),
    payload.create({
      collection: 'projects',
      data: {
        title: 'Art App',
        description: artAppMockDescription,
        role: ['uiUxDesigner'],
        startDate: new Date('2021-04-01'),
        endDate: new Date('2021-04-30'),
        technologiesUsed,
        featuredImage: media.artAppFeaturedScreenshot.id,
        layout: [
          {
            mediaContentFields: [
              {
                alignment: 'mediaContent',
                mediaSize: 'twoThirds',
                richText: artAppMockDetailedDescription,
                media: genericMarketingImageOne.id,
              },
            ],
            blockType: 'mediaContent',
          },
          {
            mediaFields: [
              {
                size: 'oneThird',
                media: genericMarketingImageTwo.id,
              },
              {
                size: 'twoThirds',
                media: genericMarketingImageThree.id,
              },
            ],
            blockType: 'mediaBlock',
          },
        ],
        _status: 'published',
      },
    }),
  ])

  return { designDesign, outsideApp, designApp, artApp }
}

export type InitialProjects = Awaited<ReturnType<typeof seedProjects>>
