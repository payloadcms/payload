import type { Editor } from 'slate'

import { useFieldPath } from '@payloadcms/ui/forms'
import { useAddClientFunction } from '@payloadcms/ui/providers'

type Plugin = (editor: Editor) => Editor

export const useSlatePlugin = (key: string, plugin: Plugin) => {
  const { schemaPath } = useFieldPath()

  useAddClientFunction(`slatePlugin.${schemaPath}.${key}`, plugin)
}
