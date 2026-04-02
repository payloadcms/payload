import { SearchIcon } from '../../icons/Search/index.js'
import { SearchFilter } from '../SearchFilter/index.js'
import './index.scss'

const baseClass = 'search-bar'

type SearchBarProps = {
  Actions?: React.ReactNode[]
  className?: string
  label?: string
  onSearchChange: (search: string) => void
  searchQueryParam?: string
}
export function SearchBar({
  Actions,
  className,
  label = 'Search...',
  onSearchChange,
  searchQueryParam,
}: SearchBarProps) {
  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <SearchIcon />
      <SearchFilter
        handleChange={onSearchChange}
        label={label}
        searchQueryParam={searchQueryParam}
      />
      {Actions && Actions.length > 0 ? (
        <div className={`${baseClass}__actions`}>{Actions}</div>
      ) : null}
    </div>
  )
}
