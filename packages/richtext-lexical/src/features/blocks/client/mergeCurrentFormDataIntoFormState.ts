import type { Data, FieldState, FormState, Row } from 'payload'

/**
 * Rebuilds cached, flattened form state from the current nested data held by a Lexical block node.
 * Cached field entries remain the metadata source, while the node remains the value source of truth.
 */
export const mergeCurrentFormDataIntoFormState = ({
  cachedFormState,
  formData,
}: {
  cachedFormState: FormState
  formData: Data
}): FormState => {
  const cachedEntries = Object.entries(cachedFormState)
  const cachedPathsByShape = new Map<string, string[]>()
  const mergedState: FormState = { ...cachedFormState }

  for (const [path] of cachedEntries) {
    // Numeric row indexes vary as users add and reorder rows. Treat equivalent row paths as
    // templates so a cached `images.0.image` field can initialize `images.1.image` on remount.
    const pathShape = getPathShape(path)
    const matchingPaths = cachedPathsByShape.get(pathShape) ?? []

    matchingPaths.push(path)
    cachedPathsByShape.set(pathShape, matchingPaths)
  }

  const findTemplate = (path: string): { path: string; state: FieldState } | undefined => {
    const candidates = cachedPathsByShape.get(getPathShape(path))

    if (!candidates?.length) {
      return undefined
    }

    const templatePath = [...candidates].sort(
      (left, right) =>
        scoreTemplatePath({ cachedFormState, formData, path, templatePath: right }) -
        scoreTemplatePath({ cachedFormState, formData, path, templatePath: left }),
    )[0]
    const templateState = templatePath ? cachedFormState[templatePath] : undefined

    return templatePath && templateState ? { path: templatePath, state: templateState } : undefined
  }

  const hasDescendantTemplate = (path: string): boolean => {
    const descendantPrefix = `${getPathShape(path)}.`

    return cachedEntries.some(([cachedPath]) =>
      getPathShape(cachedPath).startsWith(descendantPrefix),
    )
  }

  const setValueState = ({
    path,
    template,
    value,
  }: {
    path: string
    template?: { path: string; state: FieldState }
    value: unknown
  }): void => {
    const nextState: FieldState = template
      ? { ...template.state, initialValue: value, value }
      : { initialValue: value, passesCondition: true, valid: true, value }

    if (template?.path !== path) {
      delete nextState.lastRenderedPath
    }

    mergedState[path] = nextState
  }

  const visitValue = ({
    isWithinRow,
    path,
    value,
  }: {
    isWithinRow: boolean
    path: string
    value: unknown
  }): void => {
    const template = findTemplate(path)
    const hasDescendants = hasDescendantTemplate(path)

    if (Array.isArray(value)) {
      if (template?.state.rows) {
        // Array and blocks fields store their row count in `value`; their nested values live in
        // dotted child entries and their row UI state lives in `rows`.
        const cachedRows = template.state.rows
        const rows = value.map((row, index) => buildRowMetadata({ cachedRows, index, row }))

        mergedState[path] = {
          ...template.state,
          disableFormData: rows.length > 0,
          initialValue: rows.length,
          rows,
          value: rows.length,
        }

        value.forEach((row, index) => {
          if (!isRecord(row)) {
            return
          }

          for (const [fieldName, fieldValue] of Object.entries(row)) {
            visitValue({
              isWithinRow: true,
              path: `${path}.${index}.${fieldName}`,
              value: fieldValue,
            })
          }
        })

        return
      }

      if (template) {
        setValueState({ path, template, value })
      }

      return
    }

    if (isRecord(value)) {
      const isStructuralObject =
        hasDescendants ||
        template?.state.disableFormData === true ||
        (isWithinRow && !('id' in value))

      if (!isStructuralObject) {
        if (template || isWithinRow) {
          setValueState({ path, template, value })
        }

        return
      }

      if (template) {
        mergedState[path] = { ...template.state }
      }

      for (const [fieldName, fieldValue] of Object.entries(value)) {
        const childPath = `${path}.${fieldName}`

        if (isWithinRow || findTemplate(childPath) || hasDescendantTemplate(childPath)) {
          visitValue({ isWithinRow, path: childPath, value: fieldValue })
        }
      }

      return
    }

    if (template || isWithinRow) {
      setValueState({ path, template, value })
    }
  }

  for (const [fieldName, value] of Object.entries(formData)) {
    if (!findTemplate(fieldName) && !hasDescendantTemplate(fieldName)) {
      continue
    }

    for (const [cachedPath] of cachedEntries) {
      if (cachedPath === fieldName || cachedPath.startsWith(`${fieldName}.`)) {
        delete mergedState[cachedPath]
      }
    }

    visitValue({ isWithinRow: false, path: fieldName, value })
  }

  return mergedState
}

const buildRowMetadata = ({
  cachedRows,
  index,
  row,
}: {
  cachedRows: Row[]
  index: number
  row: unknown
}): Row => {
  const rowData = isRecord(row) ? row : {}
  const rowID = typeof rowData.id === 'string' ? rowData.id : undefined
  const cachedRow = rowID ? cachedRows.find(({ id }) => id === rowID) : cachedRows[index]
  const nextRow: Row = cachedRow
    ? { ...cachedRow }
    : { id: rowID ?? cachedRows[index]?.id ?? '', isLoading: false }

  if (rowID) {
    nextRow.id = rowID
  }
  if (typeof rowData.blockType === 'string') {
    nextRow.blockType = rowData.blockType
  }

  return nextRow
}

const getPathShape = (path: string): string => {
  return path
    .split('.')
    .map((segment) => (/^\d+$/.test(segment) ? '#' : segment))
    .join('.')
}

const getValueAtPath = (data: Data, segments: string[]): unknown => {
  return segments.reduce<unknown>((value, segment) => {
    if (Array.isArray(value) && /^\d+$/.test(segment)) {
      return value[Number(segment)]
    }
    if (isRecord(value)) {
      return value[segment]
    }

    return undefined
  }, data)
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const scoreTemplatePath = ({
  cachedFormState,
  formData,
  path,
  templatePath,
}: {
  cachedFormState: FormState
  formData: Data
  path: string
  templatePath: string
}): number => {
  const pathSegments = path.split('.')
  const templateSegments = templatePath.split('.')
  let score = path === templatePath ? 5 : 0

  for (let index = 0; index < pathSegments.length; index++) {
    if (!/^\d+$/.test(pathSegments[index] ?? '')) {
      continue
    }

    const currentRow = getValueAtPath(formData, pathSegments.slice(0, index + 1))
    const templateRowPath = templateSegments.slice(0, index + 1).join('.')
    const templateRowID = cachedFormState[`${templateRowPath}.id`]?.value
    const templateBlockType = cachedFormState[`${templateRowPath}.blockType`]?.value

    if (isRecord(currentRow)) {
      if (currentRow.id && templateRowID) {
        score += currentRow.id === templateRowID ? 100 : -20
      }
      if (currentRow.blockType && templateBlockType) {
        score += currentRow.blockType === templateBlockType ? 20 : -100
      }
    }
  }

  return score
}
