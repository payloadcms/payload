import type { LexicalEditor } from 'lexical'

export function registerRootDescription({
  descriptionID,
  editor,
}: {
  descriptionID?: string
  editor: LexicalEditor
}) {
  if (!descriptionID) {
    return
  }

  const unregister = editor.registerRootListener((root, previousRoot) => {
    removeDescription({ descriptionID, root: previousRoot })

    if (root) {
      const descriptions = new Set(
        root.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean),
      )

      descriptions.add(descriptionID)
      root.setAttribute('aria-describedby', [...descriptions].join(' '))
    }
  })

  return () => {
    unregister()
    removeDescription({ descriptionID, root: editor.getRootElement() })
  }
}

function removeDescription({
  descriptionID,
  root,
}: {
  descriptionID: string
  root: HTMLElement | null
}) {
  if (!root) {
    return
  }

  const descriptions = root
    .getAttribute('aria-describedby')
    ?.split(/\s+/)
    .filter((id) => id && id !== descriptionID)

  if (descriptions?.length) {
    root.setAttribute('aria-describedby', descriptions.join(' '))
  } else {
    root.removeAttribute('aria-describedby')
  }
}
