import type { SidebarTab } from '../config/types.js'

export function getDefaultSidebarTabs(): SidebarTab[] {
  return [
    {
      slug: 'collections',
      component: '@payloadcms/ui/elements/Sidebar/tabs#CollectionsTab',
      icon: '@payloadcms/ui#ListViewIcon',
      isDefaultActive: true,
      label: ({ t }) => t('general:collections'),
    },
  ]
}
