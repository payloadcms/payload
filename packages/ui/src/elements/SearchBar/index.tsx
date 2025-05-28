import { SearchIcon } from '../../icons/Search/index.js'
import { SearchFilter } from '../SearchFilter/index.js'
import './index.scss'

const baseClass = 'search-bar'

type SearchBarProps = {
  Actions?: React.ReactNode[]
  className?: string
  filterKey?: string
  label?: string
  onSearchChange?: (search: string) => void
  searchQueryParam?: string
}
export function SearchBar({
  Actions,
  className,
  filterKey,
  label,
  onSearchChange,
  searchQueryParam,
}: SearchBarProps) {
  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <SearchIcon />
      <SearchFilter
        handleChange={onSearchChange}
        key={filterKey || 'search'}
        label={label}
        searchQueryParam={searchQueryParam}
      />
      {Actions && Actions.length > 0 ? (
        <div className={`${baseClass}__actions`}>{Actions}</div>
      ) : null}
    </div>
  )
}
