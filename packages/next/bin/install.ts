import path from 'path'
import fs from 'fs'
import { copyRecursiveSync } from './utilities/copyRecursiveSync'
import { copyFile } from './utilities/copyFile'

const install = () => {
  const useSrc = fs.existsSync(path.resolve(process.cwd(), './src'))
  const hasAppFolder = fs.existsSync(path.resolve(process.cwd(), `./${useSrc ? 'src/' : 'app'}`))

  if (!hasAppFolder) {
    console.error(
      `You need to have a ${
        useSrc ? 'src/' : 'app/'
      } folder in your project before running this command.`,
    )
    process.exit(1)
  }

  const basePath = useSrc ? './src' : '.'

  // Copy handlers into /api
  copyRecursiveSync(
    path.resolve(__dirname, './templates/pages/api'),
    path.resolve(process.cwd(), `${basePath}/pages/api`),
  )

  // Copy admin into /app
  copyRecursiveSync(
    path.resolve(__dirname, './templates/app'),
    path.resolve(process.cwd(), `${basePath}/app`),
  )

  const payloadConfigPath = path.resolve(process.cwd(), `${basePath}/payload`)

  if (!fs.existsSync(payloadConfigPath)) {
    fs.mkdirSync(payloadConfigPath)
  }

  // Copy payload initialization
  copyFile(
    path.resolve(__dirname, './templates/payloadClient.ts'),
    path.resolve(process.cwd(), `${basePath}/payload/payloadClient.ts`),
  )

  // Copy base payload config
  copyFile(
    path.resolve(__dirname, './templates/payload.config.ts'),
    path.resolve(process.cwd(), `${basePath}/payload/payload.config.ts`),
  )

  process.exit(0)
}

export default install()
