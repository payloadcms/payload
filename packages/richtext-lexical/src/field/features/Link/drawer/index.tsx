import { Drawer } from 'payload/components/elements'
import { Form } from 'payload/components/forms'
import { RenderFields } from 'payload/components/forms'
import { FormSubmit } from 'payload/components/forms'
import { fieldTypes } from 'payload/config'
import React from 'react'
import { useTranslation } from 'react-i18next'

import './index.scss'
import { type Props } from './types'

const baseClass = 'rich-text-link-edit-modal'

export const LinkDrawer: React.FC<Props> = ({
  drawerSlug,
  fieldSchema,
  handleClose,
  handleModalSubmit,
  initialState,
}) => {
  const { t } = useTranslation('fields')

  return (
    <Drawer className={baseClass} slug={drawerSlug} title={t('editLink') ?? ''}>
      <Form initialState={initialState} onSubmit={handleModalSubmit}>
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
