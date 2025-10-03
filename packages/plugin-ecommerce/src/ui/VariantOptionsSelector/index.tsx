import type { SelectFieldServerProps } from 'payload'

import { FieldLabel } from '@payloadcms/ui'

import { ErrorBox } from './ErrorBox.js'
import './index.css'
import { OptionsSelect } from './OptionsSelect.js'
type Props = {} & SelectFieldServerProps

export const VariantOptionsSelector: React.FC<Props> = async (props) => {
  const { clientField, data, path, req, user } = props
  const { label } = clientField

  const product = await req.payload.findByID({
    id: data.product,
    collection: 'products',
    depth: 0,
    draft: true,
    select: {
      variants: true,
      variantTypes: true,
    },
    user,
  })

  // @ts-expect-error - TODO: Fix types
  const existingVariantOptions = product.variants?.docs?.map((variant) => variant.options) ?? []

  const variantTypeIDs = product.variantTypes

  const variantTypes = []

  // Need to get the variant types separately so that the options are populated
  // @ts-expect-error - TODO: Fix types
  if (variantTypeIDs?.length && variantTypeIDs.length > 0) {
    // @ts-expect-error - TODO: Fix types
    for (const variantTypeID of variantTypeIDs) {
      const variantType = await req.payload.findByID({
        id: variantTypeID,
        collection: 'variantTypes',
        depth: 1,
        joins: {
          options: {
            sort: 'value',
          },
        },
      })

      if (variantType) {
        variantTypes.push(variantType)
      }
    }
  }

  return (
    <div className="variantOptionsSelector">
      <div className="variantOptionsSelectorHeading">
        <FieldLabel as="span" label={label} />
      </div>

      <ErrorBox existingOptions={existingVariantOptions} path={path}>
        <div className="variantOptionsSelectorList">
          {variantTypes.map((type) => {
            // @ts-expect-error - TODO: Fix types
            const options = type.options.docs.map((option) => ({
              label: option.label,
              value: option.id,
            }))

            return (
              <OptionsSelect
                field={clientField}
                key={type.name}
                label={type.label || type.name}
                options={options}
                path={path}
              />
            )
          })}
        </div>
      </ErrorBox>
    </div>
  )
}
