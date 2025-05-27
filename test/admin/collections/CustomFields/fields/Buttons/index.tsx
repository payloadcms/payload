import { Button } from '@payloadcms/ui'

const sizes = ['small', 'medium', 'large'] as const
const buttonStyles = [
  'error',
  'icon-label',
  'none',
  'pill',
  'primary',
  'secondary',
  'subtle',
  'transparent',
  'tab',
] as const

export const AllButtons = () => {
  return (
    <div>
      {buttonStyles.map((style) => (
        <div key={style}>
          {sizes.map((size) => (
            <Button buttonStyle={style} key={`${style}-${size}`} size={size}>
              {style} - {size}
            </Button>
          ))}
          <hr />
        </div>
      ))}
    </div>
  )
}
