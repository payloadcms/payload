import type { Operator, Option, SelectFieldClient, TextFieldClient } from 'payload'

import React from 'react'

import type { FieldCondition } from '../../types.js'

import { DateField } from '../Date/index.js'
import { NumberField } from '../Number/index.js'
import { RelationshipField } from '../Relationship/index.js'
import { Select } from '../Select/index.js'
import { Text } from '../Text/index.js'

type Props = {
  booleanSelect: boolean
  disabled: boolean
  internalField: FieldCondition
  onChange: React.Dispatch<React.SetStateAction<string>>
  operator: Operator
  options: Option[]
  value: string
}

export const DefaultFilter: React.FC<Props> = ({
  booleanSelect,
  disabled,
  internalField,
  onChange,
  operator,
  options,
  value,
}) => {
  if (booleanSelect || ['radio', 'select'].includes(internalField?.field?.type)) {
    return (
      <Select
        disabled={disabled}
        field={internalField.field as SelectFieldClient}
        onChange={onChange}
        operator={operator}
        options={options}
        value={value}
      />
    )
  }

  switch (internalField?.field?.type) {
    case 'date': {
      return (
        <DateField
          disabled={disabled}
          field={internalField.field}
          onChange={onChange}
          operator={operator}
          value={value}
        />
      )
    }

    case 'number': {
      return (
        <NumberField
          disabled={disabled}
          field={internalField.field}
          onChange={onChange}
          operator={operator}
          value={value}
        />
      )
    }

    case 'relationship': {
      return (
        <RelationshipField
          disabled={disabled}
          field={internalField.field}
          onChange={onChange}
          operator={operator}
          value={value}
        />
      )
    }

    default: {
      return (
        <Text
          disabled={disabled}
          field={internalField?.field as TextFieldClient}
          onChange={onChange}
          operator={operator}
          value={value}
        />
      )
    }
  }
}
