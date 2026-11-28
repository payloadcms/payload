import { test } from '../__helpers/int/vitest.js'
import { storageR2Tests } from './storageR2Tests.js'

test.suite('@payloadcms/storage-r2', { config: './config.ts' }, storageR2Tests)
