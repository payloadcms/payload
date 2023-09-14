export type Props = {
  disableHistoryChange?: boolean
  hasNextPage?: boolean
  hasPrevPage?: boolean
  limit?: number
  nextPage?: number
  numberOfNeighbors?: number
  onChange?: (page: number) => void
  page?: number
  prevPage?: number
  totalPages?: number
}

export type Node =
  | {
      props?: {
        direction?: 'left' | 'right'
        isDisabled?: boolean
        isFirstPage?: boolean
        isLastPage?: boolean
        page?: number
        updatePage: (page?: number) => void
      }
      type: 'ClickableArrow' | 'Page' | 'Separator'
    }
  | number
