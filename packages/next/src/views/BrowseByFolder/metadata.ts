import type { Metadata } from 'next'

import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/meta.js'

export const generateBrowseByFolderMetadata = async (
  args: Parameters<GenerateViewMetadata>[0],
): Promise<Metadata> => {
  const { config, i18n } = args

  const title: string = i18n.t('folder:browseByFolder')
  const description: string = ''
  const keywords: string = ''

  return generateMetadata({
    ...(config.admin.meta || {}),
    description,
    keywords,
    serverURL: config.serverURL,
    title,
  })
}
