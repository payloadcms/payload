// eslint-disable-next-line no-restricted-exports
export default async () => {
  if (global._mongoMemoryServer) {
    console.log('Stopping memorydb...')
    await global._mongoMemoryServer.stop()
    console.log('Stopped memorydb')
  }
}
