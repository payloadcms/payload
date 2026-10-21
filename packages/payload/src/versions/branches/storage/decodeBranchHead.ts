import type {
  BranchContentScope,
  BranchHead,
  BranchHeadID,
  BranchHeadState,
  BranchHeadToken,
  BranchVersionReference,
} from '../types.js'

export const decodeBranchHead = ({
  branchID,
  row,
  scope,
}: {
  branchID: BranchHeadID
  row: Record<string, unknown>
  scope: BranchContentScope
}): BranchHead => {
  const generation = getGeneration({ value: row.generation })
  let state: BranchHeadState

  if (row.state === 'withdrawn') {
    if (
      row.versionID != null ||
      row.versionGeneration != null ||
      row.structureVersionID != null ||
      row.structureVersionGeneration != null
    ) {
      throw new Error('A withdrawn branch head cannot reference version content.')
    }

    state = { type: 'withdrawn' }
  } else if (row.state === 'version') {
    state = {
      type: 'version',
      structure:
        row.structureVersionID == null && row.structureVersionGeneration == null
          ? null
          : getVersion({ id: row.structureVersionID, generation: row.structureVersionGeneration }),
      version: getVersion({ id: row.versionID, generation: row.versionGeneration }),
    }
  } else {
    throw new Error('Invalid branch head state.')
  }

  return {
    base: row.base == null ? null : getBase({ value: row.base }),
    branchID,
    generation,
    ...(row.incarnation === undefined
      ? {}
      : { incarnation: getIncarnation({ value: row.incarnation }) }),
    scope,
    state,
  }
}

const getGeneration = ({ value }: { value: unknown }): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new Error('Branch head and version generations must be positive safe integers.')
  }

  return value
}

const getVersion = ({
  id,
  generation,
}: {
  generation: unknown
  id: unknown
}): BranchVersionReference => {
  if (
    (typeof id !== 'number' || !Number.isSafeInteger(id)) &&
    (typeof id !== 'string' || !id.length)
  ) {
    throw new Error('Invalid branch version identity.')
  }

  return { id, generation: getGeneration({ value: generation }) }
}

const getBase = ({ value }: { value: unknown }): BranchHeadToken => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid branch base token.')
  }

  const base = value as Record<string, unknown>
  const branchID = base.branchID
  const rawScope = base.scope

  if (
    ((typeof branchID !== 'number' || !Number.isSafeInteger(branchID)) &&
      (typeof branchID !== 'string' || !branchID.length)) ||
    !rawScope ||
    typeof rawScope !== 'object' ||
    Array.isArray(rawScope)
  ) {
    throw new Error('Invalid branch base identity or scope.')
  }

  const scopeData = rawScope as Record<string, unknown>
  let scope: BranchContentScope

  if (scopeData.type === 'shared') {
    scope = { type: 'shared' }
  } else if (
    scopeData.type === 'locale' &&
    typeof scopeData.locale === 'string' &&
    scopeData.locale.length
  ) {
    scope = { type: 'locale', locale: scopeData.locale }
  } else {
    throw new Error('Invalid branch base scope.')
  }

  const incarnation =
    base.incarnation === undefined
      ? {}
      : { incarnation: getIncarnation({ value: base.incarnation }) }

  if (base.generation === null && base.state === null) {
    return { branchID, generation: null, ...incarnation, scope, state: null }
  }

  const rawState = base.state

  if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) {
    throw new Error('Invalid branch base state.')
  }

  const state = rawState as Record<string, unknown>
  let decodedState: BranchHeadState

  if (state.type === 'withdrawn') {
    decodedState = { type: 'withdrawn' }
  } else if (state.type === 'version') {
    const version = state.version as BranchVersionReference | undefined
    const structure = state.structure as BranchVersionReference | null | undefined

    decodedState = {
      type: 'version',
      structure:
        structure === null
          ? null
          : getVersion({ id: structure?.id, generation: structure?.generation }),
      version: getVersion({ id: version?.id, generation: version?.generation }),
    }
  } else {
    throw new Error('Invalid branch base state.')
  }

  return {
    branchID,
    generation: getGeneration({ value: base.generation }),
    ...incarnation,
    scope,
    state: decodedState,
  }
}

const getIncarnation = ({ value }: { value: unknown }): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('Branch incarnation must be a nonnegative safe integer.')
  }

  return value
}
