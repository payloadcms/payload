import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Field } from '../../../../fields/config/types'
import type { Props } from './types'

import Form from '../../forms/Form'
import RenderFields from '../../forms/RenderFields'
import FormSubmit from '../../forms/Submit'
import { fieldTypes } from '../../forms/field-types'
import MinimalTemplate from '../../templates/Minimal'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import Meta from '../../utilities/Meta'
import './index.scss'

const baseClass = 'create-first-user'

const CreateFirstUser: React.FC<Props> = (props) => {
  const { setInitialized } = props
  const { fetchFullUser } = useAuth()
  const {
    admin: { user: userSlug },
    collections,
    routes: { admin, api },
    serverURL,
  } = useConfig()
  const { t } = useTranslation('authentication')

  const userConfig = collections.find((collection) => collection.slug === userSlug)

  const onSuccess = async (json) => {
    if (json?.user?.token) {
      await fetchFullUser()
    }

    setInitialized(true)
  }

  const fields = [
    {
      name: 'email',
      label: t('general:emailAddress'),
      required: true,
      type: 'email',
    },
    {
      name: 'password',
      label: t('general:password'),
      required: true,
      type: 'password',
    },
    {
      name: 'confirm-password',
      label: t('confirmPassword'),
      required: true,
      type: 'confirmPassword',
    },
  ] as Field[]

  return (
    <MinimalTemplate className={baseClass}>
      <h1>{t('general:welcome')}</h1>
      <p>{t('beginCreateFirstUser')}</p>
      <Meta
        description={t('createFirstUser')}
        keywords={t('general:create')}
        title={t('createFirstUser')}
      />
      <Form
        action={`${serverURL}${api}/${userSlug}/first-register`}
        method="post"
        onSuccess={onSuccess}
        redirect={admin}
        validationOperation="create"
      >
        <RenderFields fieldSchema={[...fields, ...userConfig.fields]} fieldTypes={fieldTypes} />
        <FormSubmit>{t('general:create')}</FormSubmit>
      </Form>
    </MinimalTemplate>
  )
}

export default CreateFirstUser
