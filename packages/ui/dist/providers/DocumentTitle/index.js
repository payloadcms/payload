import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, use, useEffect, useState } from 'react';
import { formatDocTitle } from '../../utilities/formatDocTitle/index.js';
import { useConfig } from '../Config/index.js';
import { useDocumentInfo } from '../DocumentInfo/index.js';
import { useTranslation } from '../Translation/index.js';
const DocumentTitleContext = /*#__PURE__*/createContext({});
export const useDocumentTitle = () => use(DocumentTitleContext);
export const DocumentTitleProvider = ({
  children
}) => {
  const {
    id,
    collectionSlug,
    data,
    docConfig,
    globalSlug,
    initialData
  } = useDocumentInfo();
  const {
    config: {
      admin: {
        dateFormat
      }
    }
  } = useConfig();
  const {
    i18n
  } = useTranslation();
  const [title, setDocumentTitle] = useState(() => formatDocTitle({
    collectionConfig: collectionSlug ? docConfig : undefined,
    data: {
      ...(initialData || {}),
      id
    },
    dateFormat,
    fallback: id?.toString(),
    globalConfig: globalSlug ? docConfig : undefined,
    i18n
  }));
  useEffect(() => {
    setDocumentTitle(formatDocTitle({
      collectionConfig: collectionSlug ? docConfig : undefined,
      data: {
        ...data,
        id
      },
      dateFormat,
      fallback: id?.toString(),
      globalConfig: globalSlug ? docConfig : undefined,
      i18n
    }));
  }, [data, dateFormat, i18n, id, collectionSlug, docConfig, globalSlug]);
  return /*#__PURE__*/_jsx(DocumentTitleContext, {
    value: {
      setDocumentTitle,
      title
    },
    children: children
  });
};
//# sourceMappingURL=index.js.map