import type { PayloadRequest } from '../../../../index.js'

export const isFieldInSelect = (
  select: Record<string, unknown> | undefined,
  fieldName: string,
): boolean => {
  if (!select) {
    return false
  }
  return select[fieldName] === true
}

export const isPathFieldSelectedFromSelect = ({
  select,
  slugPathFieldName,
  titlePathFieldName,
}: {
  select: Record<string, unknown> | undefined
  slugPathFieldName: string
  titlePathFieldName: string
}): boolean => {
  if (!select) {
    return false
  }
  return isFieldInSelect(select, slugPathFieldName) || isFieldInSelect(select, titlePathFieldName)
}

export const isPathFieldSelectedFromRequest = ({
  req,
  slugPathFieldName,
  titlePathFieldName,
}: {
  req: PayloadRequest
  slugPathFieldName: string
  titlePathFieldName: string
}): boolean => {
  const selectParam = req.query?.select

  if (selectParam) {
    if (typeof selectParam === 'string') {
      const selectedFields = selectParam.split(',').map((f) => f.trim())
      return (
        selectedFields.includes(slugPathFieldName) || selectedFields.includes(titlePathFieldName)
      )
    }

    if (Array.isArray(selectParam)) {
      return selectParam.includes(slugPathFieldName) || selectParam.includes(titlePathFieldName)
    }
  }

  return false
}
