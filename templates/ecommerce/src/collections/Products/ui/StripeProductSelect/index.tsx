import { TextFieldClientProps } from 'payload'
import { ComponentClient } from './index.client'

export const StripeProductSelect: React.FC<TextFieldClientProps> = (props) => {
  const {
    field: { label, name },
    path,
  } = props

  return <ComponentClient name={name} label={label} path={path} />
}
