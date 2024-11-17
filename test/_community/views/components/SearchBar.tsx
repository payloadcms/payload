import { Search } from 'lucide-react'
import React from 'react'

interface SearchBarProps {
  onChange: (value: string) => void
  value: string
}

export const SearchBar: React.FC<SearchBarProps> = ({ onChange, value }) => {
  return (
    <div className="search-bar">
      <Search className="search-bar__icon" />
      <input
        className="search-bar__input"
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search extensions..."
        type="text"
        value={value}
      />
    </div>
  )
}
