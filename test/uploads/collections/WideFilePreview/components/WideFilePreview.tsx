import type { UploadFilePreviewClientProps } from 'payload'

import React from 'react'

const columns = Array.from({ length: 40 }, (_, index) => index + 1)
const rows = Array.from({ length: 8 }, (_, index) => index + 1)

/**
 * A preview with a large intrinsic width that scrolls inside its own box, like a spreadsheet grid.
 */
export const WideFilePreview: React.FC<UploadFilePreviewClientProps> = ({ filename }) => {
  return (
    <div id="wide-file-preview" style={{ overflow: 'auto' }}>
      <table>
        <caption>{filename}</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              {columns.map((column) => (
                <td key={column} style={{ border: '1px solid', minWidth: 100 }}>
                  {`R${row}C${column}`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
