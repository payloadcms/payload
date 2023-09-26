import React, { useEffect, useState } from 'react'
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

// If you send `fields` through, it will render those fields explicitly
// Otherwise, it will reduce your fields using the other provided props
// This is so that we can conditionally render fields before reducing them, if desired
// See the sidebar in '../collections/Edit/Default/index.tsx' for an example
const RenderFields: React.FC<Props> = (props) => {
  const { className, fieldTypes, forceRender } = props

  const { i18n, t } = useTranslation('general')
  const [hasRendered, setHasRendered] = useState(Boolean(forceRender))
  const [intersectionRef, entry] = useIntersect(intersectionObserverOptions)

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
    const hasVisibleFields = fieldsToRender.some(
      ({ field }) => !('hidden' in field?.admin) || !field?.admin?.hidden,
    )

    return (
      <div
        className={[baseClass, className, !hasVisibleFields && `${baseClass}--none-visible`]
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
