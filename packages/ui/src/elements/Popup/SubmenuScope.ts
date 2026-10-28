export type SubmenuNode = {
  closeBranch: () => void
  id: string
  isPointerProtected?: () => boolean
  open: (viaKeyboard: boolean) => void
}

export type SubmenuScope = {
  activeChildId: null | string
  closeActiveBranch: () => void
  register: (node: SubmenuNode) => () => void
  release: (id: string) => void
  requestOpen: (args: { id: string; viaKeyboard?: boolean; viaPointer?: boolean }) => void
}

export const createSubmenuScope = (): SubmenuScope => {
  const nodes = new Map<string, SubmenuNode>()
  let activeChildId: null | string = null

  return {
    get activeChildId() {
      return activeChildId
    },
    closeActiveBranch: () => {
      nodes.get(activeChildId ?? '')?.closeBranch()
      activeChildId = null
    },
    register: (node) => {
      nodes.set(node.id, node)
      return () => {
        if (activeChildId === node.id) {
          activeChildId = null
        }
        nodes.delete(node.id)
      }
    },
    release: (id) => {
      if (activeChildId === id) {
        activeChildId = null
      }
    },
    requestOpen: ({ id, viaKeyboard = false, viaPointer = false }) => {
      if (activeChildId === id) {
        return
      }
      const node = nodes.get(id)
      const activeNode = nodes.get(activeChildId ?? '')

      if (!node || (viaPointer && activeNode?.isPointerProtected?.())) {
        return
      }
      activeNode?.closeBranch()
      activeChildId = id
      node.open(viaKeyboard)
    },
  }
}
