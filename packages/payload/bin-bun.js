#!/usr/bin/env bun

const start = async () => {
  const { bin } = await import('./dist/bin/index.js')
  await bin()
}

void start()
