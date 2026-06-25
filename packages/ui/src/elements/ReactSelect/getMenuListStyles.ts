import type { CSSObjectWithLabel, GroupBase, StylesConfig } from 'react-select'

import type { Option } from './types.js'

type MenuListStyles = NonNullable<StylesConfig<Option, boolean, GroupBase<Option>>['menuList']>

export const getMenuListStyles = (
  externalStyles?: StylesConfig<Option, boolean, GroupBase<Option>>,
): MenuListStyles => {
  return (
    rsStyles: CSSObjectWithLabel,
    state: Parameters<NonNullable<StylesConfig<Option>['menuList']>>[1],
  ) => ({
    ...rsStyles,
    ...externalStyles?.menuList?.(rsStyles, state),
  })
}
