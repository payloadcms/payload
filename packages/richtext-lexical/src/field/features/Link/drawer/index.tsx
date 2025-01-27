import { Drawer } from 'payload/components/elements'
import { Form } from 'payload/components/forms'
import { RenderFields } from 'payload/components/forms'
import { FormSubmit } from 'payload/components/forms'
import { fieldTypes } from 'payload/components/forms'
import React from 'react'
import { useTranslation } from 'react-i18next'

import './index.scss'
import { type Props } from './types'

const baseClass = 'lexical-link-edit-drawer'

export const LinkDrawer: React.FC<Props> = ({
  drawerSlug,
  fieldSchema,
  handleModalSubmit,
  initialState,
}) => {
  const { t } = useTranslation('fields')

  return (
    <Drawer className={baseClass} slug={drawerSlug} title={t('editLink') ?? ''}>
      <Form fields={fieldSchema} initialState={initialState} onSubmit={handleModalSubmit}>
        <RenderFields
          fieldSchema={fieldSchema}
          fieldTypes={fieldTypes}
          forceRender
          readOnly={false}
        />
        <FormSubmit>{t('general:submit')}</FormSubmit>
      </Form>
    </Drawer>
  )
}
