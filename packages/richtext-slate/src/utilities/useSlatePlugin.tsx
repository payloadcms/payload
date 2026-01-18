import type { Editor } from 'slate'

import { useAddClientFunction } from '@ruya.sa/ui'

import { useSlateProps } from './SlatePropsProvider.js'

type Plugin = (editor: Editor) => Editor

export const useSlatePlugin = (key: string, plugin: Plugin) => {
  const { schemaPath } = useSlateProps()

  useAddClientFunction(`slatePlugin.${schemaPath}.${key}`, plugin)
}
