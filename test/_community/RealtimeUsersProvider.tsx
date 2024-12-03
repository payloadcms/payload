'use client'

import { PayloadSDK } from '@payloadcms/sdk'
import { useAuth } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

const sdk = new PayloadSDK({
  baseInit: { credentials: 'include' },
  baseURL: 'http://localhost:3000/api',
})

export const RealtimeUsersProvider = ({ children }) => {
  const { user } = useAuth()
  const [userPositions, setUserPositions] = useState<{ email: string; x: number; y: number }[]>([])
  const debounceTimeout = useRef<null | number>(null)

  useEffect(() => {
    let unsubscribe: (() => Promise<void>) | undefined = undefined

    // Emit user connection event
    void sdk.realtime.emitEvent({
      data: user,
      event: 'userConnected',
    })

    const subscribe = async () => {
      if (!user) {
        return
      }

      const result = await sdk.realtime.subscribe(({ data, event }) => {
        if (event === 'userMouseMove' && data.email !== user.email) {
          setUserPositions((prev) => {
            const updated = [...prev.filter((pos) => pos.email !== data.email), data]
            return updated
          })
        }
      })

      unsubscribe = result.unsubscribe
    }

    void subscribe()

    return () => {
      if (unsubscribe) {
        void unsubscribe()
      }
    }
  }, [user])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!user) {
        return
      }

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }

      debounceTimeout.current = window.setTimeout(() => {
        sdk.realtime.emitEvent({
          data: { email: user.email, x: e.clientX, y: e.clientY },
          event: 'userMouseMove',
        })
      }, 10) // Adjust debounce delay as needed
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [user])

  return (
    <>
      {userPositions.map(({ email, x, y }) => (
        <div
          key={email}
          style={{
            backgroundColor: 'rgba(0, 150, 255, 0.8)',
            borderRadius: '8px',
            color: '#fff',
            left: x,
            padding: '5px 10px',
            pointerEvents: 'none', // Prevent interfering with user interactions
            position: 'fixed', // Changed to fixed
            top: y,
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            zIndex: 1000, // Ensure it's above other elements
          }}
        >
          {email}
        </div>
      ))}
      <pre>{JSON.stringify(userPositions, null, 2)}</pre> {/* Debug rendered positions */}
      {children}
    </>
  )
}
