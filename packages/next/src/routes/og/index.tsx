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
                flexGrow: 1,
                fontSize: 50,
                height: '100%',
                overflow: 'hidden',
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
              <p
                style={{
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  display: '-webkit-box',
                  fontSize: 90,
                  lineHeight: 1,
                  marginBottom: 0,
                  marginTop: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </p>
              {description && (
                <p
                  style={{
                    flexGrow: 1,
                    fontSize: 30,
                    marginBottom: 0,
                    marginTop: 40,
                  }}
                >
                  {description}
                </p>
              )}
            </div>
            <div
              style={{
                alignItems: 'flex-end',
                display: 'flex',
                flexShrink: 0,
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
