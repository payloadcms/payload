import React from 'react';
import {
  GetStaticProps,
  GetStaticPropsContext,
} from 'next';
import { VerticalPadding } from '../components/VerticalPadding';
import { Collapsible } from '@faceless-ui/collapsibles'
import { Gutter } from '../components/Gutter';
import { Accordion } from '../components/Accordion';
import { TextArea } from '../components/Textarea';
import type { Setting } from '../../../cms/src/payload-types';

const SettingsPage: React.FC<{
  setting: Setting
}> = (props) => {
  const { setting } = props;
  const [fetchedUserDOB, setFetchedUserDOB] = React.useState<string | undefined>(undefined)

  const fetchUserDOB = React.useCallback(async (): Promise<string | null> => {
    try {
      const req = await fetch(
        `${process.env.NEXT_PUBLIC_CMS_URL}/api/settings/${setting.id}/userDOB`,
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
    <React.Fragment>
      <VerticalPadding
        top='small'
        bottom='small'
      >
        <Gutter>
          <h2>Date of Birth</h2>
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
        </Gutter>
      </VerticalPadding>

    </React.Fragment>
  )
}

export default SettingsPage;

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext,
) => {

  const settingsQuery = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/settings`).then(
    (res) => res.json(),
  );

  return {
    props: {
      setting: settingsQuery.docs[0],
    },
  };
};
