import React from 'react'

import { fieldAffectsData } from 'payload/types'
import type { Props } from './types'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent'

import './index.scss'
import { FormFieldBase } from '../field-types/shared'
import { filterFields } from './filterFields'
import { getTranslation } from '@payloadcms/translations'

const baseClass = 'render-fields'

const RenderFields: React.FC<Props> = (props) => {
  const {
    className,
    fieldTypes,
    forceRender,
    margins,
    data,
    user,
    formState,
    i18n,
    payload,
    docPreferences,
  } = props

  if (!i18n) {
    console.error('Need to implement i18n when calling RenderFields')
  }

  let fieldsToRender = 'fields' in props ? props?.fields : null

  if (!fieldsToRender && 'fieldSchema' in props) {
    const { fieldSchema, fieldTypes, filter, permissions, readOnly: readOnlyOverride } = props

    fieldsToRender = filterFields({
      fieldSchema,
      fieldTypes,
      filter,
      operation: props?.operation,
      permissions,
      readOnly: readOnlyOverride,
    })
  }

  if (fieldsToRender) {
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
        {fieldsToRender?.map((reducedField, fieldIndex) => {
          const {
            FieldComponent,
            field,
            fieldIsPresentational,
            fieldPermissions,
            isFieldAffectingData,
            readOnly,
          } = reducedField

          const path = field.path || (isFieldAffectingData && 'name' in field ? field.name : '')

          const fieldState = formState?.[path]

          // first check `fieldState` to let top-level group fields through, i.e. `myGroup`
          // this will proceed to render its children, i.e. `myGroup.myField`
          if (fieldState && !fieldState?.passesCondition) return null

          if (fieldIsPresentational) {
            return <FieldComponent key={fieldIndex} />
          }

          // TODO: type this, i.e. `componentProps: FieldComponentProps`
          const componentProps: FormFieldBase & Record<string, any> = {
            ...field,
            admin: {
              ...(field.admin || {}),
              readOnly,
            },
            fieldTypes,
            forceRender,
            indexPath: 'indexPath' in props ? `${props?.indexPath}.${fieldIndex}` : `${fieldIndex}`,
            path,
            permissions: fieldPermissions,
            data,
            user,
            formState,
            valid: fieldState?.valid,
            errorMessage: fieldState?.errorMessage,
            i18n,
            payload,
            docPreferences,
          }

          if (field) {
            return (
              <RenderCustomComponent
                CustomComponent={field?.admin?.components?.Field}
                DefaultComponent={FieldComponent}
                componentProps={componentProps}
                key={fieldIndex}
              />
            )
          }

          return (
            <div className="missing-field" key={fieldIndex}>
              {i18n
                ? i18n.t('error:noMatchedField', {
                    label: fieldAffectsData(field)
                      ? getTranslation(field.label || field.name, i18n)
                      : field.path,
                  })
                : 'Need to implement i18n when calling RenderFields'}
            </div>
          )
        })}
      </div>
    )
  }

  return null
}

export default RenderFields
