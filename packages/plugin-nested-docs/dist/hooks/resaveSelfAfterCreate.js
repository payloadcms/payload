// This hook automatically re-saves a document after it is created
// so that we can build its breadcrumbs with the newly created document's ID.
export const resaveSelfAfterCreate = (pluginConfig)=>async ({ collection, doc, operation, req })=>{
        if (operation !== 'create') {
            return undefined;
        }
        const { locale, payload } = req;
        const breadcrumbSlug = pluginConfig.breadcrumbsFieldSlug || 'breadcrumbs';
        const breadcrumbs = doc[breadcrumbSlug];
        try {
            await payload.update({
                id: doc.id,
                collection: collection.slug,
                data: {
                    [breadcrumbSlug]: breadcrumbs?.map((crumb, i)=>({
                            ...crumb,
                            doc: breadcrumbs.length === i + 1 ? doc.id : crumb.doc
                        })) || []
                },
                depth: 0,
                draft: collection?.versions?.drafts && doc._status !== 'published',
                locale,
                req
            });
        } catch (err) {
            payload.logger.error(`Nested Docs plugin has had an error while adding breadcrumbs during document creation.`);
            payload.logger.error(err);
        }
    };

//# sourceMappingURL=resaveSelfAfterCreate.js.map