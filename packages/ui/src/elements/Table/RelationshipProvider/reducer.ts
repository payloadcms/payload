import type { TypeWithID } from 'payload'

import type { Documents } from './index.js'

type RequestDocuments = {
  docs: { relationTo: string; value: number | string }[]
  type: 'REQUEST'
}

type AddLoadedDocuments = {
  docs: TypeWithID[]
  idsToLoad: (number | string)[]
  relationTo: string
  type: 'ADD_LOADED'
}

type Action = AddLoadedDocuments | RequestDocuments

export function reducer(state: Documents, action: Action): Documents {
  switch (action.type) {
    case 'ADD_LOADED': {
      const relatedDocuments = { ...state[action.relationTo] }
      let hasChanges = false
      const loadedDocuments = new Map(action.docs.map((doc) => [String(doc.id), doc]))

      action.idsToLoad.forEach((id) => {
        // Only fill pending entries; prefetched documents are already complete.
        if (relatedDocuments[id] === null) {
          relatedDocuments[id] = loadedDocuments.get(String(id)) ?? false
          hasChanges = true
        }
      })

      return hasChanges ? { ...state, [action.relationTo]: relatedDocuments } : state
    }

    case 'REQUEST': {
      const newState = { ...state }
      let hasChanges = false

      action.docs.forEach(({ relationTo, value }) => {
        if (typeof newState[relationTo] !== 'object') {
          newState[relationTo] = {}
        }
        if (!Object.hasOwn(newState[relationTo], value)) {
          newState[relationTo] = { ...newState[relationTo], [value]: null }
          hasChanges = true
        }
      })

      return hasChanges ? newState : state
    }

    default: {
      return state
    }
  }
}
