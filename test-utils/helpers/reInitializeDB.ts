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
  await fetch(`${serverURL}/api${path}`, {
    method: 'post',
    body: JSON.stringify({
      snapshotKey,
      uploadsDir,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
