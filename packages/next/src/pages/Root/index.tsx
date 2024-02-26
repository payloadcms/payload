import type { SanitizedConfig } from 'payload/types'

import { redirect } from 'next/navigation'

export const RootPage = async ({ config: configPromise }: { config: Promise<SanitizedConfig> }) => {
  const config = await configPromise
  return redirect(config.routes.admin || '/admin')
}
