import type { NextRequest } from 'next/server.js'
import type { SanitizedConfig } from 'payload/types'

import { PayloadIcon } from '@payloadcms/ui/graphics/Icon'
import fs from 'fs/promises'
import { ImageResponse } from 'next/og.js'
import { NextResponse } from 'next/server.js'
import path from 'path'
import React from 'react'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const runtime = 'nodejs'

export const contentType = 'image/png'

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
      const description = searchParams.has('description') ? searchParams.get('description') : ''
      const Icon = config.admin?.components?.graphics?.Icon || PayloadIcon

      let fontData

      try {
        fontData = fs.readFile(path.join(dirname, 'roboto-regular.woff'))
      } catch (e) {
        console.error(`Error reading font file or not readable: ${e.message}`) // eslint-disable-line no-console
      }

      const fontFamily = 'Roboto, sans-serif'

      return new ImageResponse(
        (
          <div
            style={{
              backgroundColor: '#000',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              fontFamily,
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
              {leader && (
                <div
                  style={{
                    fontSize: 30,
                    marginBottom: 10,
                  }}
                >
                  {leader}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  fontSize: 90,
                  lineHeight: 0.8,
                  marginTop: '10px,',
                }}
              >
                {titlePerWord?.map((word, i) => {
                  return (
                    <span
                      key={i}
                      style={{
                        color: 'white',
                        display: 'flex',
                        paddingRight: '15px',
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: '#222222',
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
              {description && (
                <div
                  style={{
                    fontSize: 30,
                    marginTop: 40,
                  }}
                >
                  {description}
                </div>
              )}
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
          ...(fontData
            ? {
                fonts: [
                  {
                    name: 'Roboto',
                    data: await fontData,
                    style: 'normal',
                    weight: 400,
                  },
                ],
              }
            : {}),
          height: 630,
          width: 1200,
        },
      )
    } catch (e: any) {
      console.error(`${e.message}`) // eslint-disable-line no-console
      return NextResponse.json({ error: `Internal Server Error: ${e.message}` }, { status: 500 })
    }
  }
