import type { DocumentViewClientProps } from 'payload';
import React from 'react';
import './index.scss';
export type OnSaveContext = {
    getDocPermissions?: boolean;
    incrementVersionCount?: boolean;
};
export declare function DefaultEditView({ BeforeDocumentControls, Description, EditMenuItems, LivePreview: CustomLivePreview, PreviewButton, PublishButton, SaveButton, SaveDraftButton, Status, Upload: CustomUpload, UploadControls, }: DocumentViewClientProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map