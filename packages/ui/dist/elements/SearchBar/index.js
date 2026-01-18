import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SearchIcon } from '../../icons/Search/index.js';
import { SearchFilter } from '../SearchFilter/index.js';
import './index.scss';
const baseClass = 'search-bar';
export function SearchBar({
  Actions,
  className,
  label = 'Search...',
  onSearchChange,
  searchQueryParam
}) {
  return /*#__PURE__*/_jsxs("div", {
    className: [baseClass, className].filter(Boolean).join(' '),
    children: [/*#__PURE__*/_jsx(SearchIcon, {}), /*#__PURE__*/_jsx(SearchFilter, {
      handleChange: onSearchChange,
      label: label,
      searchQueryParam: searchQueryParam
    }), Actions && Actions.length > 0 ? /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__actions`,
      children: Actions
    }) : null]
  });
}
//# sourceMappingURL=index.js.map