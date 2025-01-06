export const redirectTypes = ['301', '302', '303', '307', '308'] as const

export const redirectOptions: { label: string; value: (typeof redirectTypes)[number] }[] = [
  {
    label: '301 - Permanent',
    value: '301',
  },
  {
    label: '302 - Temporary',
    value: '302',
  },
  {
    label: '303 - See Other',
    value: '303',
  },
  {
    label: '307 - Temporary Redirect',
    value: '307',
  },
  {
    label: '308 - Permanent Redirect',
    value: '308',
  },
]
