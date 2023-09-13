import { cookies } from 'next/headers'

export interface DraftOptions {
  draft?: boolean
  payloadToken?: string
}

export const parsePreviewOptions = (
  searchParams: Record<string, string | undefined>,
): DraftOptions => {
  const draft = searchParams.preview === 'true'
  const payloadToken = cookies().get('payload-token')?.value

  return { draft, payloadToken }
}
