import type { CSSObjectWithLabel, GroupBase, StylesConfig } from 'react-select'

import type { Option } from './types.js'

type MenuStyles = NonNullable<StylesConfig<Option, boolean, GroupBase<Option>>['menu']>

type Args = {
  externalStyles?: StylesConfig<Option, boolean, GroupBase<Option>>
  shouldUseFloatingMenuPortal: boolean
}

export const getMenuStyles = ({
  externalStyles,
  shouldUseFloatingMenuPortal,
}: Args): MenuStyles => {
  return (
    rsStyles: CSSObjectWithLabel,
    state: Parameters<NonNullable<StylesConfig<Option>['menu']>>[1],
  ) => {
    const styles: CSSObjectWithLabel = {
      ...rsStyles,
      zIndex: undefined,
      ...(shouldUseFloatingMenuPortal && {
        bottom: undefined,
        position: 'static',
        top: undefined,
      }),
    }

    return {
      ...styles,
      ...externalStyles?.menu?.(styles, state),
    }
  }
}
