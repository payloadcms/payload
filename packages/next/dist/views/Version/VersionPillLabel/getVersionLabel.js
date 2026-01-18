/**
 * Gets the appropriate version label and version pill styling
 * given existing versions and the current version status.
 */export function getVersionLabel({
  currentlyPublishedVersion,
  latestDraftVersion,
  t,
  version
}) {
  const publishedNewerThanDraft = currentlyPublishedVersion?.updatedAt > latestDraftVersion?.updatedAt;
  if (version.version._status === 'draft') {
    if (publishedNewerThanDraft) {
      return {
        name: 'draft',
        label: t('version:draft'),
        pillStyle: 'light'
      };
    } else {
      return {
        name: version.id === latestDraftVersion?.id ? 'currentDraft' : 'draft',
        label: version.id === latestDraftVersion?.id ? t('version:currentDraft') : t('version:draft'),
        pillStyle: 'light'
      };
    }
  } else {
    const isCurrentlyPublished = version.id === currentlyPublishedVersion?.id;
    return {
      name: isCurrentlyPublished ? 'currentlyPublished' : 'previouslyPublished',
      label: isCurrentlyPublished ? t('version:currentlyPublished') : t('version:previouslyPublished'),
      pillStyle: isCurrentlyPublished ? 'success' : 'light'
    };
  }
}
//# sourceMappingURL=getVersionLabel.js.map