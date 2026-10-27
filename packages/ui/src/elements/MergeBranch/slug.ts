/**
 * The modal every merge entry point opens.
 *
 * Kept apart from the modal itself so that the entry points — the branch
 * switcher and the changed-documents view — can name the modal without importing
 * it, and so the modal can be rendered once per screen rather than per trigger.
 */
export const mergeBranchModalSlug = 'merge-branch'
