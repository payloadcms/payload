import { Banner as PayloadBanner } from '@payloadcms/ui'

export function Banner(props: {
  children?: React.ReactNode
  className?: string
  description?: string
  message?: string
}) {
  const { children, className, description, message } = props
  return (
    <PayloadBanner className={className} type="success">
      {children || message || description || 'A custom banner component'}
    </PayloadBanner>
  )
}
