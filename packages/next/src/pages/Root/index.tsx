import { redirect } from 'next/navigation'
import { SanitizedConfig } from 'payload/types'

export const RootPage = async ({ config: configPromise }: { config: Promise<SanitizedConfig> }) => {
  const config = await configPromise
  return redirect(config.routes.admin || '/admin')
}
