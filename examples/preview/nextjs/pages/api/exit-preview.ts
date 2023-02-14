import type { NextApiRequest, NextApiResponse } from 'next'

const exitPreview = (req: NextApiRequest, res: NextApiResponse): void => {
  res.clearPreviewData()
  res.writeHead(200)
  res.end()
}

export default exitPreview
