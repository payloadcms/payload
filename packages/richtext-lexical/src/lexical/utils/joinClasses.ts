'use client'
export function joinClasses(...args: Array<boolean | null | string | undefined>): string {
  return args.filter(Boolean).join(' ')
}
