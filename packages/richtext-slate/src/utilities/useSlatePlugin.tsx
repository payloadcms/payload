import type { Editor } from 'slate'

import { useAddClientFunction, useFieldProps } from '@payloadcms/ui'

type Plugin = (editor: Editor) => Editor

export const useSlatePlugin = (key: string, plugin: Plugin) => {
  const { schemaPath } = useFieldProps()

  useAddClientFunction(`slatePlugin.${schemaPath}.${key}`, plugin)
}
