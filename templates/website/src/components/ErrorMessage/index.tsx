'use client'

import React from 'react'

import { CallToActionBlock } from '../../blocks/CallToAction'
import { VerticalPadding } from '../VerticalPadding'

export const ErrorMessage: React.FC<{ error?: string }> = ({ error }) => {
  return (
    <>
      <VerticalPadding>
        <CallToActionBlock
          blockType="cta"
          richText={[
            {
              children: [
                {
                  text: `${error || '404'}`,
                  underline: true,
                  forceDark: true,
                },
              ],
              type: 'h1',
            },
            {
              children: [
                {
                  text: 'Sorry, the page you requested cannot be found.',
                },
              ],
            },
          ]}
          links={[
            {
              link: {
                reference: undefined,
                type: 'custom',
                url: '/',
                label: 'Back To Homepage',
              },
            },
          ]}
        />
      </VerticalPadding>
    </>
  )
}
