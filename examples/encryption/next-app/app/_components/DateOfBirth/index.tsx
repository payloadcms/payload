'use client'

import React, { Fragment, useState } from 'react';
import { Collapsible } from '@faceless-ui/collapsibles'
import { User } from '../../../payload-types';
import { Accordion } from '../Accordion'
import { TextArea } from '../Textarea';

export const DateOfBirth: React.FC<{
  user: User
}> = ({ user }) => {
  const [fetchedUserDOB, setFetchedUserDOB] = useState<string | undefined>(undefined)

  const fetchUserDOB = React.useCallback(async (): Promise<string | null> => {
    try {
      const req = await fetch(
        `${process.env.NEXT_PUBLIC_CMS_URL}/api/users/${user?.id}/userDOB`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      const res = await req.json()
      setFetchedUserDOB(res.value)

    } catch (e) {
      console.error(e) // eslint-disable-line no-console
    }
    return null
  }, [])

  return (
    <Fragment>
      <Collapsible>
        <Accordion
          onToggle={fetchUserDOB}
          label={
            <>
              <div>••••••••••••</div>
            </>
          }
        >
          <TextArea value={fetchedUserDOB} disabled />
        </Accordion>
      </Collapsible>
    </Fragment>
  )
}
