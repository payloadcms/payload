import '@payloadcms/ui/css/tokens'

import { StandaloneModals } from '../../../a11y/components/StandaloneModals/index.js'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ shadow?: string }>
}) {
  const { shadow } = await searchParams

  return <StandaloneModals isShadow={shadow === 'true'} />
}
