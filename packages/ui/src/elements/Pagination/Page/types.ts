export type Props = {
  isCurrent?: boolean
  isFirstPage?: boolean
  isLastPage?: boolean
  page?: number
  updatePage?: (page) => void
}
