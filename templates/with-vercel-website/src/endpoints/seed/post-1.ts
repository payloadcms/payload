import type { Post } from '@/payload-types'

export const post1: Partial<Post> = {
  slug: 'digital-horizons',
  _status: 'published',
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  authors: ['{{AUTHOR}}'],
  content: {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Dive into the marvels of modern innovation, where the only constant is change. A journey where pixels and data converge to craft the future.',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h2',
          version: 1,
        },
        {
          type: 'block',
          fields: {
            blockName: 'Disclaimer',
            blockType: 'banner',
            content: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 1,
                        mode: 'normal',
                        style: '',
                        text: 'Disclaimer:',
                        version: 1,
                      },
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: ' This content is fabricated and for demonstration purposes only. To edit this post, ',
                        version: 1,
                      },
                      {
                        type: 'link',
                        children: [
                          {
                            type: 'text',
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'navigate to the admin dashboard',
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        fields: {
                          linkType: 'custom',
                          newTab: true,
                          url: '/admin',
                        },
                        format: '',
                        indent: 0,
                        version: 3,
                      },
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: '.',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            style: 'info',
          },
          format: '',
          version: 2,
        },
        {
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'The Rise of AI and Machine Learning',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h2',
          version: 1,
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'We find ourselves in a transformative era where artificial intelligence (AI) stands at the forefront of technological evolution. The ripple effects of its advancements are reshaping industries at an unprecedented pace. No longer are businesses bound by the limitations of tedious, manual processes. Instead, sophisticated machines, fueled by vast amounts of historical data, are now capable of making decisions previously left to human intuition. These intelligent systems are not only optimizing operations but also pioneering innovative approaches, heralding a new age of business transformation worldwide. ',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1,
        },
        {
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'To demonstrate basic AI functionality, here is a javascript snippet that makes a POST request to a generic AI API in order to generate text based on a prompt. ',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h4',
          version: 1,
        },
        {
          type: 'block',
          fields: {
            blockName: 'Generate Text',
            blockType: 'code',
            code: "async function generateText(prompt) {\n    const apiKey = 'your-api-key';\n    const apiUrl = 'https://api.example.com/generate-text';\n\n    const response = await fetch(apiUrl, {\n        method: 'POST',\n        headers: {\n            'Content-Type': 'application/json',\n            'Authorization': `Bearer ${apiKey}`\n        },\n        body: JSON.stringify({\n            model: 'text-generation-model',\n            prompt: prompt,\n            max_tokens: 50\n        })\n    });\n\n    const data = await response.json();\n    console.log(data.choices[0].text.trim());\n}\n\n// Example usage\ngenerateText(\"Once upon a time in a faraway land,\");\n",
            language: 'javascript',
          },
          format: '',
          version: 2,
        },
        {
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'IoT: Connecting the World Around Us',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h2',
          version: 1,
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: "In today's rapidly evolving technological landscape, the Internet of Things (IoT) stands out as a revolutionary force. From transforming our residences with smart home systems to redefining transportation through connected cars, IoT's influence is palpable in nearly every facet of our daily lives.",
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1,
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: "This technology hinges on the seamless integration of devices and systems, allowing them to communicate and collaborate effortlessly. With each connected device, we move a step closer to a world where convenience and efficiency are embedded in the very fabric of our existence. As a result, we're transitioning into an era where our surroundings intuitively respond to our needs, heralding a smarter and more interconnected global community.",
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1,
        },
        {
          type: 'block',
          fields: {
            blockName: '',
            blockType: 'mediaBlock',
            media: '{{IMAGE_2}}',
          },
          format: '',
          version: 2,
        },
        {
          type: 'block',
          fields: {
            blockName: 'Dynamic Components',
            blockType: 'banner',
            content: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: "This content above is completely dynamic using custom layout building blocks configured in the CMS. This can be anything you'd like from rich text and images, to highly designed, complex components.",
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            style: 'info',
          },
          format: '',
          version: 2,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  heroImage: '{{IMAGE_1}}',
  meta: {
    description:
      'Dive into the marvels of modern innovation, where the only constant is change. A journey where pixels and data converge to craft the future.',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    image: '{{IMAGE_1}}',
    title: 'Digital Horizons: A Glimpse into Tomorrow',
  },
  relatedPosts: [], // this is populated by the seed script
  title: 'Digital Horizons: A Glimpse into Tomorrow',
}
