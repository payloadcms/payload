import React from 'react'

import type { Props } from '../../../../packages/payload/src/admin/components/forms/Error/types'

const CustomError: React.FC<Props> = (props) => {
  const { showError = false } = props

  if (showError) {
    return <div className="custom-error">#custom-error</div>
  }

  return null
}

export default CustomError
