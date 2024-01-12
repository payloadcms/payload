export type CustomSaveDraftButtonProps = React.ComponentType<
  DefaultSaveDraftButtonProps & {
    DefaultButton: React.ComponentType<DefaultSaveDraftButtonProps>
  }
>

export type DefaultSaveDraftButtonProps = {
  disabled: boolean
  label: string
  saveDraft: () => void
}
