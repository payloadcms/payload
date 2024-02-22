import type { Editor } from 'slate'

import { useAddClientFunction } from '@payloadcms/ui/providers'

import { useFieldPath } from '../../../ui/src/forms/FieldPathProvider'

type Plugin = (editor: Editor) => Editor

export const useSlatePlugin = (key: string, plugin: Plugin) => {
  const { schemaPath } = useFieldPath()

  useAddClientFunction(`slatePlugin.${schemaPath}.${key}`, plugin)
}
