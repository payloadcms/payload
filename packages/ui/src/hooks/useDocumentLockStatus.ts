import { useEffect, useState } from 'react'

import { useConfig } from '../providers/Config/index.js'
import { requests } from '../utilities/api.js'

export const useDocumentLockStatus = (docId) => {
  const [isLocked, setIsLocked] = useState(false)
  const { config } = useConfig()

  useEffect(() => {
    const checkLockStatus = async () => {
      try {
        const request = await requests.get(
          `${config.serverURL}${config.routes.api}/payload-locks?where[docId][equals]=${docId}`,
        )

        const { docs } = await request.json()

        if (docs.length > 0) {
          setIsLocked(true)
        } else {
          setIsLocked(false)
        }
      } catch (error) {
        console.error('Failed to check the lock status of the document', error)
        setIsLocked(false)
      }
    }

    if (docId) {
      void checkLockStatus()
    }
  }, [docId, config.serverURL, config.routes.api])

  return isLocked
}
