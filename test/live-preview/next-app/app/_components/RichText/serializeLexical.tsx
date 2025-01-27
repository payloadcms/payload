import type { SerializedEditorState } from 'lexical'
import { CMSLink } from '../Link'
import { Media } from '../Media'

const serializer = (
  content?: SerializedEditorState['root']['children'],
  renderUploadFilenameOnly?: boolean,
): React.ReactNode | React.ReactNode[] =>
  content?.map((node, i) => {
    switch (node.type) {
      case 'h1':
        return <h1 key={i}>{serializeLexical(node?.children, renderUploadFilenameOnly)}</h1>

      case 'h2':
        return <h2 key={i}>{serializeLexical(node?.children, renderUploadFilenameOnly)}</h2>

      case 'h3':
        return <h3 key={i}>{serializeLexical(node?.children, renderUploadFilenameOnly)}</h3>

      case 'h4':
        return <h4 key={i}>{serializeLexical(node?.children, renderUploadFilenameOnly)}</h4>

      case 'h5':
        return <h5 key={i}>{serializeLexical(node?.children, renderUploadFilenameOnly)}</h5>

      case 'h6':
        return <h6 key={i}>{serializeLexical(node?.children, renderUploadFilenameOnly)}</h6>

      case 'quote':
        return (
          <blockquote key={i}>
            {serializeLexical(node?.children, renderUploadFilenameOnly)}
          </blockquote>
        )

      case 'ul':
        return <ul key={i}>{serializeLexical(node?.children, renderUploadFilenameOnly)}</ul>

      case 'ol':
        return <ol key={i}>{serializeLexical(node.children, renderUploadFilenameOnly)}</ol>

      case 'li':
        return <li key={i}>{serializeLexical(node.children, renderUploadFilenameOnly)}</li>

      case 'relationship':
        return (
          <span key={i}>
            {node.value && typeof node.value === 'object'
              ? node.value.title || node.value.id
              : node.value}
          </span>
        )

      case 'link':
        return (
          <CMSLink
            key={i}
            type={node.linkType === 'internal' ? 'reference' : 'custom'}
            url={node.url}
            reference={node.doc as any}
            newTab={Boolean(node?.newTab)}
          >
            {serializer(node?.children, renderUploadFilenameOnly)}
          </CMSLink>
        )

      case 'upload':
        if (renderUploadFilenameOnly) {
          return <span key={i}>{node.value.filename}</span>
        }

        return <Media key={i} resource={node?.value} />

      case 'paragraph':
        return <p key={i}>{serializer(node?.children, renderUploadFilenameOnly)}</p>

      case 'text':
        return <span key={i}>{node.text}</span>
    }
  })

const serializeLexical = (
  content?: SerializedEditorState,
  renderUploadFilenameOnly?: boolean,
): React.ReactNode | React.ReactNode[] => {
  return serializer(content?.root?.children, renderUploadFilenameOnly)
}

export default serializeLexical
