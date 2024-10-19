'use client'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useState } from 'react'

export default function CopyButton({ code }: { code: string }) {
  const [text, setText] = useState('Copy')

  function updateCopyStatus() {
    if (text === 'Copy') {
      setText(() => 'Copied!')
      setTimeout(() => {
        setText(() => 'Copy')
      }, 1000)
    }
  }

  return (
    <div className="flex justify-end align-middle">
      <Button
        className="flex gap-2 rounded-none"
        variant={'secondary'}
        onClick={async () => {
          await navigator.clipboard.writeText(code)
          updateCopyStatus()
        }}
      >
        <p>{text}</p>
        <Image width={16} height={16} src="/copy-icon.svg" alt="copy" className="dark:invert" />
      </Button>
    </div>
  )
}
