'use client'
import { toast } from '@payloadcms/ui'
import React, { useState } from 'react'

import styles from './index.module.scss'

export const RedeployButton: React.FC = () => {
  const [isRedeploying, setIsRedeploying] = useState(false)
  const REDEPLOY_HOOK_URL = process.env.NEXT_PUBLIC_REDEPLOY_HOOK_URL

  const redeploy = async () => {
    if (!REDEPLOY_HOOK_URL) return

    setIsRedeploying(true)

    const res = await fetch(REDEPLOY_HOOK_URL, {
      method: 'POST',
    })
    if (res.ok) {
      toast.success('Documentation synced successfully')
      setIsRedeploying(false)
    } else {
      const data = await res.json()
      toast.error(`Failed to sync documentation: ${data.message}`)
      setIsRedeploying(false)
    }
  }

  if (!REDEPLOY_HOOK_URL) {
    return <React.Fragment />
  }

  return (
    <div>
      <button className={styles.button} disabled={isRedeploying} onClick={redeploy} type="button">
        {isRedeploying ? 'Re-deploying...' : 'Re-deploy website'}
      </button>
    </div>
  )
}
