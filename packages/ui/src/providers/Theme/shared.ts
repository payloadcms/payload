export type Theme = 'dark' | 'light'

export const defaultTheme: Theme = 'light'

export type TypeSize = 'current' | 'proposed'

export const getTypeSize = ({ value }: { value: null | string | undefined }): TypeSize =>
  value === 'current' || value === 'small' ? 'current' : 'proposed'

export type EditViewWidth = '640' | '800' | '960' | 'full'

export const getEditViewWidth = ({ value }: { value: null | string | undefined }): EditViewWidth =>
  value === '640' || value === '800' || value === '960' ? value : 'full'
