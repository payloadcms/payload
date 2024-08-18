'use client'
import React, { createContext, useCallback, useContext, useRef, useState } from 'react'

import { requests } from '../../utilities/api.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'

type DocumentLockContextType = {
  lockDocument: (docId: number | string) => Promise<void>
  unlockDocument: (docId: number | string) => Promise<void>
}

const DocumentLockContext = createContext<DocumentLockContextType | undefined>(undefined)

export const DocumentLockProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { config } = useConfig()
  const { user } = useAuth()
  const [isLocked, setIsLocked] = useState(false)
  const lockInProgress = useRef(false)

  const {
    routes: { api },
    serverURL,
  } = config

  const lockDocument = useCallback(
    async (docId: number | string) => {
      if (lockInProgress.current) {
        console.log('Lock already in progress, skipping:', docId)
        return
      }

      lockInProgress.current = true

      console.log('Attempting to lock document:', docId)

      try {
        const request = await requests.get(
          `${serverURL}${api}/payload-locks?where[docId][equals]=${docId}`,
        )

        const { docs } = await request.json()

        if (docs.length === 0) {
          await requests.post(`${serverURL}${api}/payload-locks`, {
            body: JSON.stringify({
              _lastEdited: {
                editedAt: new Date(),
                user: { relationTo: user?.collection, value: user?.id },
              },
              docId,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          })
          setIsLocked(true)
          console.log('Document locked')
        } else {
          console.log('Document already locked by this user')
          setIsLocked(true)
        }
      } catch (error) {
        console.error('Failed to lock the document', error)
      } finally {
        lockInProgress.current = false
      }
    },
    [serverURL, api, user],
  )

  const unlockDocument = useCallback(
    async (docId: number | string) => {
      console.log('Attempting to unlock document:', docId)
      if (!isLocked) {
        console.log('Document is not locked, no need to unlock')
        return
      }

      try {
        const request = await requests.get(
          `${serverURL}${api}/payload-locks?where[docId][equals]=${docId}`,
        )

        const { docs } = await request.json()

        if (docs.length > 0) {
          const lockId = docs[0].id
          await requests.delete(`${serverURL}${api}/payload-locks/${lockId}`, {
            headers: {
              'Content-Type': 'application/json',
            },
          })
          setIsLocked(false)
          console.log('Document unlocked')
        } else {
          console.log('No lock found for this user, skipping unlock')
        }
      } catch (error) {
        console.error('Failed to unlock the document', error)
      }
    },
    [serverURL, api, isLocked],
  )

  return (
    <DocumentLockContext.Provider value={{ lockDocument, unlockDocument }}>
      {children}
    </DocumentLockContext.Provider>
  )
}

export const useDocumentLock = (): DocumentLockContextType => useContext(DocumentLockContext)
