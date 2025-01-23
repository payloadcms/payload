import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText as RichTextWithoutBlocks } from '@payloadcms/richtext-lexical/react'

type Props = {
  data: SerializedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, ...rest } = props
  return <RichTextWithoutBlocks className={className} {...rest} />
}
