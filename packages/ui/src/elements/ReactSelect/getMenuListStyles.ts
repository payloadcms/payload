import type { CSSObjectWithLabel, GroupBase, StylesConfig } from 'react-select'

import type { Option } from './types.js'

type MenuListStyles = NonNullable<StylesConfig<Option, boolean, GroupBase<Option>>['menuList']>

export const getMenuListStyles = (
  externalStyles?: StylesConfig<Option, boolean, GroupBase<Option>>,
  shouldUseFloatingMenuPortal?: boolean,
): MenuListStyles => {
  return (
    rsStyles: CSSObjectWithLabel,
    state: Parameters<NonNullable<StylesConfig<Option>['menuList']>>[1],
  ) => {
    const styles: CSSObjectWithLabel = {
      ...rsStyles,
      ...(shouldUseFloatingMenuPortal && {
        maxHeight: `var(--rs-floating-menu-max-height, ${String(rsStyles.maxHeight)}px)`,
      }),
    }

    return {
      ...styles,
      ...externalStyles?.menuList?.(styles, state),
    }
  }
}
