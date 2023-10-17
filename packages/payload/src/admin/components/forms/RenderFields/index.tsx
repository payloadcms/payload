import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { fieldAffectsData } from '../../../../fields/config/types'
import { getTranslation } from '../../../../utilities/getTranslation'
import useIntersect from '../../../hooks/useIntersect'
import { useOperation } from '../../utilities/OperationProvider'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import { filterFields } from './filterFields'
import './index.scss'

const baseClass = 'render-fields'

const intersectionObserverOptions = {
  rootMargin: '1000px',
}

/**
 * If you send `fields` through, it will render those fields explicitly
 * Otherwise, it will reduce your fields using the other provided props
 * This is so that we can conditionally render fields before reducing them, if desired
 * See the sidebar in '../collections/Edit/Default/index.tsx' for an example
 *
 * The state/data for the fields it renders is not managed by this component. Instead, every component it renders has
 * their own handling of their own value, usually through the useField hook. This hook will get the field's value
 * from the Form the field is in, using the field's path.
 *
 * Thus, if you would like to set the value of a field you render here, you must do so in the Form that contains the field, or in the
 * Field component itself.
 *
 * All this component does is render the field's Field Components, and pass them the props they need to function.
 **/
const RenderFields: React.FC<Props> = (props) => {
  const { className, fieldTypes, forceRender, margins } = props

  const { i18n, t } = useTranslation('general')
  const [hasRendered, setHasRendered] = useState(Boolean(forceRender))
  const [intersectionRef, entry] = useIntersect(intersectionObserverOptions, forceRender)

  const isIntersecting = Boolean(entry?.isIntersecting)
  const isAboveViewport = entry?.boundingClientRect?.top < 0
  const shouldRender = forceRender || isIntersecting || isAboveViewport
  const operation = useOperation()

  useEffect(() => {
    if (shouldRender && !hasRendered) {
      setHasRendered(true)
    }
  }, [shouldRender, hasRendered])

  let fieldsToRender = 'fields' in props ? props?.fields : null

  if (!fieldsToRender && 'fieldSchema' in props) {
    const { fieldSchema, fieldTypes, filter, permissions, readOnly: readOnlyOverride } = props

    fieldsToRender = filterFields({
      fieldSchema,
      fieldTypes,
      filter,
      operation,
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
        ref={intersectionRef}
      >
        {hasRendered &&
          fieldsToRender.map((reducedField, fieldIndex) => {
            const {
              FieldComponent,
              field,
              fieldIsPresentational,
              fieldPermissions,
              isFieldAffectingData,
              readOnly,
            } = reducedField

            if (fieldIsPresentational) {
              return <FieldComponent key={fieldIndex} {...field} />
            }

            if (field) {
              return (
                <RenderCustomComponent
                  CustomComponent={field?.admin?.components?.Field}
                  DefaultComponent={FieldComponent}
                  componentProps={{
                    ...field,
                    admin: {
                      ...(field.admin || {}),
                      readOnly,
                    },
                    fieldTypes,
                    forceRender,
                    indexPath:
                      'indexPath' in props ? `${props?.indexPath}.${fieldIndex}` : `${fieldIndex}`,
                    path: field.path || (isFieldAffectingData && 'name' in field ? field.name : ''),
                    permissions: fieldPermissions,
                  }}
                  key={fieldIndex}
                />
              )
            }

            return (
              <div className="missing-field" key={fieldIndex}>
                {t('error:noMatchedField', {
                  label: fieldAffectsData(field)
                    ? getTranslation(field.label || field.name, i18n)
                    : field.path,
                })}
              </div>
            )
          })}
      </div>
    )
  }

  return null
}

export default RenderFields
