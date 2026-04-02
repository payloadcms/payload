import React from 'react'

export const ArrayRowLabel = (props) => {
  return (
    <p data-id={props.value[props?.rowNumber - 1]?.id} id="custom-array-row-label">
      This is a custom component
    </p>
  )
}
