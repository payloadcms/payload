import React from 'react'

import './index.scss'

const baseClass = 'file-preview'
type Props = {
  file: File
}
export const FilePreview: React.FC<Props> = ({ file }) => {
  const [src, setSrc] = React.useState('')

  React.useEffect(() => {
    const fileReader = new FileReader()
    fileReader.onload = (e) => {
      const imgSrc = e.target?.result

      if (typeof imgSrc === 'string') {
        setSrc(imgSrc)
      }
    }
    fileReader.readAsDataURL(file)
  }, [src, file])

  // TODO: this could be better, mb, kd, gb, etc
  const fileSize = `${Math.round(file.size / 1000000)} kb`

  return (
    <div className={baseClass}>
      <img alt="" src={src} />
      <p>{file.name}</p>
      <p>{fileSize}</p>
    </div>
  )
}
