import {
  InlineBlockContainer,
  InlineBlockLabel,
  InlineBlockRemoveButton,
} from '@payloadcms/richtext-lexical/client'

export const InlineBlockComponent: React.FC = () => {
  return (
    <InlineBlockContainer>
      <InlineBlockLabel />
      <InlineBlockRemoveButton />
    </InlineBlockContainer>
  )
}
