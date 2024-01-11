export type CustomPreviewButtonProps = React.ComponentType<
  DefaultPreviewButtonProps & {
    DefaultButton: React.ComponentType<DefaultPreviewButtonProps>
  }
>

export type DefaultPreviewButtonProps = {
  disabled: boolean
  label: string
  preview: () => void
}
