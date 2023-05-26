import type { NextApiRequest, NextApiResponse } from 'next'

// eslint-disable-next-line consistent-return
const preview = (req: NextApiRequest, res: NextApiResponse): void => {
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

  res.setPreviewData({
    payloadToken,
  })

  res.redirect(url as string)
}

export default preview
