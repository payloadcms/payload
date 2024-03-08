import React from 'react'

const CustomError: React.FC<any> = (props) => {
  const { showError = false } = props

  if (showError) {
    return <div className="custom-error">#custom-error</div>
  }

  return null
}

export default CustomError
