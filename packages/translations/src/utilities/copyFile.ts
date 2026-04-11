/* eslint-disable no-console */
import fs from 'fs'

export function copyFile(source: string, destination: string) {
  fs.copyFile(source, destination, (err) => {
    if (err) {
      // Handle error
      console.error(`Error copying file from ${source} to ${destination}:`, err)
      return
    }
    console.log(`File copied successfully from ${source} to ${destination}.`)
  })
}
