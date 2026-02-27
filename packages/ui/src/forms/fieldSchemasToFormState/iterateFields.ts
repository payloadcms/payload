import type { FormStateIterateFieldsArgs } from 'payload/internal'

import { stripUnselectedFields } from 'payload'
import { getFieldPaths } from 'payload/shared'

import { addFieldStatePromise } from './addFieldStatePromise.js'

/**
 * Flattens the fields schema and fields data
 */
export const iterateFields = async ({
  id,
  addErrorPathToParent: addErrorPathToParentArg,
  anyParentLocalized = false,
  blockData,
  clientFieldSchemaMap,
  collectionSlug,
  data,
  fields,
  fieldSchemaMap,
  filter,
  forceFullValue = false,
  fullData,
  includeSchema = false,
  mockRSCs,
  omitParents = false,
  operation,
  parentIndexPath,
  parentPassesCondition = true,
  parentPath,
  parentSchemaPath,
  permissions,
  preferences,
  previousFormState,
  readOnly,
  renderAllFields,
  renderFieldFn: renderFieldFn,
  req,
  select,
  selectMode,
  skipConditionChecks = false,
  skipValidation = false,
  state = {},
}: FormStateIterateFieldsArgs): Promise<void> => {
  const promises = []

  fields.forEach((field, fieldIndex) => {
    let passesCondition = true

    const { indexPath, path, schemaPath } = getFieldPaths({
      field,
      index: fieldIndex,
      parentIndexPath,
      parentPath,
      parentSchemaPath,
    })

    if (path !== 'id') {
      const shouldContinue = stripUnselectedFields({
        field,
        select,
        selectMode,
        siblingDoc: data,
      })

      if (!shouldContinue) {
        return
      }
    }

    const pathSegments = path ? path.split('.') : []

    if (!skipConditionChecks) {
      try {
        passesCondition = Boolean(
          (field?.admin?.condition
            ? Boolean(
                field.admin.condition(fullData || {}, data || {}, {
                  blockData,
                  operation,
                  path: pathSegments,
                  user: req.user,
                }),
              )
            : true) && parentPassesCondition,
        )
      } catch (err) {
        passesCondition = false

        req.payload.logger.error({
          err,
          msg: `Error evaluating field condition at path: ${path}`,
        })
      }
    }

    promises.push(
      addFieldStatePromise({
        id,
        addErrorPathToParent: addErrorPathToParentArg,
        anyParentLocalized,
        blockData,
        clientFieldSchemaMap,
        collectionSlug,
        data,
        field,
        fieldIndex,
        fieldSchemaMap,
        filter,
        forceFullValue,
        fullData,
        includeSchema,
        indexPath,
        mockRSCs,
        omitParents,
        operation,
        parentIndexPath,
        parentPath,
        parentPermissions: permissions,
        parentSchemaPath,
        passesCondition,
        path,
        preferences,
        previousFormState,
        readOnly,
        renderAllFields,
        renderFieldFn,
        req,
        schemaPath,
        select,
        selectMode,
        skipConditionChecks,
        skipValidation,
        state,
      }),
    )
  })

  await Promise.all(promises)
}
