export type SearchParamsContext = {
  searchParams: qs.ParsedQs
  stringifyParams: ({ params, replace }: { params: State; replace?: boolean }) => string
}

export type State = qs.ParsedQs
