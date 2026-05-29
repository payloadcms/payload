import type { GenerateMetadataDescriptor } from 'payload'

export const generateDashboardMetadata: GenerateMetadataDescriptor = ({ config, i18n: { t } }) =>
  Promise.resolve({
    openGraph: {
      title: t('general:dashboard'),
    },
    serverURL: config.serverURL,
    title: t('general:dashboard'),
  })
