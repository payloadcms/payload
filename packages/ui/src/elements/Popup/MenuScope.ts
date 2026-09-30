export type SubmenuNode = {
  closeBranch: () => void
  id: string
  open: (viaKeyboard: boolean) => void
}

export type MenuScope = {
  activeChildId: null | string
  cancelPending: (id?: string) => void
  closeActiveBranch: () => void
  register: (node: SubmenuNode) => () => void
  requestOpen: (args: { delay: boolean; id: string; viaKeyboard?: boolean }) => void
}

const HOVER_OPEN_DELAY = 150

export const createMenuScope = (): MenuScope => {
  const nodes = new Map<string, SubmenuNode>()
  let activeChildId: null | string = null
  let pendingChildId: null | string = null
  let pendingTimer: ReturnType<typeof setTimeout> | undefined

  const cancelPending = (id?: string) => {
    if (id && pendingChildId !== id) {
      return
    }

    if (pendingTimer) {
      clearTimeout(pendingTimer)
    }
    pendingTimer = undefined
    pendingChildId = null
  }

  const activate = ({ id, viaKeyboard = false }: { id: string; viaKeyboard?: boolean }) => {
    cancelPending()
    const node = nodes.get(id)
    if (!node) {
      return
    }

    if (activeChildId !== id) {
      nodes.get(activeChildId ?? '')?.closeBranch()
      activeChildId = id
    }
    node.open(viaKeyboard)
  }

  return {
    get activeChildId() {
      return activeChildId
    },
    cancelPending,
    closeActiveBranch: () => {
      cancelPending()
      nodes.get(activeChildId ?? '')?.closeBranch()
      activeChildId = null
    },
    register: (node) => {
      nodes.set(node.id, node)
      return () => {
        cancelPending(node.id)
        if (activeChildId === node.id) {
          activeChildId = null
        }
        nodes.delete(node.id)
      }
    },
    requestOpen: ({ id, delay, viaKeyboard = false }) => {
      if (!delay) {
        activate({ id, viaKeyboard })
        return
      }

      if (activeChildId === id) {
        cancelPending()
        return
      }

      cancelPending()
      pendingChildId = id
      pendingTimer = setTimeout(() => {
        pendingTimer = undefined
        pendingChildId = null
        activate({ id, viaKeyboard })
      }, HOVER_OPEN_DELAY)
    },
  }
}
