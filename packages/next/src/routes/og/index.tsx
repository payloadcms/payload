import type { NextRequest } from 'next/server.js'
import type { SanitizedConfig } from 'payload/types'

import { PayloadIcon } from '@payloadcms/ui/graphics/Icon'
import { Roboto } from 'next/font/google'
import { ImageResponse } from 'next/og.js'
import { NextResponse } from 'next/server.js'
import React from 'react'

const roboto = Roboto({
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['400', '900'],
})

export const runtime = 'edge'

export const OG_GET =
  (configPromise: Promise<SanitizedConfig>) =>
  async (req: NextRequest): Promise<ImageResponse> => {
    try {
      const { searchParams } = new URL(req.url)
      const config = await configPromise

      const hasTitle = searchParams.has('title')
      const title = hasTitle ? searchParams.get('title')?.slice(0, 100) : ''
      const titlePerWord = title?.trim()?.split(' ')
      const hasLeader = searchParams.has('leader')
      const leader = hasLeader ? searchParams.get('leader')?.slice(0, 100).replace('-', ' ') : ''
      const Icon = config.admin?.components?.graphics?.Icon || PayloadIcon

      return new ImageResponse(
        (
          <div
            className={roboto.variable}
            style={{
              backgroundColor: '#000',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'var(--font-roboto)',
              height: '100%',
              justifyContent: 'space-between',
              padding: '100px',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: 50,
                textTransform: 'capitalize',
              }}
            >
              {leader && leader}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  fontSize: 90,
                  lineHeight: 1,
                  marginTop: '10px,',
                }}
              >
                {titlePerWord?.map((word, i) => {
                  return (
                    <span
                      key={i}
                      style={{
                        color: '#B6FFE0',
                        display: 'flex',
                        paddingRight: '15px',
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: '#1B2622',
                          bottom: 0,
                          content: ' ',
                          left: -15,
                          position: 'absolute',
                          right: 0,
                          top: 55,
                        }}
                      />
                      {word}
                    </span>
                  )
                })}
              </div>
            </div>
            <div
              style={{
                alignItems: 'flex-end',
                display: 'flex',
                height: '38px',
                justifyContent: 'center',
                width: '38px',
              }}
            >
              <Icon fill="white" />
            </div>
          </div>
        ),
        {
          fonts: [
            {
              name: 'Roboto',
              data: roboto,
            },
          ],
          height: 630,
          width: 1200,
        },
      )
    } catch (e: any) {
      console.error(`${e.message}`) // eslint-disable-line no-console
      return NextResponse.error()
    }
  }
