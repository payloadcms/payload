import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Argument, Command, Option } from 'commander'
import { describe, expect, it } from 'vitest'

import { getCommandInput } from './getCommandInput.js'

describe('getCommandInput', () => {
  it('parses inline JSON and lets explicit shell values override it', async () => {
    const input = await parseInput([
      'shell-name',
      '--count',
      '2',
      '--input',
      '{"count":1,"fromInput":true,"name":"input-name"}',
      '--json',
    ])

    expect(input).toEqual({
      count: 2,
      fromInput: true,
      name: 'shell-name',
    })
  })

  it('reads JSON input from a file', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'payload-cli-input-'))
    const inputFile = path.join(directory, 'input.json')

    try {
      await writeFile(inputFile, JSON.stringify({ count: 3, name: 'file-name' }))

      await expect(parseInput(['--input', `@${inputFile}`])).resolves.toEqual({
        count: 3,
        name: 'file-name',
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it.each(['[]', '"text"', 'null'])('rejects non-object JSON input: %s', async (input) => {
    await expect(parseInput(['--input', input])).rejects.toThrow(
      '--input must contain a JSON object',
    )
  })

  it('reports malformed JSON input', async () => {
    await expect(parseInput(['--input', '{'])).rejects.toThrow('Could not parse --input as JSON')
  })
})

const parseInput = async (args: string[]): Promise<unknown> => {
  const command = new Command('example')
    .exitOverride()
    .addArgument(new Argument('[name]'))
    .addOption(new Option('--count <count>').argParser(Number))
    .addOption(new Option('--input <json|@file|->'))
    .addOption(new Option('--json'))
  let input: unknown

  command.action(async () => {
    input = await getCommandInput(command)
  })

  await command.parseAsync(args, { from: 'user' })

  return input
}
