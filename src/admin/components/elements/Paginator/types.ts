export type Props = {
  limit: number,
  totalPages: number,
  page: number,
  hasPrevPage: boolean,
  hasNextPage: boolean,
  prevPage: number,
  nextPage: number,
  numberOfNeighbors: number,
  disableHistoryChange: boolean,
  onChange: () => void,
}
