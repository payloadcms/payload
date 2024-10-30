'use client'

import { getFieldPaths } from 'payload/shared'
import React from 'react'

import type { Props } from './types.js'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { HiddenField } from '../../fields/Hidden/index.js'
import { useForm } from '../../forms/Form/context.js'
import { useIntersect } from '../../hooks/useIntersect.js'
import { useFieldComponents } from '../../providers/FieldComponents/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'render-fields'

export { Props }

export const RenderFields: React.FC<Props> = (props) => {
  const {
    className,
    fields,
    forceRender,
    margins,
    parentPath,
    permissions,
    readOnly: readOnlyFromParent,
  } = props

  const { fields: formFields } = useForm()

  const operation = useOperation()

  const { i18n } = useTranslation()

  const [hasRendered, setHasRendered] = React.useState(Boolean(forceRender))

  const [intersectionRef, entry] = useIntersect(
    {
      rootMargin: '1000px',
    },
    Boolean(forceRender),
  )

  const isIntersecting = Boolean(entry?.isIntersecting)
  const isAboveViewport = entry?.boundingClientRect?.top < 0
  const shouldRender = forceRender || isIntersecting || isAboveViewport
  const fieldComponents = useFieldComponents()

  React.useEffect(() => {
    if (shouldRender && !hasRendered) {
      setHasRendered(true)
    }
  }, [shouldRender, hasRendered])

  if (!formFields) {
    return <p>No fields to render</p>
  }

  if (!fieldComponents) {
    throw new Error('Field components not found')
  }

  if (!i18n) {
    console.error('Need to implement i18n when calling RenderFields') // eslint-disable-line no-console
  }

  if (fields && fields.length > 0) {
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
        {fields.map((field, i) => {
          const fieldPermissions = 'name' in field ? permissions?.[field.name] : null

          const { path } = getFieldPaths({
            field,
            parentPath,
            parentSchemaPath: [],
            schemaIndex: i,
          })

          const formState = formFields[path.join('.')]

          const CustomField = formState?.customComponents?.Field

          const DefaultField = fieldComponents?.[field?.type]

          // if the user cannot read the field, then filter it out
          // this is different from `admin.readOnly` which is executed based on `operation`
          if (fieldPermissions?.read?.permission === false || field?.admin?.disabled) {
            return null
          }

          // `admin.readOnly` displays the value but prevents the field from being edited
          let isReadOnly = readOnlyFromParent || field?.admin?.readOnly

          // if parent field is `readOnly: true`, but this field is `readOnly: false`, the field should still be editable
          if (isReadOnly && field.admin?.readOnly === false) {
            isReadOnly = false
          }

          // if the user does not have access control to begin with, force it to be read-only
          if (fieldPermissions?.[operation]?.permission === false) {
            isReadOnly = true
          }

          // if the field is hidden, then filter it out
          if (field.admin?.hidden) {
            return (
              <HiddenField
                field={field}
                forceRender={forceRender}
                key={i}
                path={path.join('.')}
                readOnly={isReadOnly}
                schemaPath={field._schemaPath.join('.')}
              />
            )
          }

          return (
            <RenderCustomComponent
              CustomComponent={CustomField}
              Fallback={
                <DefaultField
                  field={field}
                  fieldState={formState}
                  forceRender={forceRender}
                  key={i}
                  path={path.join('.')}
                  permissions={fieldPermissions}
                  readOnly={isReadOnly}
                  schemaPath={field._schemaPath.join('.')}
                />
              }
              key={i}
            />
          )
        })}
      </div>
    )
  }

  return null
}
