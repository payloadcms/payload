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
      const newState = { ...state }
      if (typeof newState[action.relationTo] !== 'object') {
        newState[action.relationTo] = {}
      }
      const unreturnedIDs = [...action.idsToLoad]

      if (Array.isArray(action.docs)) {
        action.docs.forEach((doc) => {
          unreturnedIDs.splice(unreturnedIDs.indexOf(doc.id), 1)
          newState[action.relationTo][doc.id] = doc
        })
      }

      unreturnedIDs.forEach((id) => {
        newState[action.relationTo][id] = false
      })

      return newState
    }

    case 'REQUEST': {
      const newState = { ...state }

      action.docs.forEach(({ relationTo, value }) => {
        if (typeof newState[relationTo] !== 'object') {
          newState[relationTo] = {}
        }
        newState[relationTo][value] = null
      })

      return newState
    }

    default: {
      return state
    }
  }
}
