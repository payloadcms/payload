import type { NextRequest } from 'next/server.js'

import { ImageResponse } from 'next/og.js'
import { NextResponse } from 'next/server.js'
import React from 'react'

export const runtime = 'edge'

export function GET(req: NextRequest): ImageResponse {
  try {
    const { searchParams } = new URL(req.url)

    const hasTitle = searchParams.has('title')
    const title = hasTitle ? searchParams.get('title')?.slice(0, 100) : ''
    const titlePerWord = title?.trim()?.split(' ')
    const hasTopic = searchParams.has('topic')
    const topic = hasTopic ? searchParams.get('topic')?.slice(0, 100).replace('-', ' ') : ''

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: '#000',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'NeueMontreal',
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
            {topic && topic}
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
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {/* <img
              alt="Payload CMS"
              height="70"
              src={`${process.env.NEXT_PUBLIC_SITE_URL}/images/fullLogo.png`}
              width="300"
            /> */}
            <div
              style={{
                fontFamily: 'Roboto',
                fontSize: 20,
                letterSpacing: '4px',
                textTransform: 'uppercase',
              }}
            >
              Documentation
            </div>
          </div>
        </div>
        // {
        //   fonts: [
        //     {
        //       name: 'NeueMontreal',
        //       data: neueMontreal,
        //     },
        //     {
        //       name: 'Roboto',
        //       data: roboto,
        //     },
        //   ],
        //   height: 630,
        //   width: 1200,
        // },
      ),
    )
  } catch (e: any) {
    console.error(`${e.message}`) // eslint-disable-line no-console
    return NextResponse.error()
  }
}
