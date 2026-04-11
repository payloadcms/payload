import { parse } from 'csv-parse'
import fs from 'fs'

export const readCSV = async (path: string): Promise<any[]> => {
  const buffer = fs.readFileSync(path)
  const data: any[] = []
  const promise = new Promise<void>((resolve) => {
    const parser = parse({ bom: true, columns: true })

    // Collect data from the CSV
    parser.on('readable', () => {
      let record
      while ((record = parser.read())) {
        data.push(record)
      }
    })

    // Resolve the promise on 'end'
    parser.on('end', () => {
      resolve()
    })

    // Handle errors (optional, but good practice)
    parser.on('error', (error) => {
      console.error('Error parsing CSV:', error)
      resolve() // Ensures promise doesn't hang on error
    })

    // Pipe the buffer into the parser
    parser.write(buffer)
    parser.end()
  })

  // Await the promise
  await promise

  return data
}

export const readJSON = async (path: string): Promise<any[]> => {
  const buffer = fs.readFileSync(path)
  const str = buffer.toString()

  try {
    const json = await JSON.parse(str)
    return json
  } catch (error) {
    console.error('Error reading JSON file:', error)
    throw error
  }
}
