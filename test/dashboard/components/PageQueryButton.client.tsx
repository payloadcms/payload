'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation.js'
import { useCallback } from 'react'

type PageQueryButtonProps = {
  currentPage: number
}

export function PageQueryButton({ currentPage }: PageQueryButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleIncrement = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    const newPage = currentPage + 1
    params.set('page', String(newPage))
    router.push(`${pathname}?${params.toString()}`)
  }, [currentPage, pathname, router, searchParams])

  return (
    <button
      onClick={handleIncrement}
      style={{
        backgroundColor: '#2563eb',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        padding: '8px 16px',
      }}
      type="button"
    >
      Increment Page ({currentPage} → {currentPage + 1})
    </button>
  )
}
