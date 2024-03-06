export type SearchParamsContext = {
  dispatchSearchParams: (action: Action) => void
  searchParams: qs.ParsedQs
}

export type State = qs.ParsedQs

export type Action = (
  | {
      params: qs.ParsedQs
      type: 'REPLACE'
    }
  | {
      params: qs.ParsedQs
      type: 'SET'
    }
  | {
      type: 'CLEAR'
    }
) & {
  /**
   * `push` will add a new entry to the browser history stack.
   * `replace` will overwrite the browser history entry.
   * @default 'push'
   * */
  browserHistory?: 'push' | 'replace'
}
