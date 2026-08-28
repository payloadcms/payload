import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

export const path = '/re-initialize'

export const reInitializeDB = async ({
  deleteOnly,
  serverURL,
  snapshotKey,
  uploadsDir,
}: {
  deleteOnly?: boolean
  serverURL: string
  /** @deprecated Supplied only by configs that have not migrated to the fixture yet. */
  snapshotKey?: string
  /** @deprecated Upload directories are inferred by migrated configs. */
  uploadsDir?: string | string[]
}) => {
  const maxAttempts = 50
  let attempt = 1
  const startTime = Date.now()

  while (attempt <= maxAttempts) {
    try {
      console.log(`Attempting to reinitialize DB (attempt ${attempt}/${maxAttempts})...`)

      const queryParams = qs.stringify(
        {
          deleteOnly,
          snapshotKey,
          uploadsDir,
        },
        {
          addQueryPrefix: true,
        },
      )

      const response = await fetch(
        formatAdminURL({ apiRoute: '/api', path: `${path}${queryParams}`, serverURL }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: snapshotKey === undefined && uploadsDir === undefined ? 'post' : 'get',
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const timeTaken = Date.now() - startTime
      console.log(`Successfully reinitialized DB (took ${timeTaken}ms)`)
      return
    } catch (error) {
      console.error(`Failed to reinitialize DB`, error)

      if (attempt === maxAttempts) {
        console.error('Max retry attempts reached. Giving up.')
        throw error
      }

      console.log('Retrying in 3 seconds...')
      await new Promise((resolve) => setTimeout(resolve, 3000))
      attempt++
    }
  }
}
