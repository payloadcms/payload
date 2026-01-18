'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { Pagination, PerPage, Table, Translation, useConfig, useDebouncedEffect, useDocumentInfo, useField, useFormFields, useTranslation } from '@payloadcms/ui';
import { formatDocTitle } from '@payloadcms/ui/shared';
import { fieldAffectsData } from 'payload/shared';
import React, { useState, useTransition } from 'react';
import { DEFAULT_PREVIEW_LIMIT, PREVIEW_LIMIT_OPTIONS } from '../../constants.js';
import './index.scss';
const baseClass = 'import-preview';
export const ImportPreview = ()=>{
    const [isPending, startTransition] = useTransition();
    const { config, config: { routes } } = useConfig();
    const { collectionSlug } = useDocumentInfo();
    const { i18n, t } = useTranslation();
    const { value: targetCollectionSlug } = useField({
        path: 'collectionSlug'
    });
    const { value: importMode } = useField({
        path: 'importMode'
    });
    const { value: matchField } = useField({
        path: 'matchField'
    });
    const { value: filename } = useField({
        path: 'filename'
    });
    const { value: url } = useField({
        path: 'url'
    });
    const { value: mimeType } = useField({
        path: 'mimeType'
    });
    const { value: status } = useField({
        path: 'status'
    });
    const { value: summary } = useField({
        path: 'summary'
    });
    // Access the file field directly from form fields
    const fileField = useFormFields(([fields])=>fields?.file || null);
    const [dataToRender, setDataToRender] = useState([]);
    const [columns, setColumns] = useState([]);
    const [totalDocs, setTotalDocs] = useState(0);
    const [error, setError] = useState(null);
    // Preview pagination state
    const [previewPage, setPreviewPage] = useState(1);
    const [previewLimit, setPreviewLimit] = useState(DEFAULT_PREVIEW_LIMIT);
    const [paginationData, setPaginationData] = useState(null);
    const collectionConfig = React.useMemo(()=>config.collections.find((c)=>c.slug === targetCollectionSlug), [
        targetCollectionSlug,
        config.collections
    ]);
    useDebouncedEffect(()=>{
        if (!collectionSlug || !targetCollectionSlug) {
            return;
        }
        if (!targetCollectionSlug || !url && !fileField?.value) {
            setDataToRender([]);
            setColumns([]);
            setTotalDocs(0);
            setPaginationData(null);
            return;
        }
        if (!collectionConfig) {
            setDataToRender([]);
            setColumns([]);
            setTotalDocs(0);
            setPaginationData(null);
            return;
        }
        const abortController = new AbortController();
        const processFileData = async ()=>{
            setError(null);
            try {
                // Determine format from file
                let format = 'json';
                if (fileField?.value && fileField.value instanceof File) {
                    const file = fileField.value;
                    format = file.type === 'text/csv' || file.name?.endsWith('.csv') ? 'csv' : 'json';
                } else if (mimeType === 'text/csv' || filename?.endsWith('.csv')) {
                    format = 'csv';
                }
                // Get file data as base64
                let fileData;
                if (fileField?.value && fileField.value instanceof File) {
                    // File is being uploaded, read its contents
                    const arrayBuffer = await fileField.value.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString('base64');
                    fileData = base64;
                } else if (url) {
                    // File has been saved, fetch from URL
                    const response = await fetch(url, {
                        signal: abortController.signal
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch file');
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString('base64');
                    fileData = base64;
                }
                if (!fileData) {
                    setDataToRender([]);
                    setColumns([]);
                    setTotalDocs(0);
                    setPaginationData(null);
                    return;
                }
                // Fetch transformed data from the server
                const res = await fetch(`${routes.api}/${collectionSlug}/preview-data`, {
                    body: JSON.stringify({
                        collectionSlug: targetCollectionSlug,
                        fileData,
                        format,
                        previewLimit,
                        previewPage
                    }),
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    signal: abortController.signal
                });
                if (!res.ok) {
                    throw new Error('Failed to process file');
                }
                const { docs, hasNextPage, hasPrevPage, limit: responseLimit, page: responsePage, totalDocs: serverTotalDocs, totalPages } = await res.json();
                setTotalDocs(serverTotalDocs);
                setPaginationData({
                    hasNextPage,
                    hasPrevPage,
                    limit: responseLimit,
                    nextPage: responsePage + 1,
                    page: responsePage,
                    prevPage: responsePage - 1,
                    totalPages
                });
                if (!Array.isArray(docs) || docs.length === 0) {
                    setDataToRender([]);
                    setColumns([]);
                    return;
                }
                // Build columns from collection fields without traverseFields
                const buildColumnsFromFields = (fields, parentPath = '', parentLabel = '')=>{
                    const cols = [];
                    fields.forEach((field)=>{
                        if (!fieldAffectsData(field) || field.admin?.disabled) {
                            return;
                        }
                        // Build the field path
                        const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name;
                        // Get the field label
                        let label = field.name;
                        if ('label' in field && field.label) {
                            label = getTranslation(field.label, i18n);
                        }
                        // Add parent label prefix if in a group
                        if (parentLabel) {
                            label = `${parentLabel} > ${label}`;
                        }
                        // Skip if this field doesn't exist in any document
                        const hasData = docs.some((doc)=>{
                            const value = getValueAtPath(doc, fieldPath);
                            return value !== undefined && value !== null;
                        });
                        if (!hasData && field.type !== 'relationship') {
                            return;
                        }
                        cols.push({
                            accessor: fieldPath,
                            active: true,
                            field,
                            Heading: label,
                            renderedCells: docs.map((doc)=>{
                                const value = getValueAtPath(doc, fieldPath);
                                if (value === undefined || value === null) {
                                    return null;
                                }
                                // Format based on field type
                                if (field.type === 'relationship' || field.type === 'upload') {
                                    // Handle relationships
                                    if (typeof value === 'object' && !Array.isArray(value)) {
                                        // Single relationship
                                        const relationTo = Array.isArray(field.relationTo) ? value.relationTo : field.relationTo;
                                        const relatedConfig = config.collections.find((c)=>c.slug === relationTo);
                                        if (relatedConfig && relatedConfig.admin?.useAsTitle) {
                                            const titleValue = value[relatedConfig.admin.useAsTitle];
                                            if (titleValue) {
                                                return formatDocTitle({
                                                    collectionConfig: relatedConfig,
                                                    data: value,
                                                    dateFormat: config.admin.dateFormat,
                                                    i18n
                                                });
                                            }
                                        }
                                        // Fallback to ID
                                        const id = value.id || value;
                                        return `${getTranslation(relatedConfig?.labels?.singular || relationTo, i18n)}: ${id}`;
                                    } else if (Array.isArray(value)) {
                                        // Multiple relationships
                                        return value.map((item)=>{
                                            if (typeof item === 'object') {
                                                const relationTo = Array.isArray(field.relationTo) ? item.relationTo : field.relationTo;
                                                const relatedConfig = config.collections.find((c)=>c.slug === relationTo);
                                                if (relatedConfig && relatedConfig.admin?.useAsTitle) {
                                                    const titleValue = item[relatedConfig.admin.useAsTitle];
                                                    if (titleValue) {
                                                        return formatDocTitle({
                                                            collectionConfig: relatedConfig,
                                                            data: item,
                                                            dateFormat: config.admin.dateFormat,
                                                            i18n
                                                        });
                                                    }
                                                }
                                                return item.id || item;
                                            }
                                            return item;
                                        }).join(', ');
                                    }
                                    // Just an ID
                                    return String(value);
                                } else if (field.type === 'date') {
                                    // Format dates
                                    const dateFormat = field.admin && 'date' in field.admin && field.admin.date?.displayFormat || config.admin.dateFormat;
                                    return new Date(value).toLocaleString(i18n.language, {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    });
                                } else if (field.type === 'checkbox') {
                                    return value ? '✓' : '✗';
                                } else if (field.type === 'select' || field.type === 'radio') {
                                    // Show the label for select/radio options
                                    const option = field.options?.find((opt)=>{
                                        if (typeof opt === 'string') {
                                            return opt === value;
                                        }
                                        return opt.value === value;
                                    });
                                    if (option && typeof option === 'object') {
                                        return getTranslation(option.label, i18n);
                                    }
                                    return String(value);
                                } else if (field.type === 'number') {
                                    return String(value);
                                } else if (Array.isArray(value)) {
                                    // Handle arrays
                                    if (field.type === 'blocks') {
                                        return value.map((block)=>`${block.blockType || 'Block'}`).join(', ');
                                    }
                                    return `[${value.length} items]`;
                                } else if (typeof value === 'object') {
                                    // Handle objects
                                    if (field.type === 'group') {
                                        return '{...}';
                                    }
                                    return JSON.stringify(value);
                                }
                                return String(value);
                            })
                        });
                        // For groups, add nested fields with parent label
                        if (field.type === 'group' && 'fields' in field) {
                            const groupLabel = 'label' in field && field.label ? getTranslation(field.label, i18n) : field.name;
                            const nestedCols = buildColumnsFromFields(field.fields, fieldPath, parentLabel ? `${parentLabel} > ${groupLabel}` : groupLabel);
                            cols.push(...nestedCols);
                        }
                        // For tabs, process the fields within
                        if ('tabs' in field && Array.isArray(field.tabs)) {
                            field.tabs.forEach((tab)=>{
                                if ('name' in tab && tab.name) {
                                    // Named tab
                                    const tabPath = parentPath ? `${parentPath}.${tab.name}` : tab.name;
                                    const tabLabel = 'label' in tab && tab.label ? getTranslation(tab.label, i18n) : tab.name;
                                    const tabCols = buildColumnsFromFields(tab.fields, tabPath, parentLabel ? `${parentLabel} > ${tabLabel}` : tabLabel);
                                    cols.push(...tabCols);
                                } else {
                                    // Unnamed tab - fields go directly under parent
                                    const tabLabel = 'label' in tab && tab.label ? getTranslation(tab.label, i18n) : '';
                                    const tabCols = buildColumnsFromFields(tab.fields, parentPath, tabLabel && typeof tabLabel === 'string' && parentLabel ? `${parentLabel} > ${tabLabel}` : typeof tabLabel === 'string' ? tabLabel : parentLabel);
                                    cols.push(...tabCols);
                                }
                            });
                        }
                    });
                    return cols;
                };
                // Add default meta fields at the end
                const fieldColumns = buildColumnsFromFields(collectionConfig.fields);
                const metaFields = [
                    'id',
                    'createdAt',
                    'updatedAt',
                    '_status'
                ];
                metaFields.forEach((metaField)=>{
                    const hasData = docs.some((doc)=>doc[metaField] !== undefined);
                    if (!hasData) {
                        return;
                    }
                    fieldColumns.push({
                        accessor: metaField,
                        active: true,
                        field: {
                            name: metaField
                        },
                        Heading: getTranslation(metaField, i18n),
                        renderedCells: docs.map((doc)=>{
                            const value = doc[metaField];
                            if (value === undefined || value === null) {
                                return null;
                            }
                            if (metaField === 'createdAt' || metaField === 'updatedAt') {
                                return new Date(value).toLocaleString(i18n.language, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                });
                            }
                            return String(value);
                        })
                    });
                });
                setColumns(fieldColumns);
                setDataToRender(docs);
            } catch (err) {
                console.error('Error processing file data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load preview');
                setDataToRender([]);
                setColumns([]);
                setTotalDocs(0);
                setPaginationData(null);
            }
        };
        startTransition(async ()=>await processFileData());
        return ()=>{
            if (!abortController.signal.aborted) {
                abortController.abort('Component unmounted');
            }
        };
    }, [
        collectionSlug,
        targetCollectionSlug,
        url,
        filename,
        mimeType,
        fileField?.value,
        collectionConfig,
        config,
        i18n,
        previewLimit,
        previewPage,
        routes.api
    ], 500);
    // If import has been processed, show results instead of preview
    if (status !== 'pending' && summary) {
        return /*#__PURE__*/ _jsxs("div", {
            className: baseClass,
            children: [
                /*#__PURE__*/ _jsx("div", {
                    className: `${baseClass}__header`,
                    children: /*#__PURE__*/ _jsx("h3", {
                        children: /*#__PURE__*/ _jsx(Translation, {
                            i18nKey: "plugin-import-export:importResults",
                            t: t
                        })
                    })
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: `${baseClass}__results`,
                    children: [
                        /*#__PURE__*/ _jsxs("p", {
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: "Status:"
                                }),
                                " ",
                                status
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("p", {
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: "Imported:"
                                }),
                                " ",
                                summary.imported || 0
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("p", {
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: "Updated:"
                                }),
                                " ",
                                summary.updated || 0
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("p", {
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: "Total:"
                                }),
                                " ",
                                summary.total || 0
                            ]
                        }),
                        summary.issues > 0 && /*#__PURE__*/ _jsxs("p", {
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: "Issues:"
                                }),
                                " ",
                                summary.issues
                            ]
                        }),
                        summary.issueDetails && summary.issueDetails.length > 0 && /*#__PURE__*/ _jsxs("div", {
                            style: {
                                marginTop: '1rem'
                            },
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: "Issue Details:"
                                }),
                                /*#__PURE__*/ _jsxs("ul", {
                                    style: {
                                        marginTop: '0.5rem'
                                    },
                                    children: [
                                        summary.issueDetails.slice(0, 10).map((issue, index)=>/*#__PURE__*/ _jsxs("li", {
                                                children: [
                                                    "Row ",
                                                    issue.row,
                                                    ": ",
                                                    issue.error
                                                ]
                                            }, index)),
                                        summary.issueDetails.length > 10 && /*#__PURE__*/ _jsxs("li", {
                                            children: [
                                                "... and ",
                                                summary.issueDetails.length - 10,
                                                " more issues"
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        });
    }
    if (!targetCollectionSlug) {
        return /*#__PURE__*/ _jsx("div", {
            className: baseClass,
            children: /*#__PURE__*/ _jsx("p", {
                style: {
                    opacity: 0.6
                },
                children: /*#__PURE__*/ _jsx(Translation, {
                    i18nKey: "plugin-import-export:collectionRequired",
                    t: t
                })
            })
        });
    }
    if (error) {
        return /*#__PURE__*/ _jsx("div", {
            className: baseClass,
            children: /*#__PURE__*/ _jsxs("p", {
                style: {
                    color: 'red'
                },
                children: [
                    /*#__PURE__*/ _jsx(Translation, {
                        i18nKey: "general:error",
                        t: t
                    }),
                    ": ",
                    error
                ]
            })
        });
    }
    if (!url && !fileField?.value) {
        return /*#__PURE__*/ _jsx("div", {
            className: baseClass,
            children: /*#__PURE__*/ _jsx("p", {
                style: {
                    opacity: 0.6
                },
                children: /*#__PURE__*/ _jsx(Translation, {
                    i18nKey: "plugin-import-export:uploadFileToSeePreview",
                    t: t
                })
            })
        });
    }
    const handlePageChange = (page)=>{
        setPreviewPage(page);
    };
    const handlePerPageChange = (newLimit)=>{
        setPreviewLimit(newLimit);
        setPreviewPage(1);
    };
    return /*#__PURE__*/ _jsxs("div", {
        className: baseClass,
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: `${baseClass}__header`,
                children: [
                    /*#__PURE__*/ _jsx("h3", {
                        children: /*#__PURE__*/ _jsx(Translation, {
                            i18nKey: "version:preview",
                            t: t
                        })
                    }),
                    totalDocs > 0 && !isPending && /*#__PURE__*/ _jsxs("div", {
                        className: `${baseClass}__info`,
                        children: [
                            /*#__PURE__*/ _jsx("span", {
                                className: `${baseClass}__import-count`,
                                children: /*#__PURE__*/ _jsx(Translation, {
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-expect-error
                                    i18nKey: "plugin-import-export:documentsToImport",
                                    t: t,
                                    variables: {
                                        count: totalDocs
                                    }
                                })
                            }),
                            ' | ',
                            /*#__PURE__*/ _jsx(Translation, {
                                i18nKey: "plugin-import-export:mode",
                                t: t
                            }),
                            ": ",
                            importMode || 'create',
                            importMode !== 'create' && /*#__PURE__*/ _jsxs(_Fragment, {
                                children: [
                                    ' | ',
                                    /*#__PURE__*/ _jsx(Translation, {
                                        i18nKey: "plugin-import-export:matchBy",
                                        t: t
                                    }),
                                    ": ",
                                    matchField || 'id'
                                ]
                            })
                        ]
                    })
                ]
            }),
            isPending && !dataToRender.length && /*#__PURE__*/ _jsx("div", {
                className: `${baseClass}__loading`,
                children: /*#__PURE__*/ _jsx(Translation, {
                    i18nKey: "general:loading",
                    t: t
                })
            }),
            dataToRender.length > 0 && /*#__PURE__*/ _jsx(Table, {
                columns: columns,
                data: dataToRender
            }),
            !isPending && dataToRender.length === 0 && targetCollectionSlug && /*#__PURE__*/ _jsx("p", {
                children: /*#__PURE__*/ _jsx(Translation, {
                    i18nKey: "plugin-import-export:noDataToPreview",
                    t: t
                })
            }),
            paginationData && totalDocs > 0 && /*#__PURE__*/ _jsxs("div", {
                className: `${baseClass}__pagination`,
                children: [
                    paginationData.totalPages > 1 && /*#__PURE__*/ _jsx(Pagination, {
                        hasNextPage: paginationData.hasNextPage,
                        hasPrevPage: paginationData.hasPrevPage,
                        nextPage: paginationData.nextPage ?? undefined,
                        numberOfNeighbors: 1,
                        onChange: handlePageChange,
                        page: paginationData.page,
                        prevPage: paginationData.prevPage ?? undefined,
                        totalPages: paginationData.totalPages
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        className: `${baseClass}__page-info`,
                        children: /*#__PURE__*/ _jsx(Translation, {
                            // @ts-expect-error - plugin translations not typed
                            i18nKey: "plugin-import-export:previewPageInfo",
                            t: t,
                            variables: {
                                end: Math.min((paginationData.page ?? 1) * previewLimit, totalDocs),
                                start: ((paginationData.page ?? 1) - 1) * previewLimit + 1,
                                total: totalDocs
                            }
                        })
                    }),
                    /*#__PURE__*/ _jsx(PerPage, {
                        handleChange: handlePerPageChange,
                        limit: previewLimit,
                        limits: PREVIEW_LIMIT_OPTIONS
                    })
                ]
            })
        ]
    });
};
// Helper function to get nested values
const getValueAtPath = (obj, path)=>{
    const segments = path.split('.');
    let current = obj;
    for (const segment of segments){
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[segment];
    }
    return current;
};

//# sourceMappingURL=index.js.map