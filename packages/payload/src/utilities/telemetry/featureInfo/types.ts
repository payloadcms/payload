import type { TelemetryWidgetType } from '../widgetType.js'

export type RichTextFeature = 'blocks' | 'relationship' | 'table' | 'upload'

type CompleteFeatureInfo = {
  adminCustomization: {
    customAdminComponentCount: number
    customAdminViewCount: number
    customDashboardWidgetCount: number
    /** Registered widget categories; does not describe individual saved dashboard layouts. */
    widgetTypes: TelemetryWidgetType[]
  }
  authentication: {
    apiKeyCollectionCount: number
    authCollectionCount: number
    customAuthStrategyCount: number
    localAuthDisabledCollectionCount: number
    sessionsDisabledCollectionCount: number
    usernameCollectionCount: number
    verifiedCollectionCount: number
  }
  basicDenominators: {
    collectionCount: number
    globalCount: number
  }
  hierarchyCollectionCount: number
  i18n: {
    supportedAdminLanguageCount: number
  }
  jobsAndQueues: {
    jobsAutoRunConfigured: boolean
    jobsConcurrencyEnabled: boolean
    jobsEnabled: boolean
    jobsSchedulingEnabled: boolean
    taskCount: number
    workflowCount: number
  }
  orderableCollectionCount: number
  previewAndLivePreview: {
    livePreviewCollectionCount: number
    livePreviewGlobalCount: number
    previewCollectionCount: number
    previewGlobalCount: number
  }
  queryPresetCollectionCount: number
  richText: { fieldCount: number }
  richTextFeatures: RichTextFeature[]
  trashCollectionCount: number
  uploadAndMedia: {
    cropDisabledCollectionCount: number
    focalPointDisabledCollectionCount: number
    imageSizesCollectionCount: number
    mimeRestrictedCollectionCount: number
    uploadCollectionCount: number
  }
  versionsAndDrafts: {
    autosaveEntityCount: number
    draftCollectionCount: number
    draftGlobalCount: number
    scheduledPublishingEntityCount: number
    versionsDisabledCollectionCount: number
    versionsDisabledGlobalCount: number
  }
}

/** Feature families are omitted individually if their collection fails. */
export type FeatureInfo = Partial<CompleteFeatureInfo>
