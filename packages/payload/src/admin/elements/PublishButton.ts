export type CustomPublishButtonProps = React.ComponentType<
  DefaultPublishButtonProps & {
    DefaultButton: React.ComponentType<DefaultPublishButtonProps>
  }
>

export type DefaultPublishButtonProps = {
  canPublish: boolean
  disabled: boolean
  id?: string
  label: string
  publish: () => void
}
