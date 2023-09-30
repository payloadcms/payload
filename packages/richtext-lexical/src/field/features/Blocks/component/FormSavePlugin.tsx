import type { Data } from 'payload/types'
import type React from 'react'

import { reduceFieldsToValues, useAllFormFields } from 'payload/components/forms'
import { useEffect } from 'react'

import './index.scss'

type Props = {
  onChange?: ({ formData }: { formData: Data }) => void
}

export const FormSavePlugin: React.FC<Props> = (props) => {
  const { onChange } = props

  const [fields, dispatchFields] = useAllFormFields()

  // Pass in fields, and indicate if you'd like to "unflatten" field data.
  // The result below will reflect the data stored in the form at the given time
  const formData = reduceFieldsToValues(fields, true)

  useEffect(() => {
    if (onChange) {
      onChange({ formData })
    }
  }, [formData, onChange])

  return null
}
