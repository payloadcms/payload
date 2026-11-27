import '@payloadcms/ui/css/tokens'

import { createFileRoute } from '@tanstack/react-router'

import { StandaloneModals } from '../../a11y/components/StandaloneModals/index.js'

export const Route = createFileRoute('/modals')({
  component: ModalsPage,
  head: () => ({ meta: [{ title: 'Standalone modals' }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    shadow: search.shadow === true || search.shadow === 'true',
  }),
})

function ModalsPage() {
  const { shadow } = Route.useSearch()

  return <StandaloneModals isShadow={shadow} />
}
