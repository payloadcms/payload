# Accessibility workflows

Workflow tags group audit regressions and preventive tests across
`WCAG.e2e.spec.ts` and `screen-reader.spec.ts`. Tests remain organised by WCAG
criterion within each spec.

- **Auth — `@auth`**: authentication, logout and access to
  protected views.
- **Admin navigation — `@admin-navigation`**: Admin navigation,
  breadcrumbs, collection search, filters, sorting, pagination and row actions.
- **Document editing — `@document-editing`**: fields,
  relationships, drafts/publishing, validation, failed saves and unsaved changes.
- **Media — `@media`**: upload, selection, editing, removal and recovery.
- **Trash — `@trash`**: confirmation,
  cancellation, trash and restoration.
