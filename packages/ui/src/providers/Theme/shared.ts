export type Theme = 'dark' | 'light'

export const defaultTheme: Theme = 'light'

export type TypeSize = 'current' | 'proposed'

export const getTypeSize = ({ value }: { value: null | string | undefined }): TypeSize =>
  value === 'current' || value === 'small' ? 'current' : 'proposed'

export type EditViewWidth = '960' | '1200' | '1440' | 'full'

export const getEditViewWidth = ({ value }: { value: null | string | undefined }): EditViewWidth =>
  value === '960' || value === '1200' || value === '1440' ? value : 'full'
