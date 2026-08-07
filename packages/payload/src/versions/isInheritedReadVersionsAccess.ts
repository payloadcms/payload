import type { Access } from '../config/types.js'

const inheritedReadVersionsAccess = Symbol('inheritedReadVersionsAccess')

type InheritedReadVersionsAccess = {
  [inheritedReadVersionsAccess]: true
} & Access

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
