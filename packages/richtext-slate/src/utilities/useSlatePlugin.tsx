import type { Editor } from 'slate'

import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import { useAddClientFunction } from '@payloadcms/ui/providers/ClientFunction'

type Plugin = (editor: Editor) => Editor

export const useSlatePlugin = (key: string, plugin: Plugin) => {
  const { schemaPath } = useFieldProps()

  useAddClientFunction(`slatePlugin.${schemaPath}.${key}`, plugin)
}
