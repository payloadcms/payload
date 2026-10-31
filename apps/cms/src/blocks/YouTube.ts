import type { Block } from 'payload'

const VIDEO_ID = /^[\w-]{11}$/

/**
 * Extracts the video ID from a pasted YouTube link: youtube.com/watch?v=<id>, youtu.be/<id>,
 * youtube.com/{embed,shorts,live}/<id>, or a bare ID. The website parses the link the same way.
 */
const getYouTubeID = ({ value }: { value: null | string | undefined }): null | string => {
  const input = value?.trim() || ''

  if (VIDEO_ID.test(input)) {
    return input
  }

  let url: URL

  try {
    url = new URL(input)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^(?:www|m)\./, '')
  const id =
    host === 'youtu.be'
      ? url.pathname.split('/')[1]
      : host === 'youtube.com' || host === 'youtube-nocookie.com'
        ? url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|live|shorts)\/([^/]+)/)?.[1]
        : undefined

  return id && VIDEO_ID.test(id) ? id : null
}

/** Embeds a YouTube video in a post (rendered by the website's `Youtube` component). */
export const YouTube: Block = {
  slug: 'youtube',
  fields: [
    {
      name: 'url',
      type: 'text',
      admin: {
        description:
          'e.g. https://www.youtube.com/watch?v=W4UhNo3HAMw or https://youtu.be/W4UhNo3HAMw',
      },
      label: 'Video link',
      required: true,
      validate: (value: null | string | undefined) =>
        getYouTubeID({ value }) ? true : 'Enter a YouTube video link or video ID.',
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Describes the video for screen readers.',
      },
    },
  ],
  interfaceName: 'YouTubeBlock',
  labels: {
    plural: 'YouTube videos',
    singular: 'YouTube video',
  },
}
