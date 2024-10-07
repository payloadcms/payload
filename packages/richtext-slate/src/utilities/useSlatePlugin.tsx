import type { Editor } from 'slate'

import { useAddClientFunction } from '@payloadcms/ui'

type Plugin = (editor: Editor) => Editor

export const useSlatePlugin = (key: string, plugin: Plugin, schemaPath: string) => {
  useAddClientFunction(`slatePlugin.${schemaPath}.${key}`, plugin)
}
