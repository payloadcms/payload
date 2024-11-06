export const path = '/re-initialize'

export const reInitializeDB = async ({
  serverURL,
  snapshotKey,
  uploadsDir,
}: {
  serverURL: string
  snapshotKey: string
  uploadsDir?: string | string[]
}) => {
  const maxAttempts = 50
  let attempt = 1

  while (attempt <= maxAttempts) {
    try {
      console.log(`Attempting to reinitialize DB (attempt ${attempt}/${maxAttempts})...`)

      const response = await fetch(`${serverURL}/api${path}`, {
        method: 'post',
        body: JSON.stringify({
          snapshotKey,
          uploadsDir,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log('Successfully reinitialized DB')
      return
    } catch (error) {
      console.error(`Failed to reinitialize DB: ${error.message}`)

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
