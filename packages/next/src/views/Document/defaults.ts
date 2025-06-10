import { APIView as DefaultAPIView } from '../API/index.js'
import { EditView as DefaultEditView } from '../Edit/index.js'
import { LivePreviewView as DefaultLivePreviewView } from '../LivePreview/index.js'
import { VersionView as DefaultVersionView } from '../Version/index.js'
import { VersionsView as DefaultVersionsView } from '../Versions/index.js'

export const defaultDocumentViews = {
  api: DefaultAPIView,
  default: DefaultEditView,
  livePreview: DefaultLivePreviewView,
  version: DefaultVersionView,
  versions: DefaultVersionsView,
}
