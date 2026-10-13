import type { PayloadRequest } from 'payload'

import sharp from 'sharp'

import { toTag } from '../fields'

/**
 * Writes the title, alt text, description and tags of a photo with the OpenAI API: on upload
 * (./fillFromFile.ts) and with the "Generate with AI" button (./generateTextEndpoint.ts).
 *
 * Enabled when OPENAI_API_KEY is set. OPENAI_MODEL picks a model that accepts images (default
 * gpt-5-mini). OPENAI_BASE_URL points at another OpenAI-compatible API, e.g. Azure OpenAI or a
 * proxy.
 */
const apiKey = process.env.OPENAI_API_KEY || ''
const baseURL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
const model = process.env.OPENAI_MODEL || 'gpt-5-mini'

export const isPhotoAIEnabled = Boolean(apiKey)

export type PhotoText = {
  alt: string
  description: string
  tags: string[]
  title: string
}

export type PhotoContext = {
  /** Title of the photo's album */
  album?: null | string
  /** Where it was taken, as the photographer wrote it */
  location?: null | string
}

const instructions = `You write the texts of photos in a photographer's online portfolio. They appear on each photo's page and in search engines.

Answer with:
- title: a short, specific title of 2 to 6 words. No quotes, no period at the end.
- alt: alt text for screen readers and image search: one sentence of at most 125 characters saying what the photo shows. Don't start with "Image of" or "Photo of".
- description: 2 or 3 sentences about the subject, the setting and the light, colors or mood. Natural language for people, no lists, hashtags or keyword stuffing.
- tags: 5 to 10 lowercase tags for the subject, kind of place, genre and style, e.g. street, portrait, night, mountains, black-and-white. Prefer the photographer's existing tags when they fit.

Describe only what you can see. Don't name people or guess their identity, age, ethnicity or other personal traits; describe them by what they're doing. Only name a specific place if the photographer gave it. Write in English.`

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    alt: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    title: { type: 'string' },
  },
  required: ['title', 'alt', 'description', 'tags'],
}

/** The most used tags of the photos so far, so that new photos get the same ones */
async function existingTags(req: PayloadRequest) {
  const { docs } = await req.payload.find({
    collection: 'personal-photos',
    depth: 0,
    draft: true,
    overrideAccess: true,
    pagination: false,
    req,
    select: { tags: true },
  })
  const counts = new Map<string, number>()

  for (const tag of docs.flatMap((doc) => doc.tags ?? [])) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }

  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([tag]) => tag)
}

// A small JPEG is plenty for describing a photo, and much faster and cheaper than the original
async function toDataURL(image: Buffer) {
  const jpeg = await sharp(image, { failOn: 'none' })
    .rotate()
    .resize({ fit: 'inside', height: 1024, width: 1024, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer()

  return `data:image/jpeg;base64,${jpeg.toString('base64')}`
}

const clean = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : ''

/** Asks OpenAI to describe the photo. Throws with a readable message when that fails. */
export async function describePhoto({
  context = {},
  image,
  req,
}: {
  context?: PhotoContext
  image: Buffer
  req: PayloadRequest
}): Promise<PhotoText> {
  if (!isPhotoAIEnabled) {
    throw new Error('Set OPENAI_API_KEY in the CMS .env to write photo texts with AI.')
  }

  const [imageURL, tags] = await Promise.all([toDataURL(image), existingTags(req)])
  const facts = [
    context.album && `Album: ${context.album}`,
    context.location && `Location: ${context.location}`,
    tags.length > 0 && `Existing tags: ${tags.join(', ')}`,
  ].filter(Boolean)

  const res = await fetch(`${baseURL}/chat/completions`, {
    body: JSON.stringify({
      messages: [
        { content: instructions, role: 'system' },
        {
          content: [
            { type: 'text', text: facts.join('\n') || 'Describe this photo.' },
            { type: 'image_url', image_url: { url: imageURL } },
          ],
          role: 'user',
        },
      ],
      model,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'photo_texts', schema, strict: true },
      },
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal: AbortSignal.timeout(90_000),
  }).catch((error: unknown) => {
    throw new Error(`OpenAI is unreachable: ${(error as Error).message}`)
  })

  const json = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: null | string; refusal?: null | string } }[]
    error?: { message?: string }
  } | null

  if (!res.ok) {
    throw new Error(`OpenAI answered ${res.status}: ${json?.error?.message || res.statusText}`)
  }

  const message = json?.choices?.[0]?.message

  if (message?.refusal) {
    throw new Error(`OpenAI declined to describe the photo: ${message.refusal}`)
  }

  let answer: Partial<Record<keyof PhotoText, unknown>>

  try {
    answer = JSON.parse(message?.content || '')
  } catch {
    throw new Error('OpenAI answered with something other than the expected texts.')
  }

  return {
    alt: clean(answer.alt, 250),
    description: clean(answer.description, 1000),
    tags: Array.isArray(answer.tags)
      ? [...new Set(answer.tags.map(toTag).filter(Boolean))].slice(0, 12)
      : [],
    // Models sometimes wrap a title in quotes or end it with a period
    title: clean(answer.title, 100)
      .replace(/^["'“‘]+|["'”’.]+$/g, '')
      .trim(),
  }
}
