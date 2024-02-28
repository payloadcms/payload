export type SearchParamsContext = {
  dispatchSearchParams: (action: Action) => void
  searchParams: qs.ParsedQs
}

export type State = qs.ParsedQs

export type Action = (
  | {
      params: qs.ParsedQs
      type: 'replace'
    }
  | {
      params: qs.ParsedQs
      type: 'set'
    }
  | {
      type: 'clear'
    }
) & {
  /**
   * If true, a new entry will be added to the history stack.
   * If false, current history entry will be overwritten.
   * @default true
   * */
  browserHistory?: 'push' | 'replace'
}
