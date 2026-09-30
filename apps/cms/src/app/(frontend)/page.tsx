import { redirect } from 'next/navigation'

import config from '@/payload.config'

// This deployment is a headless CMS: send visitors of `/` straight to the admin panel.
export default async function HomePage() {
  const payloadConfig = await config

  redirect(payloadConfig.routes.admin)
}
