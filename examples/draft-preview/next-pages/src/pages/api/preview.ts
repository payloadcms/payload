import type { NextApiRequest, NextApiResponse } from 'next'

// eslint-disable-next-line consistent-return
const preview = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const {
    cookies: { 'payload-token': payloadToken },
    query: { url },
  } = req

  if (!url) {
    return res.status(404).json({
      message: 'No URL provided',
    })
  }

  if (!payloadToken) {
    return res.status(403).json({
      message: 'You are not allowed to preview this page',
    })
  }

  // validate the Payload token
  const userReq = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/users/me`, {
    headers: {
      Authorization: `JWT ${payloadToken}`,
    },
  })

  const userRes = await userReq.json()

  if (!userReq.ok || !userRes?.user) {
    return res.status(401).json({
      message: 'You are not allowed to preview this page',
    })
  }

  res.setPreviewData({
    payloadToken,
  })

  res.redirect(url as string)
}

export default preview
