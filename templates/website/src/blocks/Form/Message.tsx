import { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import { Width } from './Width'
import { RichText } from '@/components/RichText'

export const Message: React.FC<{ message: DefaultTypedEditorState }> = ({ message }) => {
  return (
    <Width className="my-12" width="100">
      {message && <RichText data={message} />}
    </Width>
  )
}
