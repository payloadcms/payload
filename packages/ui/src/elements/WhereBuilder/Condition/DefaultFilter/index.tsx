import type {
  Operator,
  Option,
  ResolvedFilterOptions,
  SelectFieldClient,
  TextFieldClient,
} from 'payload'

import React from 'react'

import type { ReducedField, Value } from '../../types.js'

import { DateFilter } from '../Date/index.js'
import { NumberFilter } from '../Number/index.js'
import { RelationshipFilter } from '../Relationship/index.js'
import { Select } from '../Select/index.js'
import { Text } from '../Text/index.js'

type Props = {
  booleanSelect: boolean
  disabled: boolean
  filterOptions: ResolvedFilterOptions
  internalField: ReducedField
  onChange: React.Dispatch<React.SetStateAction<string>>
  operator: Operator
  options: Option[]
  value: Value
}

export const DefaultFilter: React.FC<Props> = ({
  booleanSelect,
  disabled,
  filterOptions,
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
        isClearable={!booleanSelect}
        onChange={onChange}
        operator={operator}
        options={options}
        value={value as string}
      />
    )
  }

  switch (internalField?.field?.type) {
    case 'date': {
      return (
        <DateFilter
          disabled={disabled}
          field={internalField.field}
          onChange={onChange}
          operator={operator}
          value={value as Date | string}
        />
      )
    }

    case 'number': {
      return (
        <NumberFilter
          disabled={disabled}
          field={internalField.field}
          onChange={onChange}
          operator={operator}
          value={value as number | number[]}
        />
      )
    }

    case 'relationship': {
      return (
        <RelationshipFilter
          disabled={disabled}
          field={internalField.field}
          filterOptions={filterOptions}
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
          value={value as string | string[]}
        />
      )
    }
  }
}
