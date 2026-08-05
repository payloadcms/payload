import type { Access } from '../config/types.js'

const inheritedReadVersionsAccess = new WeakSet<Access>()

export const markInheritedReadVersionsAccess = <TAccess extends Access>(
  access: TAccess,
): TAccess => {
  inheritedReadVersionsAccess.add(access)

  return access
}

export const isInheritedReadVersionsAccess = (access?: Access): boolean =>
  access ? inheritedReadVersionsAccess.has(access) : false
