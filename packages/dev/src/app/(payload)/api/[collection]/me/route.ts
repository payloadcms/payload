/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY it because it could be re-written at any time. */
import { me } from '@payloadcms/next/routes/me'
import { NextRequest, NextResponse } from 'next/server'
import config from 'payload-config'

export const GET = async (req: NextRequest, res: NextResponse, params: { collection: string }) =>
  me({ config, req, res, params })
