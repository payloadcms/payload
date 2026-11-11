'use client'
import { useEffect } from 'react'

const TABS_CHANNEL_NAME = 'payload-upload-sessions'
const TABS_REPLY_TIMEOUT_MS = 300

type TabsMessage =
  | { sessionIDs: string[]; type: 'held' }
  | { sessionIDs: string[]; type: 'whoHolds' }

/** Answers other tabs, so they do not offer to recover an upload this tab is still running. */
export const useAnswerOtherTabs = ({
  getHeldSessionIDs,
}: {
  /** Must be stable; it is read each time another tab asks. */
  getHeldSessionIDs: () => Set<string>
}) => {
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return
    }

    const channel = new BroadcastChannel(TABS_CHANNEL_NAME)

    channel.onmessage = ({ data }: MessageEvent<TabsMessage>) => {
      if (data?.type !== 'whoHolds') {
        return
      }

      const heldSessionIDs = getHeldSessionIDs()
      const sessionIDs = data.sessionIDs.filter((id) => heldSessionIDs.has(id))

      if (sessionIDs.length) {
        channel.postMessage({ type: 'held', sessionIDs } satisfies TabsMessage)
      }
    }

    return () => channel.close()
  }, [getHeldSessionIDs])
}

/** Asks the other open Admin tabs which of these sessions they are still uploading or holding. */
export const findSessionsHeldByOtherTabs = async ({
  sessionIDs,
}: {
  sessionIDs: string[]
}): Promise<Set<string>> => {
  const heldSessionIDs = new Set<string>()

  if (!sessionIDs.length || typeof BroadcastChannel === 'undefined') {
    return heldSessionIDs
  }

  const channel = new BroadcastChannel(TABS_CHANNEL_NAME)

  channel.onmessage = ({ data }: MessageEvent<TabsMessage>) => {
    if (data?.type === 'held') {
      data.sessionIDs.forEach((id) => heldSessionIDs.add(id))
    }
  }

  channel.postMessage({ type: 'whoHolds', sessionIDs } satisfies TabsMessage)
  await new Promise((resolve) => setTimeout(resolve, TABS_REPLY_TIMEOUT_MS))
  channel.close()

  return heldSessionIDs
}
