import type { ClientField } from 'payload'

import { toWords } from 'payload/shared'
import { Fragment } from 'react'

import { RenderCustomComponent } from '../elements/RenderCustomComponent/index.js'
import { FieldLabel } from '../fields/FieldLabel/index.js'

export const combineFieldLabel = ({
  CustomLabel,
  field,
  prefix,
}: {
  CustomLabel?: React.ReactNode
  field?: ClientField
  prefix?: React.ReactNode
}): React.ReactNode => {
  // Fall back to the humanized field name when a field has no label (e.g. `label: false`)
  // so option lists like the bulk-edit field select never render an empty entry.
  const label =
    'label' in field && field.label
      ? field.label
      : 'name' in field && field.name
        ? toWords(field.name)
        : undefined

  return (
    <Fragment>
      {prefix ? (
        <Fragment>
          <span style={{ display: 'inline-block' }}>{prefix}</span>
          {' > '}
        </Fragment>
      ) : null}
      <span style={{ display: 'inline-block' }}>
        <RenderCustomComponent
          CustomComponent={CustomLabel}
          Fallback={<FieldLabel label={label} />}
        />
      </span>
    </Fragment>
  )
}
