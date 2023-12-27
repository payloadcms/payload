import React from 'react'

import type { Props } from './types'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent'
import './index.scss'

const baseClass = 'render-fields'

const RenderFields: React.FC<Props> = (props) => {
  const { className, fieldTypes, forceRender, margins } = props

  if ('fields' in props) {
    return (
      <div
        className={[
          baseClass,
          className,
          margins && `${baseClass}--margins-${margins}`,
          margins === false && `${baseClass}--margins-none`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {props?.fields?.map((reducedField, fieldIndex) => {
          const {
            FieldComponent,
            field,
            fieldIsPresentational,
            fieldPermissions,
            isFieldAffectingData,
            readOnly,
          } = reducedField

          if (fieldIsPresentational) {
            return <FieldComponent key={fieldIndex} />
          }

          if (field) {
            return (
              <RenderCustomComponent
                CustomComponent={field?.admin?.components?.Field}
                DefaultComponent={FieldComponent}
                componentProps={{
                  // ...field,
                  admin: {
                    // ...(field.admin || {}),
                    readOnly,
                  },
                  fieldTypes,
                  forceRender,
                  indexPath:
                    'indexPath' in props ? `${props?.indexPath}.${fieldIndex}` : `${fieldIndex}`,
                  path: field.path || (isFieldAffectingData && 'name' in field ? field.name : ''),
                  // permissions: fieldPermissions,
                }}
                key={fieldIndex}
              />
            )
          }

          return (
            <div className="missing-field" key={fieldIndex}>
              {/* {t('error:noMatchedField', {
                  label: fieldAffectsData(field)
                    ? getTranslation(field.label || field.name, i18n)
                    : field.path,
                })} */}
            </div>
          )
        })}
      </div>
    )
  }

  return null
}

export default RenderFields
