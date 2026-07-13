import { runMcpStdio } from '../stdio.js'

export const bin = async (): Promise<void> => {
  let viteHMR
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NODE_ENV !== 'test' &&
    process.env.DISABLE_PAYLOAD_HMR !== 'true'
  ) {
    const { initializeViteHMR } = await import('./initializeViteHMR.js')
    viteHMR = await initializeViteHMR()
  }

  await runMcpStdio(viteHMR?.config)
  await viteHMR?.connect()
}
