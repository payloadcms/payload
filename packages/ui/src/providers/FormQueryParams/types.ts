import type { UploadEdits } from 'payload'

export type FormQueryParamsContext = {
  dispatchFormQueryParams: (action: Action) => void
  formQueryParams: State
}

export type State = {
  depth: number
  'fallback-locale': string
  locale: string
  uploadEdits?: UploadEdits
}

export type Action = {
  params: Partial<State>
  type: 'SET'
}
