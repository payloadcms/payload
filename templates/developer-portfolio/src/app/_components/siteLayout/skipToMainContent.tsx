import { FC } from 'react'

import { Button } from '../ui/button'

export const SkipToMainContentLink: FC = () => {
  return (
    <a
      href="#main-content"
      className={
        'z-10 bg-primary text-primary-content absolute top-0 p-3 m-3 -translate-y-56 focus:translate-y-0'
      }
    >
      <Button> Skip to Main Content</Button>
    </a>
  )
}
