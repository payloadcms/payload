import React, { useCallback } from 'react'

import type { Props } from './types'

import { upload } from '../../../../../fields/validations'
import { useConfig } from '../../../utilities/Config'
import useField from '../../useField'
import withCondition from '../../withCondition'
import UploadInput from './Input'
import './index.scss'

const Upload: React.FC<Props> = (props) => {
  const {
    collections,
    routes: { api },
    serverURL,
  } = useConfig()

  const {
    name,
    admin: {
      className,
      condition,
      description,
      readOnly,
      style,
      width,
      components: { Error, Label } = {},
    } = {},
    fieldTypes,
    filterOptions,
    label,
    path,
    relationTo,
    required,
    validate = upload,
  } = props

  const collection = collections.find((coll) => coll.slug === relationTo)

  const memoizedValidate = useCallback(
    (value, options) => {
      return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const field = useField({
    condition,
    path,
    validate: memoizedValidate,
  })

  const { errorMessage, setValue, showError, value } = field

  const onChange = useCallback(
    (incomingValue) => {
      const incomingID = incomingValue?.id || incomingValue
      setValue(incomingID)
    },
    [setValue],
  )

  if (collection.upload) {
    return (
      <UploadInput
        api={api}
        className={className}
        collection={collection}
        description={description}
        errorMessage={errorMessage}
        fieldTypes={fieldTypes}
        filterOptions={filterOptions}
        label={label}
        name={name}
        onChange={onChange}
        path={path}
        readOnly={readOnly}
        relationTo={relationTo}
        required={required}
        serverURL={serverURL}
        showError={showError}
        style={style}
        value={value as string}
        width={width}
        Error={Error}
        Label={Label}
      />
    )
  }

  return null
}
export default withCondition(Upload)
