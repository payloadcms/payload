import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import { formatAdminURL, transformColumnsToPreferences, transformColumnsToSearchParams } from 'payload/shared';
import React, { Fragment, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { PlusIcon } from '../../../icons/Plus/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useListQuery } from '../../../providers/ListQuery/context.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { ConfirmationModal } from '../../ConfirmationModal/index.js';
import { useDocumentDrawer } from '../../DocumentDrawer/index.js';
import { useListDrawer } from '../../ListDrawer/index.js';
import { ListSelectionButton } from '../../ListSelection/index.js';
import { Pill } from '../../Pill/index.js';
import { Translation } from '../../Translation/index.js';
import { QueryPresetToggler } from '../QueryPresetToggler/index.js';
import './index.scss';
const confirmDeletePresetModalSlug = 'confirm-delete-preset';
const queryPresetsSlug = 'payload-query-presets';
const baseClass = 'query-preset-bar';
export const QueryPresetBar = ({
  activePreset,
  collectionSlug,
  queryPresetPermissions
}) => {
  const {
    modified,
    query,
    refineListData,
    setModified: setQueryModified
  } = useListQuery();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    openModal
  } = useModal();
  const {
    config: {
      routes: {
        api: apiRoute
      },
      serverURL
    },
    getEntityConfig
  } = useConfig();
  const presetConfig = getEntityConfig({
    collectionSlug: queryPresetsSlug
  });
  const [PresetDocumentDrawer,, {
    openDrawer: openDocumentDrawer
  }] = useDocumentDrawer({
    id: activePreset?.id,
    collectionSlug: queryPresetsSlug
  });
  const [CreateNewPresetDrawer,, {
    closeDrawer: closeCreateNewDrawer,
    openDrawer: openCreateNewDrawer
  }] = useDocumentDrawer({
    collectionSlug: queryPresetsSlug
  });
  const filterOptions = useMemo(() => ({
    'payload-query-presets': {
      isTemp: {
        not_equals: true
      },
      relatedCollection: {
        equals: collectionSlug
      }
    }
  }), [collectionSlug]);
  const [ListDrawer,, {
    closeDrawer: closeListDrawer,
    openDrawer: openListDrawer
  }] = useListDrawer({
    collectionSlugs: [queryPresetsSlug],
    filterOptions,
    selectedCollection: queryPresetsSlug
  });
  const handlePresetChange = useCallback(async preset => {
    await refineListData({
      columns: preset.columns ? transformColumnsToSearchParams(preset.columns) : undefined,
      groupBy: preset.groupBy || '',
      preset: preset.id,
      where: preset.where
    }, false);
  }, [refineListData]);
  const resetQueryPreset = useCallback(async () => {
    await refineListData({
      columns: [],
      groupBy: '',
      preset: '',
      where: {}
    }, false);
  }, [refineListData]);
  const handleDeletePreset = useCallback(async () => {
    try {
      await fetch(formatAdminURL({
        apiRoute,
        path: `/${queryPresetsSlug}/${activePreset.id}`
      }), {
        method: 'DELETE'
      }).then(async res => {
        try {
          const json = await res.json();
          if (res.status < 400) {
            toast.success(t('general:titleDeleted', {
              label: getTranslation(presetConfig?.labels?.singular, i18n),
              title: activePreset.title
            }));
            await resetQueryPreset();
          } else {
            if (json.errors) {
              json.errors.forEach(error => toast.error(error.message));
            } else {
              toast.error(t('error:deletingTitle', {
                title: activePreset.title
              }));
            }
          }
        } catch (_err) {
          toast.error(t('error:deletingTitle', {
            title: activePreset.title
          }));
        }
      });
    } catch (_err) {
      toast.error(t('error:deletingTitle', {
        title: activePreset.title
      }));
    }
  }, [apiRoute, activePreset?.id, activePreset?.title, t, presetConfig, i18n, resetQueryPreset]);
  const saveCurrentChanges = useCallback(async () => {
    try {
      await fetch(formatAdminURL({
        apiRoute,
        path: `/${queryPresetsSlug}/${activePreset.id}`
      }), {
        body: JSON.stringify({
          columns: transformColumnsToPreferences(query.columns),
          groupBy: query.groupBy,
          where: query.where
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'PATCH'
      }).then(async res => {
        try {
          const json = await res.json();
          if (res.status < 400) {
            toast.success(t('general:updatedLabelSuccessfully', {
              label: getTranslation(presetConfig?.labels?.singular, i18n)
            }));
            setQueryModified(false);
          } else {
            if (json.errors) {
              json.errors.forEach(error => toast.error(error.message));
            } else {
              toast.error(t('error:unknown'));
            }
          }
        } catch (_err) {
          toast.error(t('error:unknown'));
        }
      });
    } catch (_err) {
      toast.error(t('error:unknown'));
    }
  }, [apiRoute, activePreset?.id, query.columns, query.groupBy, query.where, t, presetConfig?.labels?.singular, i18n, setQueryModified]);
  const hasModifiedPreset = activePreset && modified;
  return /*#__PURE__*/_jsxs(Fragment, {
    children: [/*#__PURE__*/_jsxs("div", {
      className: baseClass,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__menu`,
        children: [/*#__PURE__*/_jsx(QueryPresetToggler, {
          activePreset: activePreset,
          openPresetListDrawer: openListDrawer,
          resetPreset: resetQueryPreset
        }), /*#__PURE__*/_jsx(Pill, {
          "aria-label": t('general:newLabel', {
            label: presetConfig?.labels?.singular
          }),
          className: `${baseClass}__create-new-preset`,
          icon: /*#__PURE__*/_jsx(PlusIcon, {}),
          id: "create-new-preset",
          onClick: () => {
            openCreateNewDrawer();
          },
          size: "small"
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__menu-items`,
        children: [hasModifiedPreset && /*#__PURE__*/_jsx(ListSelectionButton, {
          id: "reset-preset",
          onClick: async () => {
            await refineListData({
              columns: transformColumnsToSearchParams(activePreset.columns),
              groupBy: activePreset.groupBy || '',
              where: activePreset.where
            }, false);
          },
          type: "button",
          children: t('general:reset')
        }, "reset"), hasModifiedPreset && queryPresetPermissions.update && /*#__PURE__*/_jsx(ListSelectionButton, {
          id: "save-preset",
          onClick: async () => {
            await saveCurrentChanges();
          },
          type: "button",
          children: activePreset?.isShared ? t('general:updateForEveryone') : t('fields:saveChanges')
        }, "save"), activePreset && queryPresetPermissions?.delete && /*#__PURE__*/_jsxs(Fragment, {
          children: [/*#__PURE__*/_jsx(ListSelectionButton, {
            id: "delete-preset",
            onClick: () => openModal(confirmDeletePresetModalSlug),
            type: "button",
            children: t('general:deleteLabel', {
              label: presetConfig?.labels?.singular
            })
          }), /*#__PURE__*/_jsx(ListSelectionButton, {
            id: "edit-preset",
            onClick: () => {
              openDocumentDrawer();
            },
            type: "button",
            children: t('general:editLabel', {
              label: presetConfig?.labels?.singular
            })
          })]
        })]
      })]
    }), /*#__PURE__*/_jsx(CreateNewPresetDrawer, {
      initialData: {
        columns: transformColumnsToPreferences(query.columns),
        groupBy: query.groupBy,
        relatedCollection: collectionSlug,
        where: query.where
      },
      onSave: async ({
        doc
      }) => {
        closeCreateNewDrawer();
        await handlePresetChange(doc);
      },
      redirectAfterCreate: false
    }), /*#__PURE__*/_jsx(ConfirmationModal, {
      body: /*#__PURE__*/_jsx(Translation, {
        elements: {
          '1': ({
            children
          }) => /*#__PURE__*/_jsx("strong", {
            children: children
          })
        },
        i18nKey: "general:aboutToDelete",
        t: t,
        variables: {
          label: presetConfig?.labels?.singular,
          title: activePreset?.title
        }
      }),
      confirmingLabel: t('general:deleting'),
      heading: t('general:confirmDeletion'),
      modalSlug: confirmDeletePresetModalSlug,
      onConfirm: handleDeletePreset
    }), /*#__PURE__*/_jsx(PresetDocumentDrawer, {
      onDelete: () => {
        // setSelectedPreset(undefined)
      },
      onDuplicate: async ({
        doc
      }) => {
        await handlePresetChange(doc);
      },
      onSave: async ({
        doc
      }) => {
        await handlePresetChange(doc);
      }
    }), /*#__PURE__*/_jsx(ListDrawer, {
      allowCreate: false,
      disableQueryPresets: true,
      onSelect: async ({
        doc
      }) => {
        closeListDrawer();
        await handlePresetChange(doc);
      }
    })]
  });
};
//# sourceMappingURL=index.js.map