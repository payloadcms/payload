'use client'

import { FieldError, useField, useTranslation } from '@payloadcms/ui'

type Props = {
  children?: React.ReactNode
  existingOptions: string[]
  path: string
}

export const ErrorBox: React.FC<Props> = (props) => {
  const { children, path } = props
  const { errorMessage, showError } = useField<(number | string)[]>({ path })

  return (
    <div className="variantOptionsSelectorError">
      <FieldError message={errorMessage} path={path} showError={showError} />
      <div
        className={['variantOptionsSelectorErrorWrapper', showError && 'showError']
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </div>
  )
}
