import type {
  Data,
  Field,
  FlattenedBlock,
  PayloadRequest,
  SelectMode,
  SelectType,
  TabAsField,
  User,
} from 'payload'

import { getDefaultValue, stripUnselectedFields } from 'payload'
import { fieldAffectsData, tabHasName } from 'payload/shared'

import { iterateFields } from './iterateFields.js'

type Args<T> = {
  data: T
  field: Field | TabAsField
  id?: number | string
  locale: string | undefined
  req: PayloadRequest
  select?: SelectType
  selectMode?: SelectMode
  siblingData: Data
  user: User
}

// TODO: Make this works for rich text subfields
export const defaultValuePromise = async <T>({
  id,
  data,
  field,
  locale,
  req,
  select,
  selectMode,
  siblingData,
  user,
}: Args<T>): Promise<void> => {
  const shouldContinue = stripUnselectedFields({
    field,
    select,
    selectMode,
    siblingDoc: siblingData,
  })

  if (!shouldContinue) {
    return
  }

  if (fieldAffectsData(field)) {
    if (
      typeof siblingData[field.name] === 'undefined' &&
      typeof field.defaultValue !== 'undefined'
    ) {
      try {
        siblingData[field.name] = await getDefaultValue({
          defaultValue: field.defaultValue,
          locale,
          req,
          user,
          value: siblingData[field.name],
        })
      } catch (err) {
        req.payload.logger.error({
          err,
          msg: `Error calculating default value for field: ${field.name}`,
        })
      }
    }
  }

  // Traverse subfields
  switch (field.type) {
    case 'array': {
      const rows = siblingData[field.name]

      if (Array.isArray(rows)) {
        const promises = []

        rows.forEach((row) => {
          promises.push(
            iterateFields({
              id,
              data,
              fields: field.fields,
              locale,
              req,
              select,
              selectMode,
              siblingData: row,
              user,
            }),
          )
        })

        await Promise.all(promises)
      }
      break
    }

    case 'blocks': {
      const rows = siblingData[field.name]

      if (Array.isArray(rows)) {
        const promises = []
        rows.forEach((row) => {
          const blockTypeToMatch: string = row.blockType
          const block =
            req.payload.blocks[blockTypeToMatch] ??
            ((field.blockReferences ?? field.blocks).find(
              (blockType) => typeof blockType !== 'string' && blockType.slug === blockTypeToMatch,
            ) as FlattenedBlock | undefined)

          if (block) {
            row.blockType = blockTypeToMatch

            promises.push(
              iterateFields({
                id,
                data,
                fields: block.fields,
                locale,
                req,
                select,
                selectMode,
                siblingData: row,
                user,
              }),
            )
          }
        })
        await Promise.all(promises)
      }

      break
    }

    case 'collapsible':
    case 'row': {
      await iterateFields({
        id,
        data,
        fields: field.fields,
        locale,
        req,
        select,
        selectMode,
        siblingData,
        user,
      })

      break
    }
    case 'group': {
      if (typeof siblingData[field.name] !== 'object') {
        siblingData[field.name] = {}
      }

      const groupData = siblingData[field.name] as Record<string, unknown>

      await iterateFields({
        id,
        data,
        fields: field.fields,
        locale,
        req,
        select,
        selectMode,
        siblingData: groupData,
        user,
      })

      break
    }

    case 'tab': {
      let tabSiblingData
      if (tabHasName(field)) {
        if (typeof siblingData[field.name] !== 'object') {
          siblingData[field.name] = {}
        }

        tabSiblingData = siblingData[field.name] as Record<string, unknown>
      } else {
        tabSiblingData = siblingData
      }

      await iterateFields({
        id,
        data,
        fields: field.fields,
        locale,
        req,
        select,
        selectMode,
        siblingData: tabSiblingData,
        user,
      })

      break
    }

    case 'tabs': {
      await iterateFields({
        id,
        data,
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        locale,
        req,
        select,
        selectMode,
        siblingData,
        user,
      })

      break
    }

    default: {
      break
    }
  }
}
