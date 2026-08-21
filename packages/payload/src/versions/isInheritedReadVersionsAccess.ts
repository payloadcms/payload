import type { Access, AccessArgs } from '../config/types.js'

const inheritedReadVersionsAccess = Symbol('inheritedReadVersionsAccess')
const inheritedReadVersionsParentID = Symbol('inheritedReadVersionsParentID')

type InheritedReadVersionsAccess = {
  [inheritedReadVersionsAccess]: true
} & Access

type InheritedReadVersionsAccessArgs = {
  [inheritedReadVersionsParentID]?: AccessArgs['id']
} & AccessArgs

export const markInheritedReadVersionsAccess = <TAccess extends Access>(
  access: TAccess,
): TAccess => {
  Object.defineProperty(access, inheritedReadVersionsAccess, { value: true })

  return access
}

export const isInheritedReadVersionsAccess = (access?: Access): boolean =>
  Boolean(
    access &&
      (access as Partial<InheritedReadVersionsAccess>)[inheritedReadVersionsAccess] === true,
  )

export const resolveInheritedReadVersionsAccessArgs = (args: AccessArgs): AccessArgs => {
  const inheritedArgs = args as InheritedReadVersionsAccessArgs

  if (!(inheritedReadVersionsParentID in inheritedArgs)) {
    return args
  }

  const readArgs = {
    ...args,
    id: inheritedArgs[inheritedReadVersionsParentID],
  } as InheritedReadVersionsAccessArgs

  delete readArgs[inheritedReadVersionsParentID]

  return readArgs
}

export const withInheritedReadVersionsParentID = (
  args: AccessArgs,
  parentID: AccessArgs['id'],
): AccessArgs => {
  const inheritedArgs: InheritedReadVersionsAccessArgs = {
    ...args,
    [inheritedReadVersionsParentID]: parentID,
  }

  return inheritedArgs
}
