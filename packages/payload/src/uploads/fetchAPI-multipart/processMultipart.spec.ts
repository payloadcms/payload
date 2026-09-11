import fs from 'fs'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { describe, expect, it, vi } from 'vitest'

import { processMultipartFormdata } from './index.js'

const requestFor = async (form: FormData) => {
  const response = new Response(form)
  return new Request('http://localhost/api/media', {
    body: await response.arrayBuffer(),
    headers: { 'content-type': response.headers.get('content-type')! },
    method: 'POST',
  })
}
const fileForm = (size: number) => {
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(size)]), 'sample.bin')
  return form
}

describe('multipart limits', () => {
  it('should reject files above the default size with a partial limit override', async () => {
    await expect(
      processMultipartFormdata({
        options: { limits: { fields: 2 } },
        request: await requestFor(fileForm(20 * 1024 * 1024 + 1)),
      }).then(() => 'accepted'),
    ).rejects.toMatchObject({ status: 413 })
  })

  it.each([
    {
      kind: 'files',
      count: 3,
      append: ({ form, index }: { form: FormData; index: number }) =>
        form.append('file', new Blob(['sample']), `sample-${index}.txt`),
    },
    {
      kind: 'fields',
      count: 3,
      append: ({ form, index }: { form: FormData; index: number }) =>
        form.append(`field${index}`, 'sample'),
    },
  ])('should reject requests above the configured $kind count', async ({ kind, count, append }) => {
    const form = new FormData()
    for (let i = 0; i < count; i++) {
      append({ form, index: i })
    }
    await expect(
      processMultipartFormdata({
        options: { limits: { [kind]: 2 } },
        request: await requestFor(form),
      }),
    ).rejects.toMatchObject({ status: 413 })
  })

  it('should preserve explicitly requested file truncation', async () => {
    const result = await processMultipartFormdata({
      options: { abortOnLimit: false, limits: { fileSize: 3 } },
      request: await requestFor(fileForm(6)),
    })
    expect(result.files.file).toMatchObject({ size: 3, truncated: true })
  })

  it('should preserve an explicitly unlimited file size', async () => {
    const size = 20 * 1024 * 1024 + 1
    const result = await processMultipartFormdata({
      options: { limits: { fileSize: Infinity } },
      request: await requestFor(fileForm(size)),
    })
    expect(result.files.file).toMatchObject({ size, truncated: false })
  })

  it('should parse ordinary files', async () => {
    const result = await processMultipartFormdata({ request: await requestFor(fileForm(6)) })

    expect(result.files.file.size).toBe(6)
  })

  it('should parse ordinary fields', async () => {
    const form = new FormData()
    form.append('_payload', '{"title":"Sample"}')
    const result = await processMultipartFormdata({ request: await requestFor(form) })

    expect(result.fields._payload).toBe('{"title":"Sample"}')
  })
})

describe('multipart streaming', () => {
  it('should cancel an unfinished body promptly when a file reaches its limit', async () => {
    let cancelled = false
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          Buffer.from(
            '--sample\r\nContent-Disposition: form-data; name="file"; filename="sample.txt"\r\nContent-Type: text/plain\r\n\r\nsample data',
          ),
        )
      },
      cancel() {
        cancelled = true
      },
    })
    const request = new Request('http://localhost/api/media', {
      body,
      duplex: 'half',
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=sample' },
    } as RequestInit)
    await expect(
      processMultipartFormdata({ options: { limits: { fileSize: 3 } }, request }),
    ).rejects.toMatchObject({ status: 413 })
    expect(cancelled).toBe(true)
  }, 1000)

  it.each([
    {
      kind: 'files',
      count: 4,
      append: ({ form, index }: { form: FormData; index: number }) =>
        form.append('file', new Blob(['sample']), `sample-${index}.txt`),
    },
    {
      kind: 'fields',
      count: 21,
      append: ({ form, index }: { form: FormData; index: number }) =>
        form.append(`field${index}`, 'sample'),
    },
  ])(
    'should enforce the default $kind count with another limit overridden',
    async ({ count, append }) => {
      const form = new FormData()
      for (let i = 0; i < count; i++) {
        append({ form, index: i })
      }
      await expect(
        processMultipartFormdata({
          options: { limits: { fileSize: 100 } },
          request: await requestFor(form),
        }).then(() => 'accepted'),
      ).rejects.toMatchObject({ status: 413 })
    },
  )

  it('should accept an explicitly increased file count', async () => {
    const form = new FormData()
    for (let i = 0; i < 11; i++) form.append(`file${i}`, new Blob(['sample']), `sample-${i}.txt`)
    const result = await processMultipartFormdata({
      options: { limits: { files: 11 } },
      request: await requestFor(form),
    })
    expect(Object.keys(result.files)).toHaveLength(11)
  })

  it('should reject oversized fields', async () => {
    const form = new FormData()
    form.append('title', 'sample')
    await expect(
      processMultipartFormdata({
        options: { limits: { fieldSize: 3 } },
        request: await requestFor(form),
      }),
    ).rejects.toMatchObject({ status: 413 })
  })

  it('should reject requests above the configured part count', async () => {
    const form = fileForm(6)
    form.append('title', 'sample')
    await expect(
      processMultipartFormdata({
        options: { limits: { parts: 1 } },
        request: await requestFor(form),
      }),
    ).rejects.toMatchObject({ status: 413 })
  })

  it('should remove completed and partial temporary files after a limit', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'multipart-'))
    try {
      const form = new FormData()
      form.append('first', new Blob(['ok']), 'first.txt')
      form.append('second', new Blob(['sample']), 'second.txt')
      await expect(
        processMultipartFormdata({
          options: { limits: { fileSize: 3 }, tempFileDir: directory, useTempFiles: true },
          request: await requestFor(form),
        }),
      ).rejects.toMatchObject({ status: 413 })
      expect(await readdir(directory)).toEqual([])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('should flush ordinary temporary files before returning', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'multipart-'))
    try {
      const result = await processMultipartFormdata({
        options: { tempFileDir: directory, useTempFiles: true },
        request: await requestFor(fileForm(100_000)),
      })
      expect((await readFile(result.files.file.tempFilePath!)).length).toBe(100_000)
      expect(result.files.file.data.length).toBe(0)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('should reject incomplete multipart data without waiting for upload timers', async () => {
    const request = new Request('http://localhost/api/media', {
      body: '--sample\r\nContent-Disposition: form-data; name="file"; filename="sample.txt"\r\n\r\nsample',
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=sample' },
    })
    await expect(processMultipartFormdata({ request })).rejects.toThrow()
  }, 1000)
})

describe('multipart completion', () => {
  it('should finish an empty temporary file part', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'multipart-'))
    try {
      const request = new Request('http://localhost/api/media', {
        body: '--sample\r\nContent-Disposition: form-data; name="file"; filename=""\r\nContent-Type: application/octet-stream\r\n\r\n\r\n--sample--\r\n',
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data; boundary=sample' },
      })
      const result = await processMultipartFormdata({
        options: { tempFileDir: directory, useTempFiles: true },
        request,
      })
      expect(result.files).toBeUndefined()
      expect(await readdir(directory)).toEqual([])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 1000)

  it('should cancel a stalled upload on timeout', async () => {
    let cancelled = false
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          Buffer.from(
            '--sample\r\nContent-Disposition: form-data; name="file"; filename="sample.txt"\r\nContent-Type: text/plain\r\n\r\nsample',
          ),
        )
      },
      cancel() {
        cancelled = true
      },
    })
    const request = new Request('http://localhost/api/media', {
      body,
      duplex: 'half',
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=sample' },
    } as RequestInit)
    await expect(
      processMultipartFormdata({ options: { uploadTimeout: 10 }, request }),
    ).rejects.toThrow('Upload timeout')
    expect(cancelled).toBe(true)
  }, 1000)

  it('should preserve defaults for undefined limit values', async () => {
    await expect(
      processMultipartFormdata({
        options: { abortOnLimit: undefined, limits: { fileSize: undefined } },
        request: await requestFor(fileForm(20 * 1024 * 1024 + 1)),
      }).then(() => 'accepted'),
    ).rejects.toMatchObject({ status: 413 })
  })
})

it('should wait for temporary file backpressure before reading more body chunks', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'multipart-'))
  const createWriteStream = fs.createWriteStream
  let releaseWrite: () => void
  let startedWrite: () => void
  const gate = new Promise<void>((resolve) => {
    releaseWrite = resolve
  })
  const started = new Promise<void>((resolve) => {
    startedWrite = resolve
  })
  const spy = vi.spyOn(fs, 'createWriteStream').mockImplementation((filePath) => {
    const stream = createWriteStream(filePath, { highWaterMark: 1 })
    const write = stream._write.bind(stream)
    stream._write = (chunk, encoding, callback) => {
      startedWrite()
      void gate.then(() => write(chunk, encoding, callback))
    }
    const writev = stream._writev!.bind(stream)
    stream._writev = (chunks, callback) => {
      startedWrite()
      void gate.then(() => writev(chunks, callback))
    }
    return stream
  })
  let pulls = 0
  const body = new ReadableStream({
    pull(controller) {
      pulls++
      if (pulls === 1)
        controller.enqueue(
          Buffer.from(
            '--sample\r\nContent-Disposition: form-data; name="file"; filename="sample.bin"\r\nContent-Type: application/octet-stream\r\n\r\n',
          ),
        )
      else if (pulls <= 17) controller.enqueue(Buffer.alloc(64 * 1024))
      else {
        controller.enqueue(Buffer.from('\r\n--sample--\r\n'))
        controller.close()
      }
    },
  })
  const request = new Request('http://localhost/api/media', {
    body,
    duplex: 'half',
    method: 'POST',
    headers: { 'content-type': 'multipart/form-data; boundary=sample' },
  } as RequestInit)
  const parsing = processMultipartFormdata({
    options: { tempFileDir: directory, useTempFiles: true },
    request,
  })
  try {
    await started
    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(pulls).toBeLessThanOrEqual(4)
  } finally {
    releaseWrite!()
    try {
      const result = await parsing
      expect((await readFile(result.files.file.tempFilePath!)).length).toBe(1024 * 1024)
    } finally {
      spy.mockRestore()
      await rm(directory, { recursive: true, force: true })
    }
  }
})

it('should reject temporary file write errors and release the request', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'multipart-'))
  try {
    const destination = path.join(directory, 'sample.txt')
    await writeFile(destination, 'sample')
    const request = await requestFor(fileForm(100_000))
    await expect(
      processMultipartFormdata({
        options: { tempFileDir: destination, useTempFiles: true },
        request,
      }),
    ).rejects.toMatchObject({ code: 'ENOTDIR' })
    expect(request.body!.locked).toBe(false)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}, 1000)

it('should propagate body read errors without leaving the reader locked', async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.error(new Error('Read failed'))
    },
  })
  const request = new Request('http://localhost/api/media', {
    body,
    duplex: 'half',
    method: 'POST',
    headers: { 'content-type': 'multipart/form-data; boundary=sample' },
  } as RequestInit)
  await expect(processMultipartFormdata({ request })).rejects.toThrow('Read failed')
  expect(body.locked).toBe(false)
})
