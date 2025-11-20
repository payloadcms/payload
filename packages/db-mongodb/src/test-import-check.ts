import type { Connection } from 'mongoose'
import { mongoose } from '@payloadcms/db-mongodb/server-externals'

const x: Connection = mongoose.connection
