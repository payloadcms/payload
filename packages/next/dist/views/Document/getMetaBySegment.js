import { getNextRequestI18n } from '../../utilities/getNextRequestI18n.js';
import { generateAPIViewMetadata } from '../API/metadata.js';
import { generateEditViewMetadata } from '../Edit/metadata.js';
import { generateNotFoundViewMetadata } from '../NotFound/metadata.js';
import { generateVersionViewMetadata } from '../Version/metadata.js';
import { generateVersionsViewMetadata } from '../Versions/metadata.js';
import { getDocumentView } from './getDocumentView.js';
export const getMetaBySegment = async ({
  collectionConfig,
  config,
  globalConfig,
  params
}) => {
  const {
    segments
  } = params;
  let fn = null;
  const [segmentOne] = segments;
  const isCollection = segmentOne === 'collections';
  const isGlobal = segmentOne === 'globals';
  const isEditing = isGlobal || Boolean(isCollection && segments?.length > 2 && segments[2] !== 'create');
  if (isCollection) {
    // `/:collection/:id`
    if (params.segments.length === 3) {
      fn = generateEditViewMetadata;
    }
    // `/collections/:collection/trash/:id`
    if (segments.length === 4 && segments[2] === 'trash') {
      fn = args => generateEditViewMetadata({
        ...args,
        isReadOnly: true
      });
    }
    // `/:collection/:id/:view`
    if (params.segments.length === 4) {
      switch (params.segments[3]) {
        case 'api':
          // `/:collection/:id/api`
          fn = generateAPIViewMetadata;
          break;
        case 'versions':
          // `/:collection/:id/versions`
          fn = generateVersionsViewMetadata;
          break;
        default:
          break;
      }
    }
    // `/:collection/:id/:slug-1/:slug-2`
    if (params.segments.length === 5) {
      switch (params.segments[3]) {
        case 'versions':
          // `/:collection/:id/versions/:version`
          fn = generateVersionViewMetadata;
          break;
        default:
          break;
      }
    }
    // `/collections/:collection/trash/:id/:view`
    if (segments.length === 5 && segments[2] === 'trash') {
      switch (segments[4]) {
        case 'api':
          fn = generateAPIViewMetadata;
          break;
        case 'versions':
          fn = generateVersionsViewMetadata;
          break;
        default:
          break;
      }
    }
    // `/collections/:collection/trash/:id/versions/:versionID`
    if (segments.length === 6 && segments[2] === 'trash' && segments[4] === 'versions') {
      fn = generateVersionViewMetadata;
    }
  }
  if (isGlobal) {
    // `/:global`
    if (params.segments?.length === 2) {
      fn = generateEditViewMetadata;
    }
    // `/:global/:view`
    if (params.segments?.length === 3) {
      switch (params.segments[2]) {
        case 'api':
          // `/:global/api`
          fn = generateAPIViewMetadata;
          break;
        case 'versions':
          // `/:global/versions`
          fn = generateVersionsViewMetadata;
          break;
        default:
          break;
      }
    }
    // `/:global/versions/:version`
    if (params.segments?.length === 4 && params.segments[2] === 'versions') {
      fn = generateVersionViewMetadata;
    }
  }
  const i18n = await getNextRequestI18n({
    config
  });
  if (typeof fn === 'function') {
    return fn({
      collectionConfig,
      config,
      globalConfig,
      i18n,
      isEditing
    });
  } else {
    const {
      viewKey
    } = getDocumentView({
      collectionConfig,
      config,
      docPermissions: {
        create: true,
        delete: true,
        fields: true,
        read: true,
        readVersions: true,
        update: true
      },
      globalConfig,
      routeSegments: typeof segments === 'string' ? [segments] : segments
    });
    if (viewKey) {
      const customViewConfig = collectionConfig?.admin?.components?.views?.edit?.[viewKey] || globalConfig?.admin?.components?.views?.edit?.[viewKey];
      if (customViewConfig) {
        return generateEditViewMetadata({
          collectionConfig,
          config,
          globalConfig,
          i18n,
          isEditing,
          view: viewKey
        });
      }
    }
  }
  return generateNotFoundViewMetadata({
    config,
    i18n
  });
};
//# sourceMappingURL=getMetaBySegment.js.map