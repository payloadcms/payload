#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-expect-error
require('ts-node').register({
    "esm": false,
    "swc": true,
});

require('./dist/cjs/bin')
