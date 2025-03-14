import type {
  CollectionSlug,
  FieldWithPathClient,
  SanitizedCollectionPermission,
  SelectType,
} from 'payload'

import { unflatten } from 'payload/shared'
import { useCallback } from 'react'

import { useForm } from '../../forms/Form/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { filterOutUploadFields } from '../../utilities/filterOutUploadFields.js'
import { FieldSelect } from '../FieldSelect/index.js'

export const BulkEditFieldSelect = ({
  collectionPermissions,
  collectionSlug,
  fields,
  onChange: onChangeFromProps,
}: {
  collectionPermissions: SanitizedCollectionPermission
  collectionSlug: CollectionSlug
  fields: FieldWithPathClient[]
  onChange: (fields: FieldWithPathClient[]) => void
}) => {
  const { dispatchFields, getFields } = useForm()
  const { getFormState } = useServerFunctions()
  const filteredFields = filterOutUploadFields(fields)

  const onChange = useCallback(
    async (selected: FieldWithPathClient[]) => {
      onChangeFromProps(selected)

      const { state } = await getFormState({
        collectionSlug,
        docPermissions: collectionPermissions,
        docPreferences: null,
        formState: getFields(),
        operation: 'update',
        schemaPath: collectionSlug,
        select: unflatten(
          selected.reduce((acc, option) => {
            acc[option.path] = true
            return acc
          }, {} as SelectType),
        ),
      })

      dispatchFields({
        type: 'UPDATE_MANY',
        formState: state,
      })
    },
    [
      onChangeFromProps,
      getFormState,
      collectionSlug,
      collectionPermissions,
      getFields,
      dispatchFields,
    ],
  )

  return <FieldSelect fields={filteredFields} onChange={onChange} />
}
