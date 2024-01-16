'use client'

import {
  RelationshipComponent,
  SelectComponent,
  useAuth,
  useConfig,
  useFormFields,
  useTranslation,
} from '@payloadcms/ui'
import React, { Fragment, useEffect, useState } from 'react'

const createOptions = (collections, permissions) =>
  collections.reduce((options, collection) => {
    if (
      permissions?.collections?.[collection.slug]?.read?.permission &&
      collection?.admin?.enableRichTextRelationship
    ) {
      return [
        ...options,
        {
          label: collection.labels.plural,
          value: collection.slug,
        },
      ]
    }

    return options
  }, [])

const RelationshipFields = () => {
  const { collections } = useConfig()
  const { permissions } = useAuth()
  const { t } = useTranslation()

  const [options, setOptions] = useState(() => createOptions(collections, permissions))
  const relationTo = useFormFields<string>(([fields]) => fields.relationTo?.value as string)

  useEffect(() => {
    setOptions(createOptions(collections, permissions))
  }, [collections, permissions])

  return (
    <Fragment>
      <SelectComponent
        label={t('fields:relationTo')}
        name="relationTo"
        options={options}
        required
      />
      {relationTo && (
        <RelationshipComponent
          label={t('fields:relatedDocument')}
          name="value"
          relationTo={relationTo}
          required
        />
      )}
    </Fragment>
  )
}

export default RelationshipFields
