import { Banner as PayloadBanner } from '@payloadcms/ui'

export function Banner(props: {
  children?: React.ReactNode
  description?: string
  message?: string
}) {
  const { children, description, message } = props

  return (
    <PayloadBanner type="success">
      {children || message || description || 'A custom banner component'}
    </PayloadBanner>
  )
}
