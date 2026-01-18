import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useCallback } from 'react';
export const ServerFunctionsContext = /*#__PURE__*/createContext(undefined);
export const useServerFunctions = () => {
  const context = React.use(ServerFunctionsContext);
  if (context === undefined) {
    throw new Error('useServerFunctions must be used within a ServerFunctionsProvider');
  }
  return context;
};
export const ServerFunctionsProvider = ({
  children,
  serverFunction
}) => {
  if (!serverFunction) {
    throw new Error('ServerFunctionsProvider requires a serverFunction prop');
  }
  const getDocumentSlots = useCallback(async args => await serverFunction({
    name: 'render-document-slots',
    args
  }), [serverFunction]);
  const schedulePublish = useCallback(async args => {
    const {
      signal: remoteSignal,
      ...rest
    } = args;
    try {
      if (!remoteSignal?.aborted) {
        const result = await serverFunction({
          name: 'schedule-publish',
          args: {
            ...rest
          }
        });
        // TODO: infer this type when `strictNullChecks` is enabled
        if (!remoteSignal?.aborted) {
          return result;
        }
      }
    } catch (_err) {
      console.error(_err); // eslint-disable-line no-console
    }
    let error = `Error scheduling ${rest.type}`;
    if (rest.doc) {
      error += ` for document with ID ${rest.doc.value} in collection ${rest.doc.relationTo}`;
    }
    return {
      error
    };
  }, [serverFunction]);
  const getFormState = useCallback(async args => {
    const {
      signal: remoteSignal,
      ...rest
    } = args || {};
    try {
      if (!remoteSignal?.aborted) {
        const result = await serverFunction({
          name: 'form-state',
          args: {
            fallbackLocale: false,
            ...rest
          }
        });
        // TODO: infer this type when `strictNullChecks` is enabled
        if (!remoteSignal?.aborted) {
          return result;
        }
      }
    } catch (_err) {
      console.error(_err); // eslint-disable-line no-console
    }
    return {
      state: null
    };
  }, [serverFunction]);
  const getTableState = useCallback(async args => {
    const {
      signal: remoteSignal,
      ...rest
    } = args || {};
    try {
      if (!remoteSignal?.aborted) {
        const result = await serverFunction({
          name: 'table-state',
          args: {
            fallbackLocale: false,
            ...rest
          }
        });
        // TODO: infer this type when `strictNullChecks` is enabled
        if (!remoteSignal?.aborted) {
          return result;
        }
      }
    } catch (_err) {
      console.error(_err); // eslint-disable-line no-console
    }
    // return { state: args.formState }
  }, [serverFunction]);
  const renderDocument = useCallback(async args => {
    const {
      signal: remoteSignal,
      ...rest
    } = args || {};
    try {
      const result = await serverFunction({
        name: 'render-document',
        args: {
          fallbackLocale: false,
          ...rest
        }
      });
      // TODO: infer this type when `strictNullChecks` is enabled
      return result;
    } catch (_err) {
      console.error(_err); // eslint-disable-line no-console
    }
  }, [serverFunction]);
  const copyDataFromLocale = useCallback(async args => {
    const {
      signal: remoteSignal,
      ...rest
    } = args || {};
    try {
      const result = await serverFunction({
        name: 'copy-data-from-locale',
        args: rest
      });
      if (!remoteSignal?.aborted) {
        return result;
      }
    } catch (_err) {
      console.error(_err); // eslint-disable-line no-console
    }
  }, [serverFunction]);
  const getFolderResultsComponentAndData = useCallback(async args => {
    const {
      signal: remoteSignal,
      ...rest
    } = args || {};
    try {
      const result = await serverFunction({
        name: 'get-folder-results-component-and-data',
        args: rest
      });
      if (!remoteSignal?.aborted) {
        return result;
      }
    } catch (_err) {
      console.error(_err); // eslint-disable-line no-console
    }
  }, [serverFunction]);
  const _internal_renderField = useCallback(async args => {
    try {
      const result = await serverFunction({
        name: 'render-field',
        args
      });
      return result;
    } catch (_err) {
      console.error(_err); // eslint-disable-line no-console
    }
  }, [serverFunction]);
  const slugify = useCallback(async args => {
    const {
      signal: remoteSignal,
      ...rest
    } = args || {};
    try {
      const result = await serverFunction({
        name: 'slugify',
        args: {
          ...rest
        }
      });
      // TODO: infer this type when `strictNullChecks` is enabled
      return result;
    } catch (_err) {
      console.error(_err); // eslint-disable-line no-console
    }
  }, [serverFunction]);
  return /*#__PURE__*/_jsx(ServerFunctionsContext, {
    value: {
      _internal_renderField,
      copyDataFromLocale,
      getDocumentSlots,
      getFolderResultsComponentAndData,
      getFormState,
      getTableState,
      renderDocument,
      schedulePublish,
      serverFunction,
      slugify
    },
    children: children
  });
};
//# sourceMappingURL=index.js.map