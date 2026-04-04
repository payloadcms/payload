import type { PayloadRequest } from 'payload'

export type VerifyData = {
  isVerified: boolean
  textToRender: string
}

export async function getVerifyData({
  collectionSlug,
  req,
  token,
}: {
  collectionSlug: string
  req: PayloadRequest
  token: string
}): Promise<VerifyData> {
  try {
    await req.payload.verifyEmail({
      collection: collectionSlug,
      token,
    })

    return {
      isVerified: true,
      textToRender: req.t('authentication:emailVerified'),
    }
  } catch {
    return {
      isVerified: false,
      textToRender: req.t('authentication:unableToVerify'),
    }
  }
}
