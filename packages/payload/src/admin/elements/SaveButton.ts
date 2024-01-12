export type CustomSaveButtonProps = React.ComponentType<
  DefaultSaveButtonProps & {
    DefaultButton: React.ComponentType<DefaultSaveButtonProps>
  }
>

export type DefaultSaveButtonProps = {
  label: string
  save: () => void
}
