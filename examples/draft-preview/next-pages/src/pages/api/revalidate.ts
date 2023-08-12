import type { NextApiRequest, NextApiResponse } from 'next'

const revalidate = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.NEXT_PRIVATE_REVALIDATION_KEY) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  if (typeof req.query.revalidatePath === 'string') {
    try {
      await res.revalidate(req.query.revalidatePath)
      return res.json({ revalidated: true })
    } catch (err: unknown) {
      // If there was an error, Next.js will continue
      // to show the last successfully generated page
      return res.status(500).send('Error revalidating')
    }
  }

  return res.status(400).send('No path to revalidate')
}

export default revalidate
