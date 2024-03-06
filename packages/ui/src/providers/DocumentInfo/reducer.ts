import type { DocumentInfo } from '.'

type SET = {
  payload: Partial<DocumentInfo>
  type: 'SET_DOC_INFO'
}

type SET_TITLE = {
  payload: string
  type: 'SET_DOC_TITLE'
}

type RESET = {
  payload: DocumentInfo
  type: 'RESET_DOC_INFO'
}

type Action = RESET | SET | SET_TITLE

export const documentInfoReducer = (state: DocumentInfo, action: Action): DocumentInfo => {
  switch (action.type) {
    case 'SET_DOC_INFO':
      return {
        ...state,
        ...action.payload,
      }
    case 'SET_DOC_TITLE':
      return {
        ...state,
        title: action.payload,
      }
    case 'RESET_DOC_INFO':
      return {
        ...action.payload,
      }
    default:
      return state
  }
}
