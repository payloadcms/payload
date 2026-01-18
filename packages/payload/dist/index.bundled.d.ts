import { Locale as Locale$1 } from 'date-fns';
import DataLoader from 'dataloader';
import { URL } from 'url';
import GraphQL, { GraphQLNonNull, GraphQLObjectType, GraphQLFormattedError, GraphQLInputObjectType, ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql';
import React$1, { CSSProperties } from 'react';
import { BusboyConfig } from 'busboy';
import { JSONSchema4, JSONSchema4TypeName } from 'json-schema';
import { Metadata } from 'next';
import { Logger, DestinationStream, LoggerOptions, Level } from 'pino';
import sharp, { Metadata as Metadata$1, SharpOptions, Sharp, ResizeOptions } from 'sharp';
import { EditorProps } from '@monaco-editor/react';
import { OperationArgs as OperationArgs$1, Request as Request$1 } from 'graphql-http';
import { SendMailOptions } from 'nodemailer';
import { ParsedArgs } from 'minimist';
import { lookup } from 'dns';
import deepMerge from 'deepmerge';
export { default as deepMerge } from 'deepmerge';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies.js';
import { PinoPretty } from 'pino-pretty';
import { DatePickerProps } from 'react-datepicker';

declare const clientTranslationKeys: ("authentication:account" | "authentication:accountOfCurrentUser" | "authentication:accountVerified" | "authentication:alreadyActivated" | "authentication:alreadyLoggedIn" | "authentication:apiKey" | "authentication:authenticated" | "authentication:backToLogin" | "authentication:beginCreateFirstUser" | "authentication:changePassword" | "authentication:checkYourEmailForPasswordReset" | "authentication:confirmGeneration" | "authentication:confirmPassword" | "authentication:createFirstUser" | "authentication:emailNotValid" | "authentication:emailOrUsername" | "authentication:emailSent" | "authentication:emailVerified" | "authentication:enableAPIKey" | "authentication:failedToUnlock" | "authentication:forceUnlock" | "authentication:forgotPassword" | "authentication:forgotPasswordEmailInstructions" | "authentication:forgotPasswordUsernameInstructions" | "authentication:usernameNotValid" | "authentication:forgotPasswordQuestion" | "authentication:generate" | "authentication:generateNewAPIKey" | "authentication:generatingNewAPIKeyWillInvalidate" | "authentication:logBackIn" | "authentication:loggedIn" | "authentication:loggedInChangePassword" | "authentication:loggedOutInactivity" | "authentication:loggedOutSuccessfully" | "authentication:loggingOut" | "authentication:login" | "authentication:logOut" | "authentication:logout" | "authentication:logoutSuccessful" | "authentication:logoutUser" | "authentication:newAPIKeyGenerated" | "authentication:newPassword" | "authentication:passed" | "authentication:passwordResetSuccessfully" | "authentication:resetPassword" | "authentication:stayLoggedIn" | "authentication:successfullyRegisteredFirstUser" | "authentication:successfullyUnlocked" | "authentication:tokenRefreshSuccessful" | "authentication:unableToVerify" | "authentication:username" | "authentication:verified" | "authentication:verifiedSuccessfully" | "authentication:verify" | "authentication:verifyUser" | "authentication:youAreInactive" | "dashboard:addWidget" | "dashboard:deleteWidget" | "dashboard:searchWidgets" | "error:autosaving" | "error:correctInvalidFields" | "error:deletingTitle" | "error:documentNotFound" | "error:emailOrPasswordIncorrect" | "error:insufficientClipboardPermissions" | "error:invalidClipboardData" | "error:invalidFileType" | "error:invalidRequestArgs" | "error:loadingDocument" | "error:logoutFailed" | "error:noMatchedField" | "error:notAllowedToAccessPage" | "error:previewing" | "error:problemUploadingFile" | "error:restoringTitle" | "error:tokenNotProvided" | "error:unableToCopy" | "error:unableToDeleteCount" | "error:unableToReindexCollection" | "error:unableToUpdateCount" | "error:unauthorized" | "error:unauthorizedAdmin" | "error:unknown" | "error:unPublishingDocument" | "error:unspecific" | "error:unverifiedEmail" | "error:userEmailAlreadyRegistered" | "error:usernameAlreadyRegistered" | "error:usernameOrPasswordIncorrect" | "fields:blocks" | "fields:addLabel" | "fields:addLink" | "fields:addNew" | "fields:addNewLabel" | "fields:addRelationship" | "fields:addUpload" | "fields:block" | "fields:blockType" | "fields:chooseBetweenCustomTextOrDocument" | "fields:chooseDocumentToLink" | "fields:chooseFromExisting" | "fields:collapseAll" | "fields:customURL" | "fields:editLink" | "fields:editRelationship" | "fields:enterURL" | "fields:internalLink" | "fields:itemsAndMore" | "fields:labelRelationship" | "fields:latitude" | "fields:linkedTo" | "fields:linkType" | "fields:longitude" | "fields:openInNewTab" | "fields:passwordsDoNotMatch" | "fields:removeRelationship" | "fields:removeUpload" | "fields:saveChanges" | "fields:searchForBlock" | "fields:searchForLanguage" | "fields:selectFieldsToEdit" | "fields:showAll" | "fields:swapRelationship" | "fields:swapUpload" | "fields:textToDisplay" | "fields:toggleBlock" | "fields:uploadNewLabel" | "folder:browseByFolder" | "folder:byFolder" | "folder:deleteFolder" | "folder:folderName" | "folder:folders" | "folder:folderTypeDescription" | "folder:itemHasBeenMoved" | "folder:itemHasBeenMovedToRoot" | "folder:itemsMovedToFolder" | "folder:itemsMovedToRoot" | "folder:moveFolder" | "folder:moveItemsToFolderConfirmation" | "folder:moveItemsToRootConfirmation" | "folder:moveItemToFolderConfirmation" | "folder:moveItemToRootConfirmation" | "folder:movingFromFolder" | "folder:newFolder" | "folder:noFolder" | "folder:renameFolder" | "folder:searchByNameInFolder" | "folder:selectFolderForItem" | "general:items" | "general:of" | "general:language" | "general:dashboard" | "general:error" | "general:username" | "general:notFound" | "general:unauthorized" | "general:newLabel" | "general:name" | "general:aboutToDelete" | "general:aboutToPermanentlyDelete" | "general:aboutToPermanentlyDeleteTrash" | "general:aboutToRestore" | "general:aboutToRestoreAsDraft" | "general:aboutToRestoreAsDraftCount" | "general:aboutToRestoreCount" | "general:aboutToTrash" | "general:aboutToTrashCount" | "general:addBelow" | "general:addFilter" | "general:adminTheme" | "general:all" | "general:allCollections" | "general:allLocales" | "general:and" | "general:anotherUser" | "general:anotherUserTakenOver" | "general:applyChanges" | "general:ascending" | "general:automatic" | "general:backToDashboard" | "general:cancel" | "general:changesNotSaved" | "general:clear" | "general:clearAll" | "general:close" | "general:collapse" | "general:collections" | "general:columns" | "general:columnToSort" | "general:confirm" | "general:confirmCopy" | "general:confirmDeletion" | "general:confirmDuplication" | "general:confirmMove" | "general:confirmReindex" | "general:confirmReindexAll" | "general:confirmReindexDescription" | "general:confirmReindexDescriptionAll" | "general:confirmRestoration" | "general:copied" | "general:copy" | "general:copyField" | "general:copying" | "general:copyRow" | "general:copyWarning" | "general:create" | "general:created" | "general:createdAt" | "general:createNew" | "general:createNewLabel" | "general:creating" | "general:creatingNewLabel" | "general:currentlyEditing" | "general:custom" | "general:dark" | "general:delete" | "general:deleted" | "general:deletedAt" | "general:deletedCountSuccessfully" | "general:deletedSuccessfully" | "general:deleteLabel" | "general:deletePermanently" | "general:deleting" | "general:depth" | "general:descending" | "general:deselectAllRows" | "general:document" | "general:documentIsTrashed" | "general:documentLocked" | "general:documents" | "general:duplicate" | "general:duplicateWithoutSaving" | "general:edit" | "general:editAll" | "general:editedSince" | "general:editing" | "general:editingTakenOver" | "general:editLabel" | "general:email" | "general:emailAddress" | "general:emptyTrash" | "general:emptyTrashLabel" | "general:enterAValue" | "general:errors" | "general:exitLivePreview" | "general:export" | "general:fallbackToDefaultLocale" | "general:false" | "general:filters" | "general:filterWhere" | "general:globals" | "general:goBack" | "general:groupByLabel" | "general:import" | "general:isEditing" | "general:item" | "general:lastModified" | "general:leaveAnyway" | "general:leaveWithoutSaving" | "general:light" | "general:livePreview" | "general:loading" | "general:locale" | "general:locales" | "general:lock" | "general:menu" | "general:moreOptions" | "general:move" | "general:moveConfirm" | "general:moveCount" | "general:moveDown" | "general:moveUp" | "general:moving" | "general:movingCount" | "general:next" | "general:no" | "general:noDateSelected" | "general:noFiltersSet" | "general:noLabel" | "general:none" | "general:noOptions" | "general:noResults" | "general:nothingFound" | "general:noTrashResults" | "general:noUpcomingEventsScheduled" | "general:noValue" | "general:only" | "general:open" | "general:or" | "general:order" | "general:overwriteExistingData" | "general:pageNotFound" | "general:password" | "general:pasteField" | "general:pasteRow" | "general:payloadSettings" | "general:permanentlyDelete" | "general:permanentlyDeletedCountSuccessfully" | "general:perPage" | "general:previous" | "general:reindex" | "general:reindexingAll" | "general:remove" | "general:rename" | "general:reset" | "general:resetPreferences" | "general:resetPreferencesDescription" | "general:resettingPreferences" | "general:restore" | "general:restoreAsPublished" | "general:restoredCountSuccessfully" | "general:restoring" | "general:row" | "general:rows" | "general:save" | "general:saving" | "general:schedulePublishFor" | "general:searchBy" | "general:select" | "general:selectAll" | "general:selectAllRows" | "general:selectedCount" | "general:selectLabel" | "general:selectValue" | "general:showAllLabel" | "general:sorryNotFound" | "general:sort" | "general:sortByLabelDirection" | "general:stayOnThisPage" | "general:submissionSuccessful" | "general:submit" | "general:submitting" | "general:success" | "general:successfullyCreated" | "general:successfullyDuplicated" | "general:successfullyReindexed" | "general:takeOver" | "general:thisLanguage" | "general:time" | "general:timezone" | "general:titleDeleted" | "general:titleRestored" | "general:titleTrashed" | "general:trash" | "general:trashedCountSuccessfully" | "general:true" | "general:unlock" | "general:unsavedChanges" | "general:unsavedChangesDuplicate" | "general:untitled" | "general:upcomingEvents" | "general:updatedAt" | "general:updatedCountSuccessfully" | "general:updatedLabelSuccessfully" | "general:updatedSuccessfully" | "general:updateForEveryone" | "general:updating" | "general:uploading" | "general:uploadingBulk" | "general:user" | "general:users" | "general:value" | "general:viewing" | "general:viewReadOnly" | "general:welcome" | "general:yes" | "localization:cannotCopySameLocale" | "localization:copyFrom" | "localization:copyFromTo" | "localization:copyTo" | "localization:copyToLocale" | "localization:localeToPublish" | "localization:selectedLocales" | "localization:selectLocaleToCopy" | "localization:selectLocaleToDuplicate" | "operators:contains" | "operators:equals" | "operators:exists" | "operators:intersects" | "operators:near" | "operators:within" | "operators:isGreaterThan" | "operators:isGreaterThanOrEqualTo" | "operators:isIn" | "operators:isLessThan" | "operators:isLessThanOrEqualTo" | "operators:isLike" | "operators:isNotEqualTo" | "operators:isNotIn" | "operators:isNotLike" | "upload:addFile" | "upload:addFiles" | "upload:bulkUpload" | "upload:crop" | "upload:cropToolDescription" | "upload:download" | "upload:dragAndDrop" | "upload:editImage" | "upload:fileName" | "upload:fileSize" | "upload:filesToUpload" | "upload:fileToUpload" | "upload:focalPoint" | "upload:focalPointDescription" | "upload:height" | "upload:noFile" | "upload:pasteURL" | "upload:previewSizes" | "upload:selectCollectionToBrowse" | "upload:selectFile" | "upload:setCropArea" | "upload:setFocalPoint" | "upload:sizes" | "upload:sizesFor" | "upload:width" | "validation:username" | "validation:emailAddress" | "validation:enterNumber" | "validation:fieldHasNo" | "validation:greaterThanMax" | "validation:invalidBlock" | "validation:invalidBlocks" | "validation:invalidInput" | "validation:invalidSelection" | "validation:invalidSelections" | "validation:latitudeOutOfBounds" | "validation:lessThanMin" | "validation:limitReached" | "validation:longerThanMin" | "validation:longitudeOutOfBounds" | "validation:notValidDate" | "validation:required" | "validation:requiresAtLeast" | "validation:requiresNoMoreThan" | "validation:requiresTwoNumbers" | "validation:shorterThanMax" | "validation:timezoneRequired" | "validation:trueOrFalse" | "validation:validUploadID" | "version:version" | "version:aboutToRestore" | "version:restoring" | "version:type" | "version:aboutToPublishSelection" | "version:aboutToRestoreGlobal" | "version:aboutToRevertToPublished" | "version:aboutToUnpublish" | "version:aboutToUnpublishSelection" | "version:autosave" | "version:autosavedSuccessfully" | "version:autosavedVersion" | "version:changed" | "version:compareVersions" | "version:comparingAgainst" | "version:confirmPublish" | "version:confirmRevertToSaved" | "version:confirmUnpublish" | "version:confirmVersionRestoration" | "version:currentDraft" | "version:currentlyPublished" | "version:currentlyViewing" | "version:currentPublishedVersion" | "version:draft" | "version:draftHasPublishedVersion" | "version:draftSavedSuccessfully" | "version:lastSavedAgo" | "version:modifiedOnly" | "version:moreVersions" | "version:noFurtherVersionsFound" | "version:noLabelGroup" | "version:noRowsFound" | "version:noRowsSelected" | "version:preview" | "version:previouslyDraft" | "version:previouslyPublished" | "version:previousVersion" | "version:problemRestoringVersion" | "version:publish" | "version:publishAllLocales" | "version:publishChanges" | "version:published" | "version:publishIn" | "version:publishing" | "version:restoreAsDraft" | "version:restoredSuccessfully" | "version:restoreThisVersion" | "version:reverting" | "version:revertToPublished" | "version:saveDraft" | "version:scheduledSuccessfully" | "version:schedulePublish" | "version:selectLocales" | "version:selectVersionToCompare" | "version:showLocales" | "version:specificVersion" | "version:status" | "version:unpublish" | "version:unpublishing" | "version:versionAgo" | "version:versionID" | "version:versions" | "version:viewingVersion" | "version:viewingVersionGlobal" | "version:viewingVersions" | "version:viewingVersionsGlobal" | "general:aboutToDeleteCount" | "general:editingLabel" | "version:changedFieldsCount")[];

declare const enTranslations: {
    authentication: {
        account: string;
        accountOfCurrentUser: string;
        accountVerified: string;
        alreadyActivated: string;
        alreadyLoggedIn: string;
        apiKey: string;
        authenticated: string;
        backToLogin: string;
        beginCreateFirstUser: string;
        changePassword: string;
        checkYourEmailForPasswordReset: string;
        confirmGeneration: string;
        confirmPassword: string;
        createFirstUser: string;
        emailNotValid: string;
        emailOrUsername: string;
        emailSent: string;
        emailVerified: string;
        enableAPIKey: string;
        failedToUnlock: string;
        forceUnlock: string;
        forgotPassword: string;
        forgotPasswordEmailInstructions: string;
        forgotPasswordUsernameInstructions: string;
        usernameNotValid: string;
        forgotPasswordQuestion: string;
        generate: string;
        generateNewAPIKey: string;
        generatingNewAPIKeyWillInvalidate: string;
        lockUntil: string;
        logBackIn: string;
        loggedIn: string;
        loggedInChangePassword: string;
        loggedOutInactivity: string;
        loggedOutSuccessfully: string;
        loggingOut: string;
        login: string;
        loginAttempts: string;
        loginUser: string;
        loginWithAnotherUser: string;
        logOut: string;
        logout: string;
        logoutSuccessful: string;
        logoutUser: string;
        newAccountCreated: string;
        newAPIKeyGenerated: string;
        newPassword: string;
        passed: string;
        passwordResetSuccessfully: string;
        resetPassword: string;
        resetPasswordExpiration: string;
        resetPasswordToken: string;
        resetYourPassword: string;
        stayLoggedIn: string;
        successfullyRegisteredFirstUser: string;
        successfullyUnlocked: string;
        tokenRefreshSuccessful: string;
        unableToVerify: string;
        username: string;
        verified: string;
        verifiedSuccessfully: string;
        verify: string;
        verifyUser: string;
        verifyYourEmail: string;
        youAreInactive: string;
        youAreReceivingResetPassword: string;
        youDidNotRequestPassword: string;
    };
    dashboard: {
        addWidget: string;
        deleteWidget: string;
        searchWidgets: string;
    };
    error: {
        accountAlreadyActivated: string;
        autosaving: string;
        correctInvalidFields: string;
        deletingFile: string;
        deletingTitle: string;
        documentNotFound: string;
        emailOrPasswordIncorrect: string;
        followingFieldsInvalid_one: string;
        followingFieldsInvalid_other: string;
        incorrectCollection: string;
        insufficientClipboardPermissions: string;
        invalidClipboardData: string;
        invalidFileType: string;
        invalidFileTypeValue: string;
        invalidRequestArgs: string;
        loadingDocument: string;
        localesNotSaved_one: string;
        localesNotSaved_other: string;
        logoutFailed: string;
        missingEmail: string;
        missingIDOfDocument: string;
        missingIDOfVersion: string;
        missingRequiredData: string;
        noFilesUploaded: string;
        noMatchedField: string;
        notAllowedToAccessPage: string;
        notAllowedToPerformAction: string;
        notFound: string;
        noUser: string;
        previewing: string;
        problemUploadingFile: string;
        restoringTitle: string;
        tokenInvalidOrExpired: string;
        tokenNotProvided: string;
        unableToCopy: string;
        unableToDeleteCount: string;
        unableToReindexCollection: string;
        unableToUpdateCount: string;
        unauthorized: string;
        unauthorizedAdmin: string;
        unknown: string;
        unPublishingDocument: string;
        unspecific: string;
        unverifiedEmail: string;
        userEmailAlreadyRegistered: string;
        userLocked: string;
        usernameAlreadyRegistered: string;
        usernameOrPasswordIncorrect: string;
        valueMustBeUnique: string;
        verificationTokenInvalid: string;
    };
    fields: {
        addLabel: string;
        addLink: string;
        addNew: string;
        addNewLabel: string;
        addRelationship: string;
        addUpload: string;
        block: string;
        blocks: string;
        blockType: string;
        chooseBetweenCustomTextOrDocument: string;
        chooseDocumentToLink: string;
        chooseFromExisting: string;
        chooseLabel: string;
        collapseAll: string;
        customURL: string;
        editLabelData: string;
        editLink: string;
        editRelationship: string;
        enterURL: string;
        internalLink: string;
        itemsAndMore: string;
        labelRelationship: string;
        latitude: string;
        linkedTo: string;
        linkType: string;
        longitude: string;
        newLabel: string;
        openInNewTab: string;
        passwordsDoNotMatch: string;
        relatedDocument: string;
        relationTo: string;
        removeRelationship: string;
        removeUpload: string;
        saveChanges: string;
        searchForBlock: string;
        searchForLanguage: string;
        selectExistingLabel: string;
        selectFieldsToEdit: string;
        showAll: string;
        swapRelationship: string;
        swapUpload: string;
        textToDisplay: string;
        toggleBlock: string;
        uploadNewLabel: string;
    };
    folder: {
        browseByFolder: string;
        byFolder: string;
        deleteFolder: string;
        folderName: string;
        folders: string;
        folderTypeDescription: string;
        itemHasBeenMoved: string;
        itemHasBeenMovedToRoot: string;
        itemsMovedToFolder: string;
        itemsMovedToRoot: string;
        moveFolder: string;
        moveItemsToFolderConfirmation: string;
        moveItemsToRootConfirmation: string;
        moveItemToFolderConfirmation: string;
        moveItemToRootConfirmation: string;
        movingFromFolder: string;
        newFolder: string;
        noFolder: string;
        renameFolder: string;
        searchByNameInFolder: string;
        selectFolderForItem: string;
    };
    general: {
        name: string;
        aboutToDelete: string;
        aboutToDeleteCount_many: string;
        aboutToDeleteCount_one: string;
        aboutToDeleteCount_other: string;
        aboutToPermanentlyDelete: string;
        aboutToPermanentlyDeleteTrash: string;
        aboutToRestore: string;
        aboutToRestoreAsDraft: string;
        aboutToRestoreAsDraftCount: string;
        aboutToRestoreCount: string;
        aboutToTrash: string;
        aboutToTrashCount: string;
        addBelow: string;
        addFilter: string;
        adminTheme: string;
        all: string;
        allCollections: string;
        allLocales: string;
        and: string;
        anotherUser: string;
        anotherUserTakenOver: string;
        applyChanges: string;
        ascending: string;
        automatic: string;
        backToDashboard: string;
        cancel: string;
        changesNotSaved: string;
        clear: string;
        clearAll: string;
        close: string;
        collapse: string;
        collections: string;
        columns: string;
        columnToSort: string;
        confirm: string;
        confirmCopy: string;
        confirmDeletion: string;
        confirmDuplication: string;
        confirmMove: string;
        confirmReindex: string;
        confirmReindexAll: string;
        confirmReindexDescription: string;
        confirmReindexDescriptionAll: string;
        confirmRestoration: string;
        copied: string;
        copy: string;
        copyField: string;
        copying: string;
        copyRow: string;
        copyWarning: string;
        create: string;
        created: string;
        createdAt: string;
        createNew: string;
        createNewLabel: string;
        creating: string;
        creatingNewLabel: string;
        currentlyEditing: string;
        custom: string;
        dark: string;
        dashboard: string;
        delete: string;
        deleted: string;
        deletedAt: string;
        deletedCountSuccessfully: string;
        deletedSuccessfully: string;
        deleteLabel: string;
        deletePermanently: string;
        deleting: string;
        depth: string;
        descending: string;
        deselectAllRows: string;
        document: string;
        documentIsTrashed: string;
        documentLocked: string;
        documents: string;
        duplicate: string;
        duplicateWithoutSaving: string;
        edit: string;
        editAll: string;
        editedSince: string;
        editing: string;
        editingLabel_many: string;
        editingLabel_one: string;
        editingLabel_other: string;
        editingTakenOver: string;
        editLabel: string;
        email: string;
        emailAddress: string;
        emptyTrash: string;
        emptyTrashLabel: string;
        enterAValue: string;
        error: string;
        errors: string;
        exitLivePreview: string;
        export: string;
        fallbackToDefaultLocale: string;
        false: string;
        filter: string;
        filters: string;
        filterWhere: string;
        globals: string;
        goBack: string;
        groupByLabel: string;
        import: string;
        isEditing: string;
        item: string;
        items: string;
        language: string;
        lastModified: string;
        leaveAnyway: string;
        leaveWithoutSaving: string;
        light: string;
        livePreview: string;
        loading: string;
        locale: string;
        locales: string;
        lock: string;
        menu: string;
        moreOptions: string;
        move: string;
        moveConfirm: string;
        moveCount: string;
        moveDown: string;
        moveUp: string;
        moving: string;
        movingCount: string;
        newLabel: string;
        newPassword: string;
        next: string;
        no: string;
        noDateSelected: string;
        noFiltersSet: string;
        noLabel: string;
        none: string;
        noOptions: string;
        noResults: string;
        notFound: string;
        nothingFound: string;
        noTrashResults: string;
        noUpcomingEventsScheduled: string;
        noValue: string;
        of: string;
        only: string;
        open: string;
        or: string;
        order: string;
        overwriteExistingData: string;
        pageNotFound: string;
        password: string;
        pasteField: string;
        pasteRow: string;
        payloadSettings: string;
        permanentlyDelete: string;
        permanentlyDeletedCountSuccessfully: string;
        perPage: string;
        previous: string;
        reindex: string;
        reindexingAll: string;
        remove: string;
        rename: string;
        reset: string;
        resetPreferences: string;
        resetPreferencesDescription: string;
        resettingPreferences: string;
        restore: string;
        restoreAsPublished: string;
        restoredCountSuccessfully: string;
        restoring: string;
        row: string;
        rows: string;
        save: string;
        saving: string;
        schedulePublishFor: string;
        searchBy: string;
        select: string;
        selectAll: string;
        selectAllRows: string;
        selectedCount: string;
        selectLabel: string;
        selectValue: string;
        showAllLabel: string;
        sorryNotFound: string;
        sort: string;
        sortByLabelDirection: string;
        stayOnThisPage: string;
        submissionSuccessful: string;
        submit: string;
        submitting: string;
        success: string;
        successfullyCreated: string;
        successfullyDuplicated: string;
        successfullyReindexed: string;
        takeOver: string;
        thisLanguage: string;
        time: string;
        timezone: string;
        titleDeleted: string;
        titleRestored: string;
        titleTrashed: string;
        trash: string;
        trashedCountSuccessfully: string;
        true: string;
        unauthorized: string;
        unlock: string;
        unsavedChanges: string;
        unsavedChangesDuplicate: string;
        untitled: string;
        upcomingEvents: string;
        updatedAt: string;
        updatedCountSuccessfully: string;
        updatedLabelSuccessfully: string;
        updatedSuccessfully: string;
        updateForEveryone: string;
        updating: string;
        uploading: string;
        uploadingBulk: string;
        user: string;
        username: string;
        users: string;
        value: string;
        viewing: string;
        viewReadOnly: string;
        welcome: string;
        yes: string;
    };
    localization: {
        cannotCopySameLocale: string;
        copyFrom: string;
        copyFromTo: string;
        copyTo: string;
        copyToLocale: string;
        localeToPublish: string;
        selectedLocales: string;
        selectLocaleToCopy: string;
        selectLocaleToDuplicate: string;
    };
    operators: {
        contains: string;
        equals: string;
        exists: string;
        intersects: string;
        isGreaterThan: string;
        isGreaterThanOrEqualTo: string;
        isIn: string;
        isLessThan: string;
        isLessThanOrEqualTo: string;
        isLike: string;
        isNotEqualTo: string;
        isNotIn: string;
        isNotLike: string;
        near: string;
        within: string;
    };
    upload: {
        addFile: string;
        addFiles: string;
        bulkUpload: string;
        crop: string;
        cropToolDescription: string;
        download: string;
        dragAndDrop: string;
        dragAndDropHere: string;
        editImage: string;
        fileName: string;
        fileSize: string;
        filesToUpload: string;
        fileToUpload: string;
        focalPoint: string;
        focalPointDescription: string;
        height: string;
        lessInfo: string;
        moreInfo: string;
        noFile: string;
        pasteURL: string;
        previewSizes: string;
        selectCollectionToBrowse: string;
        selectFile: string;
        setCropArea: string;
        setFocalPoint: string;
        sizes: string;
        sizesFor: string;
        width: string;
    };
    validation: {
        emailAddress: string;
        enterNumber: string;
        fieldHasNo: string;
        greaterThanMax: string;
        invalidBlock: string;
        invalidBlocks: string;
        invalidInput: string;
        invalidSelection: string;
        invalidSelections: string;
        latitudeOutOfBounds: string;
        lessThanMin: string;
        limitReached: string;
        longerThanMin: string;
        longitudeOutOfBounds: string;
        notValidDate: string;
        required: string;
        requiresAtLeast: string;
        requiresNoMoreThan: string;
        requiresTwoNumbers: string;
        shorterThanMax: string;
        timezoneRequired: string;
        trueOrFalse: string;
        username: string;
        validUploadID: string;
    };
    version: {
        type: string;
        aboutToPublishSelection: string;
        aboutToRestore: string;
        aboutToRestoreGlobal: string;
        aboutToRevertToPublished: string;
        aboutToUnpublish: string;
        aboutToUnpublishSelection: string;
        autosave: string;
        autosavedSuccessfully: string;
        autosavedVersion: string;
        changed: string;
        changedFieldsCount_one: string;
        changedFieldsCount_other: string;
        compareVersion: string;
        compareVersions: string;
        comparingAgainst: string;
        confirmPublish: string;
        confirmRevertToSaved: string;
        confirmUnpublish: string;
        confirmVersionRestoration: string;
        currentDocumentStatus: string;
        currentDraft: string;
        currentlyPublished: string;
        currentlyViewing: string;
        currentPublishedVersion: string;
        draft: string;
        draftHasPublishedVersion: string;
        draftSavedSuccessfully: string;
        lastSavedAgo: string;
        modifiedOnly: string;
        moreVersions: string;
        noFurtherVersionsFound: string;
        noLabelGroup: string;
        noRowsFound: string;
        noRowsSelected: string;
        preview: string;
        previouslyDraft: string;
        previouslyPublished: string;
        previousVersion: string;
        problemRestoringVersion: string;
        publish: string;
        publishAllLocales: string;
        publishChanges: string;
        published: string;
        publishIn: string;
        publishing: string;
        restoreAsDraft: string;
        restoredSuccessfully: string;
        restoreThisVersion: string;
        restoring: string;
        reverting: string;
        revertToPublished: string;
        saveDraft: string;
        scheduledSuccessfully: string;
        schedulePublish: string;
        selectLocales: string;
        selectVersionToCompare: string;
        showingVersionsFor: string;
        showLocales: string;
        specificVersion: string;
        status: string;
        unpublish: string;
        unpublishing: string;
        version: string;
        versionAgo: string;
        versionCount_many: string;
        versionCount_none: string;
        versionCount_one: string;
        versionCount_other: string;
        versionID: string;
        versions: string;
        viewingVersion: string;
        viewingVersionGlobal: string;
        viewingVersions: string;
        viewingVersionsGlobal: string;
    };
};

declare const acceptedLanguages: readonly ["ar", "az", "bg", "bn-BD", "bn-IN", "ca", "cs", "bn-BD", "bn-IN", "da", "de", "en", "es", "et", "fa", "fr", "he", "hr", "hu", "hy", "id", "is", "it", "ja", "ko", "lt", "lv", "my", "nb", "nl", "pl", "pt", "ro", "rs", "rs-latin", "ru", "sk", "sl", "sv", "ta", "th", "tr", "uk", "vi", "zh", "zh-TW"];

type DateFNSKeys = 'ar' | 'az' | 'bg' | 'bn-BD' | 'bn-IN' | 'ca' | 'cs' | 'da' | 'de' | 'en-US' | 'es' | 'et' | 'fa-IR' | 'fr' | 'he' | 'hr' | 'hu' | 'hy-AM' | 'id' | 'is' | 'it' | 'ja' | 'ko' | 'lt' | 'lv' | 'nb' | 'nl' | 'pl' | 'pt' | 'ro' | 'rs' | 'rs-Latin' | 'ru' | 'sk' | 'sl-SI' | 'sv' | 'ta' | 'th' | 'tr' | 'uk' | 'vi' | 'zh-CN' | 'zh-TW';
type Language<TDefaultTranslations = DefaultTranslationsObject> = {
    dateFNSKey: DateFNSKeys;
    translations: TDefaultTranslations;
};
type GenericTranslationsObject = {
    [key: string]: GenericTranslationsObject | string;
};
type GenericLanguages = {
    [key in AcceptedLanguages]?: GenericTranslationsObject;
};
type AcceptedLanguages = (typeof acceptedLanguages)[number];
type SupportedLanguages<TDefaultTranslations = DefaultTranslationsObject> = {
    [key in AcceptedLanguages]?: Language<TDefaultTranslations>;
};
type StripCountVariants<TKey> = TKey extends `${infer Base}_many` | `${infer Base}_one` | `${infer Base}_other` ? Base : TKey;
type NestedKeysStripped<T> = T extends object ? {
    [K in keyof T]-?: K extends string ? T[K] extends object ? `${K}:${NestedKeysStripped<T[K]>}` : `${StripCountVariants<K>}` : never;
}[keyof T] : '';
/**
 * Default nested translations object
 */
type DefaultTranslationsObject = typeof enTranslations;
/**
 * All translation keys sanitized. E.g. 'general:aboutToDeleteCount'
 */
type DefaultTranslationKeys = NestedKeysStripped<DefaultTranslationsObject>;
type ClientTranslationKeys<TExtraProps = (typeof clientTranslationKeys)[number]> = TExtraProps;
type ClientTranslationsObject = GenericTranslationsObject;
type TFunction<TTranslationKeys = DefaultTranslationKeys> = (key: TTranslationKeys, options?: Record<string, any>) => string;
type I18n<TTranslations = DefaultTranslationsObject, TTranslationKeys = DefaultTranslationKeys> = {
    dateFNS: Locale$1;
    /** Corresponding dateFNS key */
    dateFNSKey: DateFNSKeys;
    /** The fallback language */
    fallbackLanguage: string;
    /** The language of the request */
    language: string;
    /** Translate function */
    t: TFunction<TTranslationKeys>;
    translations: Language<TTranslations>['translations'];
};
type I18nOptions<TTranslations = DefaultTranslationsObject> = {
    fallbackLanguage?: AcceptedLanguages;
    supportedLanguages?: SupportedLanguages;
    translations?: Partial<{
        [key in AcceptedLanguages]?: Language<TTranslations>['translations'];
    }>;
};
type I18nClient<TAdditionalTranslations = {}, TAdditionalKeys extends string = never> = I18n<TAdditionalTranslations extends object ? ClientTranslationsObject & TAdditionalTranslations : ClientTranslationsObject, [
    TAdditionalKeys
] extends [never] ? ClientTranslationKeys : ClientTranslationKeys | TAdditionalKeys>;

type Primitive = string | number | boolean | bigint | symbol | undefined | null;

type Builtin = Primitive | Function | Date | Error | RegExp;

type NonNever<Type extends {}> = Pick<Type, {
    [Key in keyof Type]: Type[Key] extends never ? never : Key;
}[keyof Type]>;

type IsAny$1<Type> = 0 extends 1 & Type ? true : false;

type IsUnknown<Type> = IsAny$1<Type> extends true ? false : unknown extends Type ? true : false;

type MarkOptional<Type, Keys extends keyof Type> = Type extends Type ? Omit<Type, Keys> & Partial<Pick<Type, Keys>> : never;

type MarkRequired<Type, Keys extends keyof Type> = Type extends Type ? Type & Required<Pick<Type, Keys>> : never;

type IsTuple<Type> = Type extends readonly any[] ? (any[] extends Type ? never : Type) : never;

type DeepPartial<Type> = Type extends Exclude<Builtin, Error> ? Type : Type extends Map<infer Keys, infer Values> ? Map<DeepPartial<Keys>, DeepPartial<Values>> : Type extends ReadonlyMap<infer Keys, infer Values> ? ReadonlyMap<DeepPartial<Keys>, DeepPartial<Values>> : Type extends WeakMap<infer Keys, infer Values> ? WeakMap<DeepPartial<Keys>, DeepPartial<Values>> : Type extends Set<infer Values> ? Set<DeepPartial<Values>> : Type extends ReadonlySet<infer Values> ? ReadonlySet<DeepPartial<Values>> : Type extends WeakSet<infer Values> ? WeakSet<DeepPartial<Values>> : Type extends ReadonlyArray<infer Values> ? Type extends IsTuple<Type> ? {
    [Key in keyof Type]?: DeepPartial<Type[Key]>;
} : Type extends Array<Values> ? Array<DeepPartial<Values> | undefined> : ReadonlyArray<DeepPartial<Values> | undefined> : Type extends Promise<infer Value> ? Promise<DeepPartial<Value>> : Type extends {} ? {
    [Key in keyof Type]?: DeepPartial<Type[Key]>;
} : IsUnknown<Type> extends true ? unknown : Partial<Type>;

type DeepRequired<Type> = Type extends Error ? Required<Type> : Type extends Builtin ? Type : Type extends Map<infer Keys, infer Values> ? Map<DeepRequired<Keys>, DeepRequired<Values>> : Type extends ReadonlyMap<infer Keys, infer Values> ? ReadonlyMap<DeepRequired<Keys>, DeepRequired<Values>> : Type extends WeakMap<infer Keys, infer Values> ? WeakMap<DeepRequired<Keys>, DeepRequired<Values>> : Type extends Set<infer Values> ? Set<DeepRequired<Values>> : Type extends ReadonlySet<infer Values> ? ReadonlySet<DeepRequired<Values>> : Type extends WeakSet<infer Values> ? WeakSet<DeepRequired<Values>> : Type extends Promise<infer Value> ? Promise<DeepRequired<Value>> : Type extends ReadonlyArray<infer Values> ? Type extends IsTuple<Type> ? {
    [Key in keyof Type]-?: DeepRequired<Type[Key]>;
} : Type extends Array<Values> ? Array<Exclude<DeepRequired<Values>, undefined>> : ReadonlyArray<Exclude<DeepRequired<Values>, undefined>> : Type extends {} ? {
    [Key in keyof Type]-?: DeepRequired<Type[Key]>;
} : Required<Type>;

type DeepUndefinable<Type> = Type extends Builtin ? Type | undefined : Type extends Map<infer Keys, infer Values> ? Map<DeepUndefinable<Keys>, DeepUndefinable<Values>> : Type extends ReadonlyMap<infer Keys, infer Values> ? ReadonlyMap<DeepUndefinable<Keys>, DeepUndefinable<Values>> : Type extends WeakMap<infer Keys, infer Values> ? DeepUndefinable<Keys> extends object ? WeakMap<DeepUndefinable<Keys>, DeepUndefinable<Values>> : never : Type extends Set<infer Values> ? Set<DeepUndefinable<Values>> : Type extends ReadonlySet<infer Values> ? ReadonlySet<DeepUndefinable<Values>> : Type extends WeakSet<infer Values> ? DeepUndefinable<Values> extends object ? WeakSet<DeepUndefinable<Values>> : never : Type extends ReadonlyArray<infer Values> ? Type extends IsTuple<Type> ? {
    [Key in keyof Type]: DeepUndefinable<Type[Key]> | undefined;
} : Type extends Array<Values> ? Array<DeepUndefinable<Values>> : ReadonlyArray<DeepUndefinable<Values>> : Type extends Promise<infer Value> ? Promise<DeepUndefinable<Value>> : Type extends {} ? {
    [Key in keyof Type]: DeepUndefinable<Type[Key]>;
} : Type | undefined;

type OptionalKeys<Type> = Type extends object ? keyof {
    [Key in keyof Type as Type extends Required<Pick<Type, Key>> ? never : Key]: never;
} : never;

type RequiredKeys<Type> = Type extends unknown ? Exclude<keyof Type, OptionalKeys<Type>> : never;

declare let APIErrorName: string;
declare class ExtendableError<TData extends object = {
    [key: string]: unknown;
}> extends Error {
    data: TData;
    isOperational: boolean;
    isPublic: boolean;
    status: number;
    constructor(message: string, status: number, data: TData, isPublic: boolean);
}
/**
 * Class representing an API error.
 * @extends ExtendableError
 */
declare class APIError<TData extends null | object = {
    [key: string]: unknown;
} | null> extends ExtendableError<TData> {
    /**
     * Creates an API error.
     * @param {string} message - Error message.
     * @param {number} status - HTTP status code of error.
     * @param {object} data - response data to be returned.
     * @param {boolean} isPublic - Whether the message should be visible to user or not.
     */
    constructor(message: string, status?: number, data?: TData, isPublic?: boolean);
}

declare let ValidationErrorName: string;
type ValidationFieldError = {
    label?: LabelFunction | StaticLabel;
    message: string;
    path: string;
};
declare class ValidationError extends APIError<{
    collection?: string;
    errors: ValidationFieldError[];
    global?: string;
}> {
    constructor(results: {
        collection?: string;
        errors: ValidationFieldError[];
        global?: string;
        id?: number | string;
        /**
         *  req needs to be passed through (if you have one) in order to resolve label functions that may be part of the errors array
         */
        req?: Partial<PayloadRequest>;
    }, t?: TFunction);
}

/**
 * A permission object that can be used to determine if a user has access to a specific operation.
 */
type Permission = {
    permission: boolean;
    where?: Where;
};
type FieldsPermissions = {
    [fieldName: string]: FieldPermissions;
};
type BlockPermissions = {
    create: Permission;
    fields: FieldsPermissions;
    read: Permission;
    update: Permission;
};
type SanitizedBlockPermissions = {
    fields: SanitizedFieldsPermissions;
} | true;
type BlocksPermissions = {
    [blockSlug: string]: BlockPermissions;
};
type SanitizedBlocksPermissions = {
    [blockSlug: string]: SanitizedBlockPermissions;
} | true;
type FieldPermissions = {
    blocks?: BlocksPermissions;
    create?: Permission;
    fields?: FieldsPermissions;
    read?: Permission;
    update?: Permission;
};
type SanitizedFieldPermissions = {
    blocks?: SanitizedBlocksPermissions;
    create: true;
    fields?: SanitizedFieldsPermissions;
    read: true;
    update: true;
} | true;
type SanitizedFieldsPermissions = {
    [fieldName: string]: SanitizedFieldPermissions;
} | true;
type CollectionPermission = {
    create?: Permission;
    delete?: Permission;
    fields: FieldsPermissions;
    read?: Permission;
    readVersions?: Permission;
    unlock?: Permission;
    update?: Permission;
};
type SanitizedCollectionPermission = {
    create?: true;
    delete?: true;
    fields: SanitizedFieldsPermissions;
    read?: true;
    readVersions?: true;
    unlock?: true;
    update?: true;
};
type GlobalPermission = {
    fields: FieldsPermissions;
    read?: Permission;
    readVersions?: Permission;
    update?: Permission;
};
type SanitizedGlobalPermission = {
    fields: SanitizedFieldsPermissions;
    read?: true;
    readVersions?: true;
    update?: true;
};
type DocumentPermissions = CollectionPermission | GlobalPermission;
type SanitizedDocumentPermissions = SanitizedCollectionPermission | SanitizedGlobalPermission;
type Permissions = {
    canAccessAdmin: boolean;
    collections?: Record<CollectionSlug, CollectionPermission>;
    globals?: Record<GlobalSlug, GlobalPermission>;
};
type SanitizedPermissions = {
    canAccessAdmin?: boolean;
    collections?: {
        [collectionSlug: string]: SanitizedCollectionPermission;
    };
    globals?: {
        [globalSlug: string]: SanitizedGlobalPermission;
    };
};
type BaseUser = {
    collection: string;
    email?: string;
    id: number | string;
    sessions?: Array<UserSession>;
    username?: string;
};
/**
 * @deprecated Use `TypedUser` instead. This will be removed in 4.0.
 */
type UntypedUser = {
    [key: string]: any;
} & BaseUser;
/**
 * `collection` is not available one the client. It's only available on the server (req.user)
 * On the client, you can access the collection via config.admin.user. Config can be accessed using the useConfig() hook
 */
type ClientUser = {
    [key: string]: any;
} & BaseUser;
type UserSession = {
    createdAt: Date | string;
    expiresAt: Date | string;
    id: string;
};
type GenerateVerifyEmailHTML<TUser = any> = (args: {
    req: PayloadRequest;
    token: string;
    user: TUser;
}) => Promise<string> | string;
type GenerateVerifyEmailSubject<TUser = any> = (args: {
    req: PayloadRequest;
    token: string;
    user: TUser;
}) => Promise<string> | string;
type GenerateForgotPasswordEmailHTML<TUser = any> = (args?: {
    req?: PayloadRequest;
    token?: string;
    user?: TUser;
}) => Promise<string> | string;
type GenerateForgotPasswordEmailSubject<TUser = any> = (args?: {
    req?: PayloadRequest;
    token?: string;
    user?: TUser;
}) => Promise<string> | string;
type AuthStrategyFunctionArgs = {
    /**
     * Specifies whether or not response headers can be set from this strategy.
     */
    canSetHeaders?: boolean;
    headers: Request['headers'];
    isGraphQL?: boolean;
    payload: Payload;
    /**
     * The AuthStrategy name property from the payload config.
     */
    strategyName?: string;
};
type AuthStrategyResult = {
    responseHeaders?: Headers;
    user: ({
        _strategy?: string;
        collection?: string;
    } & TypedUser) | null;
};
type AuthStrategyFunction = (args: AuthStrategyFunctionArgs) => AuthStrategyResult | Promise<AuthStrategyResult>;
type AuthStrategy = {
    authenticate: AuthStrategyFunction;
    name: string;
};
type LoginWithUsernameOptions = {
    allowEmailLogin?: false;
    requireEmail?: boolean;
    requireUsername?: true;
} | {
    allowEmailLogin?: true;
    requireEmail?: boolean;
    requireUsername?: boolean;
};
interface IncomingAuthType {
    /**
     * Set cookie options, including secure, sameSite, and domain. For advanced users.
     */
    cookies?: {
        domain?: string;
        sameSite?: 'Lax' | 'None' | 'Strict' | boolean;
        secure?: boolean;
    };
    /**
     * How many levels deep a user document should be populated when creating the JWT and binding the user to the req. Defaults to 0 and should only be modified if absolutely necessary, as this will affect performance.
     * @default 0
     */
    depth?: number;
    /**
     * Advanced - disable Payload's built-in local auth strategy. Only use this property if you have replaced Payload's auth mechanisms with your own.
     */
    disableLocalStrategy?: {
        /**
         * Include auth fields on the collection even though the local strategy is disabled.
         * Useful when you do not want the database or types to vary depending on the auth configuration.
         */
        enableFields?: true;
        optionalPassword?: true;
    } | true;
    /**
     * Customize the way that the forgotPassword operation functions.
     * @link https://payloadcms.com/docs/authentication/email#forgot-password
     */
    forgotPassword?: {
        /**
         * The number of milliseconds that the forgot password token should be valid for.
         * @default 3600000 // 1 hour
         */
        expiration?: number;
        generateEmailHTML?: GenerateForgotPasswordEmailHTML;
        generateEmailSubject?: GenerateForgotPasswordEmailSubject;
    };
    /**
     * Set the time (in milliseconds) that a user should be locked out if they fail authentication more times than maxLoginAttempts allows for.
     */
    lockTime?: number;
    /**
     * Ability to allow users to login with username/password.
     *
     * @link https://payloadcms.com/docs/authentication/overview#login-with-username
     */
    loginWithUsername?: boolean | LoginWithUsernameOptions;
    /**
     * Only allow a user to attempt logging in X amount of times. Automatically locks out a user from authenticating if this limit is passed. Set to 0 to disable.
     */
    maxLoginAttempts?: number;
    /***
     * Set to true if you want to remove the token from the returned authentication API responses such as login or refresh.
     */
    removeTokenFromResponses?: true;
    /**
     * Advanced - an array of custom authentification strategies to extend this collection's authentication with.
     * @link https://payloadcms.com/docs/authentication/custom-strategies
     */
    strategies?: AuthStrategy[];
    /**
     * Controls how many seconds the token will be valid for. Default is 2 hours.
     * @default 7200
     * @link https://payloadcms.com/docs/authentication/overview#config-options
     */
    tokenExpiration?: number;
    /**
     * Payload Authentication provides for API keys to be set on each user within an Authentication-enabled Collection.
     * @default false
     * @link https://payloadcms.com/docs/authentication/api-keys
     */
    useAPIKey?: boolean;
    /**
     * Use sessions for authentication. Enabled by default.
     * @default true
     */
    useSessions?: boolean;
    /**
     * Set to true or pass an object with verification options to require users to verify by email before they are allowed to log into your app.
     * @link https://payloadcms.com/docs/authentication/email#email-verification
     */
    verify?: {
        generateEmailHTML?: GenerateVerifyEmailHTML;
        generateEmailSubject?: GenerateVerifyEmailSubject;
    } | boolean;
}
type VerifyConfig = {
    generateEmailHTML?: GenerateVerifyEmailHTML;
    generateEmailSubject?: GenerateVerifyEmailSubject;
};
interface Auth extends Omit<DeepRequired<IncomingAuthType>, 'forgotPassword' | 'loginWithUsername' | 'verify'> {
    forgotPassword?: {
        expiration?: number;
        generateEmailHTML?: GenerateForgotPasswordEmailHTML;
        generateEmailSubject?: GenerateForgotPasswordEmailSubject;
    };
    loginWithUsername: false | LoginWithUsernameOptions;
    verify?: boolean | VerifyConfig;
}
declare function hasWhereAccessResult(result: boolean | Where): result is Where;

type PreferenceRequest = {
    key: string;
    overrideAccess?: boolean;
    req: PayloadRequest;
    user: PayloadRequest['user'];
};
type PreferenceUpdateRequest = {
    value: unknown;
} & PreferenceRequest;
type CollapsedPreferences = string[];
type TabsPreferences = Array<{
    [path: string]: number;
}>;
type InsideFieldsPreferences = {
    collapsed: CollapsedPreferences;
    tabIndex: number;
};
type FieldsPreferences = {
    [key: string]: InsideFieldsPreferences;
};
type DocumentPreferences = {
    fields: FieldsPreferences;
};
type ColumnPreference = {
    accessor: string;
    active: boolean;
};
type CollectionPreferences = {
    columns?: ColumnPreference[];
    editViewType?: 'default' | 'live-preview';
    groupBy?: string;
    limit?: number;
    listViewType?: 'folders' | 'list';
    preset?: DefaultDocumentIDType;
    sort?: string;
};

type ClientFieldWithOptionalType = MarkOptional<ClientField, 'type'>;
type ClientComponentProps = {
    customComponents?: FieldState['customComponents'];
    field: ClientBlock | ClientField | ClientTab;
    /**
     * Controls the rendering behavior of the fields, i.e. defers rendering until they intersect with the viewport using the Intersection Observer API.
     *
     * If true, the fields will be rendered immediately, rather than waiting for them to intersect with the viewport.
     *
     * If a number is provided, will immediately render fields _up to that index_.
     */
    forceRender?: boolean;
    permissions?: SanitizedFieldPermissions;
    readOnly?: boolean;
    renderedBlocks?: RenderedField[];
    /**
     * Used to extract field configs from a schemaMap.
     * Does not include indexes.
     *
     * @default field.name
     **/
    schemaPath?: string;
};
type FieldPaths = {
    /**
     * @default ''
     */
    indexPath?: string;
    /**
     * @default ''
     */
    parentPath?: string;
    /**
     * The path built up to the point of the field
     * excluding the field name.
     *
     * @default ''
     */
    parentSchemaPath?: string;
    /**
     * A built up path to access FieldState in the form state.
     * Nested fields will have a path that includes the parent field names
     * if they are nested within a group, array, block or named tab.
     *
     * Collapsibles and unnamed tabs will have arbitrary paths
     * that look like _index-0, _index-1, etc.
     *
     * Row fields will not have a path.
     *
     * @example 'parentGroupField.childTextField'
     *
     * @default field.name
     */
    path: string;
};
/**
 * TODO: This should be renamed to `FieldComponentServerProps` or similar
 */
type ServerComponentProps = {
    clientField: ClientFieldWithOptionalType;
    clientFieldSchemaMap: ClientFieldSchemaMap;
    collectionSlug: string;
    data: Data;
    field: Field;
    /**
     * The fieldSchemaMap that is created before form state is built is made available here.
     */
    fieldSchemaMap: FieldSchemaMap;
    /**
     * Server Components will also have available to the entire form state.
     * We cannot add it to ClientComponentProps as that would blow up the size of the props sent to the client.
     */
    formState: FormState;
    i18n: I18nClient;
    id?: number | string;
    operation: Operation;
    payload: Payload;
    permissions: SanitizedFieldPermissions;
    preferences: DocumentPreferences;
    req: PayloadRequest;
    siblingData: Data;
    user: TypedUser;
    value?: unknown;
};
type ClientFieldBase<TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = {
    readonly field: TFieldClient;
} & Omit<ClientComponentProps, 'customComponents' | 'field'>;
type ServerFieldBase<TFieldServer extends Field = Field, TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = {
    readonly clientField: TFieldClient;
    readonly field: TFieldServer;
} & Omit<ClientComponentProps, 'field'> & Omit<ServerComponentProps, 'clientField' | 'field'>;
type FieldClientComponent<TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType, AdditionalProps extends Record<string, unknown> = Record<string, unknown>> = React.ComponentType<AdditionalProps & ClientFieldBase<TFieldClient>>;
type FieldServerComponent<TFieldServer extends Field = Field, TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType, AdditionalProps extends Record<string, unknown> = Record<string, unknown>> = React.ComponentType<AdditionalProps & ServerFieldBase<TFieldServer, TFieldClient>>;

type GenericErrorProps = {
    readonly alignCaret?: 'center' | 'left' | 'right';
    readonly message?: string;
    readonly path?: string;
    readonly showError?: boolean;
};
type FieldErrorClientProps<TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = {
    field: TFieldClient;
} & GenericErrorProps;
type FieldErrorServerProps<TFieldServer extends Field, TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = {
    clientField: TFieldClient;
    readonly field: TFieldServer;
} & GenericErrorProps & ServerComponentProps;
type FieldErrorClientComponent<TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = React.ComponentType<FieldErrorClientProps<TFieldClient>>;
type FieldErrorServerComponent<TFieldServer extends Field = Field, TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = React.ComponentType<FieldErrorServerProps<TFieldServer, TFieldClient>>;

type JoinFieldClientWithoutType = MarkOptional<JoinFieldClient, 'type'>;
type JoinFieldBaseClientProps = {
    readonly path: string;
};
type JoinFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type JoinFieldClientProps = ClientFieldBase<JoinFieldClientWithoutType> & JoinFieldBaseClientProps;
type JoinFieldServerProps = JoinFieldBaseServerProps & ServerFieldBase<JoinField>;
type JoinFieldServerComponent = FieldServerComponent<JoinField, JoinFieldClientWithoutType, JoinFieldBaseServerProps>;
type JoinFieldClientComponent = FieldClientComponent<JoinFieldClientWithoutType, JoinFieldBaseClientProps>;
type JoinFieldLabelServerComponent = FieldLabelServerComponent<JoinField>;
type JoinFieldLabelClientComponent = FieldLabelClientComponent<JoinFieldClientWithoutType>;
type JoinFieldDescriptionServerComponent = FieldDescriptionServerComponent<JoinField, JoinFieldClientWithoutType>;
type JoinFieldDescriptionClientComponent = FieldDescriptionClientComponent<JoinFieldClientWithoutType>;
type JoinFieldErrorServerComponent = FieldErrorServerComponent<JoinField, JoinFieldClientWithoutType>;
type JoinFieldErrorClientComponent = FieldErrorClientComponent<JoinFieldClientWithoutType>;
type JoinFieldDiffServerComponent = FieldDiffServerComponent<JoinField, JoinFieldClient>;
type JoinFieldDiffClientComponent = FieldDiffClientComponent<JoinFieldClient>;

type Autosave = {
    /**
     * Define an `interval` in milliseconds to automatically save progress while documents are edited.
     * Document updates are "debounced" at this interval.
     *
     * @default 800
     */
    interval?: number;
    /**
     * When set to `true`, the "Save as draft" button will be displayed even while autosave is enabled.
     * By default, this button is hidden to avoid redundancy with autosave behavior.
     *
     * @default false
     */
    showSaveDraftButton?: boolean;
};
type SchedulePublish = {
    /**
     * Define a date format to use for the time picker.
     *
     * @example 'hh:mm' will give a 24 hour clock
     *
     * @default 'h:mm aa' which is a 12 hour clock
     */
    timeFormat?: string;
    /**
     * Intervals for the time picker.
     *
     * @default 5
     */
    timeIntervals?: number;
};
type IncomingDrafts = {
    /**
     * Enable autosave to automatically save progress while documents are edited.
     * To enable, set to true or pass an object with options.
     */
    autosave?: Autosave | boolean;
    /**
     * Allow for editors to schedule publish / unpublish events in the future.
     */
    schedulePublish?: boolean | SchedulePublish;
    /**
     * Set validate to true to validate draft documents when saved.
     *
     * @default false
     */
    validate?: boolean;
};
type SanitizedDrafts = {
    /**
     * Enable autosave to automatically save progress while documents are edited.
     * To enable, set to true or pass an object with options.
     */
    autosave: Autosave | false;
    /**
     * Allow for editors to schedule publish / unpublish events in the future.
     */
    schedulePublish: boolean | SchedulePublish;
    /**
     * Set validate to true to validate draft documents when saved.
     *
     * @default false
     */
    validate: boolean;
};
type IncomingCollectionVersions = {
    /**
     * Enable Drafts mode for this collection.
     * To enable, set to true or pass an object with draft options.
     */
    drafts?: boolean | IncomingDrafts;
    /**
     * Use this setting to control how many versions to keep on a document by document basis.
     * Must be an integer. Use 0 to save all versions.
     *
     * @default 100
     */
    maxPerDoc?: number;
};
interface SanitizedCollectionVersions extends Omit<IncomingCollectionVersions, 'drafts'> {
    /**
     * Enable Drafts mode for this collection.
     * To enable, set to true or pass an object with draft options.
     */
    drafts: false | SanitizedDrafts;
    /**
     * Use this setting to control how many versions to keep on a document by document basis.
     * Must be an integer. Use 0 to save all versions.
     *
     * @default 100
     */
    maxPerDoc: number;
}
type IncomingGlobalVersions = {
    drafts?: boolean | IncomingDrafts;
    /**
     * Use this setting to control how many versions to keep on a global by global basis.
     * Must be an integer.
     */
    max?: number;
};
type SanitizedGlobalVersions = {
    /**
     * Enable Drafts mode for this global. To enable, set to true or pass an object with draft options
     */
    drafts: false | SanitizedDrafts;
    /**
     * Use this setting to control how many versions to keep on a global by global basis.
     * Must be an integer.
     */
    max: number;
};
type TypeWithVersion<T> = {
    createdAt: string;
    id: string;
    latest?: boolean;
    parent: number | string;
    publishedLocale?: string;
    snapshot?: boolean;
    updatedAt: string;
    version: T;
};

interface BaseDatabaseAdapter {
    allowIDOnCreate?: boolean;
    /**
     * Start a transaction, requiring commitTransaction() to be called for any changes to be made.
     * @returns an identifier for the transaction or null if one cannot be established
     */
    beginTransaction: BeginTransaction;
    /**
     * When true, bulk operations will process documents one at a time
     * in separate transactions instead of all at once in a single transaction.
     * Useful for avoiding transaction limitations with large datasets.
     *
     * @default false
     */
    bulkOperationsSingleTransaction?: boolean;
    /**
     * Persist the changes made since the start of the transaction.
     */
    commitTransaction: CommitTransaction;
    /**
     * Open the connection to the database
     */
    connect?: Connect;
    count: Count;
    countGlobalVersions: CountGlobalVersions;
    countVersions: CountVersions;
    create: Create;
    createGlobal: CreateGlobal;
    createGlobalVersion: CreateGlobalVersion;
    /**
     * Output a migration file
     */
    createMigration: CreateMigration;
    createVersion: CreateVersion;
    /**
     * Specify if the ID is a text or number field by default within this database adapter.
     */
    defaultIDType: 'number' | 'text';
    deleteMany: DeleteMany;
    deleteOne: DeleteOne;
    deleteVersions: DeleteVersions;
    /**
     * Terminate the connection with the database
     */
    destroy?: Destroy;
    find: Find;
    findDistinct: FindDistinct;
    findGlobal: FindGlobal;
    findGlobalVersions: FindGlobalVersions;
    findOne: FindOne;
    findVersions: FindVersions;
    generateSchema?: GenerateSchema;
    /**
     * Perform startup tasks required to interact with the database such as building Schema and models
     */
    init?: Init;
    /**
     * Run any migration up functions that have not yet been performed and update the status
     */
    migrate: (args?: {
        migrations?: Migration[];
    }) => Promise<void>;
    /**
     * Run any migration down functions that have been performed
     */
    migrateDown: () => Promise<void>;
    /**
     * Drop the current database and run all migrate up functions
     */
    migrateFresh: (args: {
        forceAcceptWarning?: boolean;
    }) => Promise<void>;
    /**
     * Run all migration down functions before running up
     */
    migrateRefresh: () => Promise<void>;
    /**
     * Run all migrate down functions
     */
    migrateReset: () => Promise<void>;
    /**
     * Read the current state of migrations and output the result to show which have been run
     */
    migrateStatus: () => Promise<void>;
    /**
     * Path to read and write migration files from
     */
    migrationDir: string;
    /**
     * The name of the database adapter
     */
    name: string;
    /**
     * Full package name of the database adapter
     *
     * @example @payloadcms/db-postgres
     */
    packageName: string;
    /**
     * reference to the instance of payload
     */
    payload: Payload;
    queryDrafts: QueryDrafts;
    /**
     * Abort any changes since the start of the transaction.
     */
    rollbackTransaction: RollbackTransaction;
    /**
     * A key-value store of all sessions open (used for transactions)
     */
    sessions?: {
        [id: string]: {
            db: unknown;
            reject: () => Promise<void>;
            resolve: () => Promise<void>;
        };
    };
    /**
     * Updates a global that exists. If the global doesn't exist yet, this will not work - you should use `createGlobal` instead.
     */
    updateGlobal: UpdateGlobal;
    updateGlobalVersion: UpdateGlobalVersion;
    updateJobs: UpdateJobs;
    updateMany: UpdateMany;
    updateOne: UpdateOne;
    updateVersion: UpdateVersion;
    upsert: Upsert;
}
type Init = () => Promise<void> | void;
type ConnectArgs = {
    hotReload: boolean;
};
type Connect = (args?: ConnectArgs) => Promise<void>;
type Destroy = () => Promise<void>;
type CreateMigration = (args: {
    file?: string;
    forceAcceptWarning?: boolean;
    migrationName?: string;
    payload: Payload;
    /**
     * Skips the prompt asking to create empty migrations
     */
    skipEmpty?: boolean;
}) => Promise<void> | void;
type Transaction = (callback: () => Promise<void>, options?: Record<string, unknown>) => Promise<void>;
type BeginTransaction = (options?: Record<string, unknown>) => Promise<null | number | string>;
type RollbackTransaction = (id: number | Promise<number | string> | string) => Promise<void>;
type CommitTransaction = (id: number | Promise<number | string> | string) => Promise<void>;
type QueryDraftsArgs = {
    collection: CollectionSlug;
    joins?: JoinQuery;
    limit?: number;
    locale?: string;
    page?: number;
    pagination?: boolean;
    req?: Partial<PayloadRequest>;
    select?: SelectType;
    sort?: Sort;
    where?: Where;
};
type QueryDrafts = <T = TypeWithID>(args: QueryDraftsArgs) => Promise<PaginatedDocs<T>>;
type FindOneArgs = {
    collection: CollectionSlug;
    draftsEnabled?: boolean;
    joins?: JoinQuery;
    locale?: string;
    req?: Partial<PayloadRequest>;
    select?: SelectType;
    where?: Where;
};
type FindOne = <T extends TypeWithID>(args: FindOneArgs) => Promise<null | T>;
type FindArgs = {
    collection: CollectionSlug;
    draftsEnabled?: boolean;
    joins?: JoinQuery;
    /** Setting limit to 1 is equal to the previous Model.findOne(). Setting limit to 0 disables the limit */
    limit?: number;
    locale?: string;
    page?: number;
    pagination?: boolean;
    projection?: Record<string, unknown>;
    req?: Partial<PayloadRequest>;
    select?: SelectType;
    /**
     * @deprecated This parameter is going to be removed in the next major version. Use page instead.
     */
    skip?: number;
    sort?: Sort;
    versions?: boolean;
    where?: Where;
};
type Find = <T = TypeWithID>(args: FindArgs) => Promise<PaginatedDocs<T>>;
type CountArgs = {
    collection: CollectionSlug;
    locale?: string;
    req?: Partial<PayloadRequest>;
    where?: Where;
};
type Count = (args: CountArgs) => Promise<{
    totalDocs: number;
}>;
type CountVersions = (args: CountArgs) => Promise<{
    totalDocs: number;
}>;
type CountGlobalVersionArgs = {
    global: string;
    locale?: string;
    req?: Partial<PayloadRequest>;
    where?: Where;
};
type CountGlobalVersions = (args: CountGlobalVersionArgs) => Promise<{
    totalDocs: number;
}>;
type BaseVersionArgs = {
    limit?: number;
    locale?: string;
    page?: number;
    pagination?: boolean;
    req?: Partial<PayloadRequest>;
    select?: SelectType;
    /**
     * @deprecated This parameter is going to be removed in the next major version. Use page instead.
     */
    skip?: number;
    sort?: Sort;
    versions?: boolean;
    where?: Where;
};
type FindVersionsArgs = {
    collection: CollectionSlug;
} & BaseVersionArgs;
type FindVersions = <T = JsonObject>(args: FindVersionsArgs) => Promise<PaginatedDocs<TypeWithVersion<T>>>;
type FindGlobalVersionsArgs = {
    global: GlobalSlug;
} & BaseVersionArgs;
type FindGlobalArgs = {
    locale?: string;
    req?: Partial<PayloadRequest>;
    select?: SelectType;
    slug: string;
    where?: Where;
};
type UpdateGlobalVersionArgs<T extends JsonObject = JsonObject> = {
    global: GlobalSlug;
    locale?: string;
    /**
     * Additional database adapter specific options to pass to the query
     */
    options?: Record<string, unknown>;
    req?: Partial<PayloadRequest>;
    /**
     * If true, returns the updated documents
     *
     * @default true
     */
    returning?: boolean;
    select?: SelectType;
    versionData: {
        createdAt?: string;
        latest?: boolean;
        parent?: number | string;
        publishedLocale?: string;
        updatedAt?: string;
        version: T;
    };
} & ({
    id: number | string;
    where?: never;
} | {
    id?: never;
    where: Where;
});
/**
 * @todo type as Promise<TypeWithVersion<T> | null> in 4.0
 */
type UpdateGlobalVersion = <T extends JsonObject = JsonObject>(args: UpdateGlobalVersionArgs<T>) => Promise<TypeWithVersion<T>>;
type FindGlobal = <T extends Record<string, unknown> = any>(args: FindGlobalArgs) => Promise<T>;
type CreateGlobalArgs<T extends Record<string, unknown> = any> = {
    data: T;
    req?: Partial<PayloadRequest>;
    /**
     * If true, returns the updated documents
     *
     * @default true
     */
    returning?: boolean;
    slug: string;
};
type CreateGlobal = <T extends Record<string, unknown> = any>(args: CreateGlobalArgs<T>) => Promise<T>;
type UpdateGlobalArgs<T extends Record<string, unknown> = any> = {
    data: T;
    /**
     * Additional database adapter specific options to pass to the query
     */
    options?: Record<string, unknown>;
    req?: Partial<PayloadRequest>;
    /**
     * If true, returns the updated documents
     *
     * @default true
     */
    returning?: boolean;
    select?: SelectType;
    slug: string;
};
/**
 * @todo type as Promise<T | null> in 4.0
 */
type UpdateGlobal = <T extends Record<string, unknown> = any>(args: UpdateGlobalArgs<T>) => Promise<T>;
type FindGlobalVersions = <T = JsonObject>(args: FindGlobalVersionsArgs) => Promise<PaginatedDocs<TypeWithVersion<T>>>;
type DeleteVersionsArgs = {
    collection?: CollectionSlug;
    globalSlug?: GlobalSlug;
    locale?: string;
    req?: Partial<PayloadRequest>;
    sort?: {
        [key: string]: string;
    };
    where: Where;
};
type CreateVersionArgs<T extends JsonObject = JsonObject> = {
    autosave: boolean;
    collectionSlug: CollectionSlug;
    createdAt: string;
    /** ID of the parent document for which the version should be created for */
    parent: number | string;
    publishedLocale?: string;
    req?: Partial<PayloadRequest>;
    /**
     * If true, returns the updated documents
     *
     * @default true
     */
    returning?: boolean;
    select?: SelectType;
    /**
     * If provided, the snapshot will be created
     * after a version is created (not during autosave)
     */
    snapshot?: true;
    updatedAt: string;
    versionData: T;
};
type CreateVersion = <T extends JsonObject = JsonObject>(args: CreateVersionArgs<T>) => Promise<TypeWithVersion<T>>;
type CreateGlobalVersionArgs<T extends JsonObject = JsonObject> = {
    autosave: boolean;
    createdAt: string;
    globalSlug: GlobalSlug;
    publishedLocale?: string;
    req?: Partial<PayloadRequest>;
    /**
     * If true, returns the updated documents
     *
     * @default true
     */
    returning?: boolean;
    select?: SelectType;
    /**
     * If provided, the snapshot will be created
     * after a version is created (not during autosave)
     */
    snapshot?: true;
    updatedAt: string;
    versionData: T;
};
type CreateGlobalVersion = <T extends JsonObject = JsonObject>(args: CreateGlobalVersionArgs<T>) => Promise<Omit<TypeWithVersion<T>, 'parent'>>;
type DeleteVersions = (args: DeleteVersionsArgs) => Promise<void>;
type UpdateVersionArgs<T extends JsonObject = JsonObject> = {
    collection: CollectionSlug;
    locale?: string;
    /**
     * Additional database adapter specific options to pass to the query
     */
    options?: Record<string, unknown>;
    req?: Partial<PayloadRequest>;
    /**
     * If true, returns the updated documents
     *
     * @default true
     */
    returning?: boolean;
    select?: SelectType;
    versionData: {
        createdAt?: string;
        latest?: boolean;
        parent?: number | string;
        publishedLocale?: string;
        updatedAt?: string;
        version: T;
    };
} & ({
    id: number | string;
    where?: never;
} | {
    id?: never;
    where: Where;
});
/**
 * @todo type as Promise<TypeWithVersion<T> | null> in 4.0
 */
type UpdateVersion = <T extends JsonObject = JsonObject>(args: UpdateVersionArgs<T>) => Promise<TypeWithVersion<T>>;
type CreateArgs = {
    collection: CollectionSlug;
    data: Record<string, unknown>;
    draft?: boolean;
    locale?: string;
    req?: Partial<PayloadRequest>;
    /**
     * If true, returns the updated documents
     *
     * @default true
     */
    returning?: boolean;
    select?: SelectType;
};
type FindDistinctArgs = {
    collection: CollectionSlug;
    field: string;
    limit?: number;
    locale?: string;
    page?: number;
    req?: Partial<PayloadRequest>;
    sort?: Sort;
    where?: Where;
};
type PaginatedDistinctDocs<T extends Record<string, unknown>> = {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
    nextPage?: null | number | undefined;
    page: number;
    pagingCounter: number;
    prevPage?: null | number | undefined;
    totalDocs: number;
    totalPages: number;
    values: T[];
};
type FindDistinct = (args: FindDistinctArgs) => Promise<PaginatedDistinctDocs<Record<string, any>>>;
type Create = (args: CreateArgs) => Promise<Document>;
type UpdateOneArgs = {
    collection: CollectionSlug;
    data: Record<string, unknown>;
    draft?: boolean;
    joins?: JoinQuery;
    locale?: string;
    /**
     * Additional database adapter specific options to pass to the query
     */
    options?: Record<string, unknown>;
    req?: Partial<PayloadRequest>;
    /**
     * If true, returns the updated documents
     *
     * @default true
     */
    returning?: boolean;
    select?: SelectType;
} & ({
    id: number | string;
    where?: never;
} | {
    id?: never;
    where: Where;
});
/**
 * @todo type as Promise<Document | null> in 4.0
 */
type UpdateOne = (args: UpdateOneArgs) => Promise<Document>;
type UpdateManyArgs = {
    collection: CollectionSlug;
    data: Record<string, unknown>;
    draft?: boolean;
    joins?: JoinQuery;
    limit?: number;
    locale?: string;
    /**
     * Additional database adapter specific options to pass to the query
     */
    options?: Record<string, unknown>;
    req?: Partial<PayloadRequest>;
    /**
     * If true, returns the updated documents
     *
     * @default true
     */
    returning?: boolean;
    select?: SelectType;
    sort?: Sort;
    where: Where;
};
type UpdateMany = (args: UpdateManyArgs) => Promise<Document[] | null>;
type UpdateJobsArgs = {
    data: Record<string, unknown>;
    req?: Partial<PayloadRequest>;
    /**
     * If true, returns the updated documents
     *
     * @default true
     */
    returning?: boolean;
} & ({
    id: number | string;
    limit?: never;
    sort?: never;
    where?: never;
} | {
    id?: never;
    limit?: number;
    sort?: Sort;
    where: Where;
});
type UpdateJobs = (args: UpdateJobsArgs) => Promise<Job[] | null>;
type UpsertArgs = {
    collection: CollectionSlug;
    data: Record<string, unknown>;
    joins?: JoinQuery;
    locale?: string;
    req?: Partial<PayloadRequest>;
    /**
     * If true, returns the updated documents
     *
     * @default true
     */
    returning?: boolean;
    select?: SelectType;
    where: Where;
};
type Upsert = (args: UpsertArgs) => Promise<Document>;
type DeleteOneArgs = {
    collection: CollectionSlug;
    joins?: JoinQuery;
    req?: Partial<PayloadRequest>;
    /**
     * If true, returns the updated documents
     *
     * @default true
     */
    returning?: boolean;
    select?: SelectType;
    where: Where;
};
/**
 * @todo type as Promise<Document | null> in 4.0
 */
type DeleteOne = (args: DeleteOneArgs) => Promise<Document>;
type DeleteManyArgs = {
    collection: CollectionSlug;
    joins?: JoinQuery;
    req?: Partial<PayloadRequest>;
    where: Where;
};
type DeleteMany = (args: DeleteManyArgs) => Promise<void>;
type Migration = {
    down: (args: unknown) => Promise<void>;
    up: (args: unknown) => Promise<void>;
} & MigrationData;
type MigrationData = {
    batch?: number;
    id?: string;
    name: string;
};
type PaginatedDocs<T = any> = {
    docs: T[];
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
    nextPage?: null | number | undefined;
    page?: number;
    pagingCounter: number;
    prevPage?: null | number | undefined;
    totalDocs: number;
    totalPages: number;
};
type DatabaseAdapterResult<T = BaseDatabaseAdapter> = {
    allowIDOnCreate?: boolean;
    defaultIDType: 'number' | 'text';
    init: (args: {
        payload: Payload;
    }) => T;
    /**
     * The name of the database adapter. For example, "postgres" or "mongoose".
     *
     * @todo make required in 4.0
     */
    name?: string;
};
type DBIdentifierName = ((Args: {
    /** The name of the parent table when using relational DBs */
    tableName?: string;
}) => string) | string;
type MigrationTemplateArgs = {
    downSQL?: string;
    imports?: string;
    packageName?: string;
    upSQL?: string;
};
type GenerateSchemaArgs = {
    log?: boolean;
    outputFile?: string;
    prettify?: boolean;
};
type GenerateSchema = (args?: GenerateSchemaArgs) => Promise<void>;

type DataFromGlobalSlug<TSlug extends GlobalSlug> = TypedGlobal[TSlug];
type SelectFromGlobalSlug<TSlug extends GlobalSlug> = TypedGlobalSelect[TSlug];
type BeforeValidateHook$1 = (args: {
    context: RequestContext;
    data?: any;
    /** The global which this hook is being run on */
    global: SanitizedGlobalConfig;
    originalDoc?: any;
    req: PayloadRequest;
}) => any;
type BeforeChangeHook$1 = (args: {
    context: RequestContext;
    data: any;
    /** The global which this hook is being run on */
    global: SanitizedGlobalConfig;
    originalDoc?: any;
    req: PayloadRequest;
}) => any;
type AfterChangeHook$1 = (args: {
    context: RequestContext;
    data: any;
    doc: any;
    /** The global which this hook is being run on */
    global: SanitizedGlobalConfig;
    previousDoc: any;
    req: PayloadRequest;
}) => any;
type BeforeReadHook$1 = (args: {
    context: RequestContext;
    doc: any;
    /** The global which this hook is being run on */
    global: SanitizedGlobalConfig;
    req: PayloadRequest;
}) => any;
type AfterReadHook$1 = (args: {
    context: RequestContext;
    doc: any;
    findMany?: boolean;
    /** The global which this hook is being run on */
    global: SanitizedGlobalConfig;
    query?: Where;
    req: PayloadRequest;
}) => any;
type HookOperationType$1 = 'countVersions' | 'read' | 'restoreVersion' | 'update';
type BeforeOperationHook$1 = (args: {
    args?: any;
    context: RequestContext;
    /**
     * The Global which this hook is being run on
     * */
    global: SanitizedGlobalConfig;
    /**
     * Hook operation being performed
     */
    operation: HookOperationType$1;
    req: PayloadRequest;
}) => any;
type GlobalAdminOptions = {
    /**
     * Custom admin components
     */
    components?: {
        elements?: {
            /**
             * Inject custom components before the document controls
             */
            beforeDocumentControls?: CustomComponent[];
            Description?: EntityDescriptionComponent;
            /**
             * Replaces the "Preview" button
             */
            PreviewButton?: CustomComponent;
            /**
             * Replaces the "Publish" button
             * + drafts must be enabled
             */
            PublishButton?: CustomComponent;
            /**
             * Replaces the "Save" button
             * + drafts must be disabled
             */
            SaveButton?: CustomComponent;
            /**
             * Replaces the "Save Draft" button
             * + drafts must be enabled
             * + autosave must be disabled
             */
            SaveDraftButton?: CustomComponent;
            /**
             * Replaces the "Status" section
             */
            Status?: CustomStatus;
        };
        views?: {
            /**
             * Set to a React component to replace the entire Edit View, including all nested routes.
             * Set to an object to replace or modify individual nested routes, or to add new ones.
             */
            edit?: EditConfig;
        };
    };
    /** Extension point to add your custom data. Available in server and client. */
    custom?: GlobalAdminCustom;
    /**
     * Custom description for collection
     */
    description?: EntityDescription;
    /**
     * Specify a navigational group for globals in the admin sidebar.
     * - Provide a string to place the entity in a custom group.
     * - Provide a record to define localized group names.
     * - Set to `false` to exclude the entity from the sidebar / dashboard without disabling its routes.
     */
    group?: false | Record<string, string> | string;
    /**
     * Exclude the global from the admin nav and routes
     */
    hidden?: ((args: {
        user: PayloadRequest['user'];
    }) => boolean) | boolean;
    /**
     * Hide the API URL within the Edit View
     */
    hideAPIURL?: boolean;
    /**
     * Live preview options
     */
    livePreview?: LivePreviewConfig;
    meta?: MetaConfig;
    /**
     * Function to generate custom preview URL
     */
    preview?: GeneratePreviewURL;
};
type GlobalConfig<TSlug extends GlobalSlug = any> = {
    /**
     * Do not set this property manually. This is set to true during sanitization, to avoid
     * sanitizing the same global multiple times.
     */
    _sanitized?: boolean;
    access?: {
        read?: Access;
        readDrafts?: Access;
        readVersions?: Access;
        update?: Access;
    };
    admin?: GlobalAdminOptions;
    /** Extension point to add your custom data. Server only. */
    custom?: GlobalCustom;
    /**
     * Customize the SQL table name
     */
    dbName?: DBIdentifierName;
    endpoints?: false | Omit<Endpoint, 'root'>[];
    fields: Field[];
    /**
     * Specify which fields should be selected always, regardless of the `select` query which can be useful that the field exists for access control / hooks
     */
    forceSelect?: IsAny$1<SelectFromGlobalSlug<TSlug>> extends true ? SelectIncludeType : SelectFromGlobalSlug<TSlug>;
    graphQL?: {
        disableMutations?: true;
        disableQueries?: true;
        name?: string;
    } | false;
    hooks?: {
        afterChange?: AfterChangeHook$1[];
        afterRead?: AfterReadHook$1[];
        beforeChange?: BeforeChangeHook$1[];
        beforeOperation?: BeforeOperationHook$1[];
        beforeRead?: BeforeReadHook$1[];
        beforeValidate?: BeforeValidateHook$1[];
    };
    label?: LabelFunction | StaticLabel;
    /**
     * Enables / Disables the ability to lock documents while editing
     * @default true
     */
    lockDocuments?: {
        duration: number;
    } | false;
    slug: string;
    /**
     * Options used in typescript generation
     */
    typescript?: {
        /**
         * Typescript generation name given to the interface type
         */
        interface?: string;
    };
    versions?: boolean | IncomingGlobalVersions;
};
interface SanitizedGlobalConfig extends Omit<DeepRequired<GlobalConfig>, 'endpoints' | 'fields' | 'slug' | 'versions'> {
    endpoints: Endpoint[] | false;
    fields: Field[];
    /**
     * Fields in the database schema structure
     * Rows / collapsible / tabs w/o name `fields` merged to top, UIs are excluded
     */
    flattenedFields: FlattenedField$1[];
    slug: GlobalSlug;
    versions?: SanitizedGlobalVersions;
}
type Globals = {
    config: SanitizedGlobalConfig[];
    graphQL?: {
        [slug: string]: {
            mutationInputType: GraphQLNonNull<any>;
            type: GraphQLObjectType;
            versionType?: GraphQLObjectType;
        };
    } | false;
};

type TextFieldValidation = Validate<string, unknown, unknown, TextField>;
type TextFieldManyValidation = Validate<string[], unknown, unknown, TextField>;
type TextFieldSingleValidation = Validate<string, unknown, unknown, TextField>;
type PasswordFieldValidation = Validate<string, unknown, unknown, TextField>;
type ConfirmPasswordFieldValidation = Validate<string, unknown, {
    password: string;
}, TextField>;
type EmailFieldValidation = Validate<string, unknown, {
    username?: string;
}, EmailField>;
type UsernameFieldValidation = Validate<string, unknown, {
    email?: string;
}, TextField>;
type TextareaFieldValidation = Validate<string, unknown, unknown, TextareaField>;
type CodeFieldValidation = Validate<string, unknown, unknown, CodeField>;
type JSONFieldValidation = Validate<string, unknown, unknown, {
    jsonError?: string;
} & JSONField>;
type CheckboxFieldValidation = Validate<boolean, unknown, unknown, CheckboxField>;
type DateFieldValidation = Validate<Date, unknown, unknown, DateField>;
type RichTextFieldValidation = Validate<object, unknown, unknown, RichTextField>;
type NumberFieldValidation = Validate<number | number[], unknown, unknown, NumberField>;
type NumberFieldManyValidation = Validate<number[], unknown, unknown, NumberField>;
type NumberFieldSingleValidation = Validate<number, unknown, unknown, NumberField>;
type ArrayFieldValidation = Validate<unknown[], unknown, unknown, ArrayField>;
type BlocksFieldValidation = Validate<unknown, unknown, unknown, BlocksField>;
/**
 * This function validates the blocks in a blocks field against the provided filterOptions.
 * It will return a list of all block slugs found in the value, the allowed block slugs (if any),
 * and a list of invalid block slugs that are used despite being disallowed.
 *
 * @internal - this may break or be removed at any time
 */
declare function validateBlocksFilterOptions({ id, data, filterOptions, req, siblingData, value, }: {
    value: Parameters<BlocksFieldValidation>[0];
} & Pick<Parameters<BlocksFieldValidation>[1], 'data' | 'filterOptions' | 'id' | 'req' | 'siblingData'>): Promise<{
    /**
     * All block slugs found in the value of the blocks field
     */
    allBlockSlugs: string[];
    /**
     * All block slugs that are allowed. If undefined, all blocks are allowed.
     */
    allowedBlockSlugs: string[] | undefined;
    /**
     * A list of block slugs that are used despite being disallowed. If undefined, field passed validation.
     */
    invalidBlockSlugs: string[] | undefined;
}>;
type UploadFieldValidation = Validate<unknown, unknown, unknown, UploadField>;
type UploadFieldManyValidation = Validate<unknown[], unknown, unknown, UploadField>;
type UploadFieldSingleValidation = Validate<unknown, unknown, unknown, UploadField>;
type RelationshipFieldValidation = Validate<RelationshipValue, unknown, unknown, RelationshipField>;
type RelationshipFieldManyValidation = Validate<RelationshipValueMany, unknown, unknown, RelationshipField>;
type RelationshipFieldSingleValidation = Validate<RelationshipValueSingle, unknown, unknown, RelationshipField>;
type SelectFieldValidation = Validate<string | string[], unknown, unknown, SelectField>;
type SelectFieldManyValidation = Validate<string[], unknown, unknown, SelectField>;
type SelectFieldSingleValidation = Validate<string, unknown, unknown, SelectField>;
type RadioFieldValidation = Validate<unknown, unknown, unknown, RadioField>;
type PointFieldValidation = Validate<[
    number | string,
    number | string
], unknown, unknown, PointField>;
/**
 * Built-in field validations used by Payload
 *
 * These can be re-used in custom validations
 */
declare const validations: {
    array: ArrayFieldValidation;
    blocks: BlocksFieldValidation;
    checkbox: CheckboxFieldValidation;
    code: CodeFieldValidation;
    confirmPassword: ConfirmPasswordFieldValidation;
    date: DateFieldValidation;
    email: EmailFieldValidation;
    json: JSONFieldValidation;
    number: NumberFieldValidation;
    password: PasswordFieldValidation;
    point: PointFieldValidation;
    radio: RadioFieldValidation;
    relationship: RelationshipFieldValidation;
    richText: RichTextFieldValidation;
    select: SelectFieldValidation;
    text: TextFieldValidation;
    textarea: TextareaFieldValidation;
    upload: UploadFieldValidation;
};

type FieldHookArgs<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = {
    /**
     * The data of the nearest parent block. If the field is not within a block, `blockData` will be equal to `undefined`.
     */
    blockData: JsonObject | undefined;
    /** The collection which the field belongs to. If the field belongs to a global, this will be null. */
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    /**
     * Only available in `afterRead` hooks
     */
    currentDepth?: number;
    /**
     * Only available in `afterRead` hooks
     */
    /** The data passed to update the document within create and update operations, and the full document itself in the afterRead hook. */
    data?: Partial<TData>;
    /**
     * Only available in the `afterRead` hook.
     */
    depth?: number;
    draft?: boolean;
    /** The field which the hook is running against. */
    field: FieldAffectingData;
    /** Boolean to denote if this hook is running against finding one, or finding many within the afterRead hook. */
    findMany?: boolean;
    /** The global which the field belongs to. If the field belongs to a collection, this will be null. */
    global: null | SanitizedGlobalConfig;
    indexPath: number[];
    /** A string relating to which operation the field type is currently executing within. Useful within beforeValidate, beforeChange, and afterChange hooks to differentiate between create and update operations. */
    operation?: 'create' | 'delete' | 'read' | 'update';
    /** The full original document in `update` operations. In the `afterChange` hook, this is the resulting document of the operation. */
    originalDoc?: TData;
    overrideAccess?: boolean;
    /**
     * The path of the field, e.g. ["group", "myArray", 1, "textField"]. The path is the schemaPath but with indexes and would be used in the context of field data, not field schemas.
     */
    path: (number | string)[];
    /** The document before changes were applied, only in `afterChange` hooks. */
    previousDoc?: TData;
    /** The sibling data of the document before changes being applied, only in `beforeChange`, `beforeValidate`, `beforeDuplicate` and `afterChange` field hooks. */
    previousSiblingDoc?: TSiblingData;
    /** The previous value of the field, before changes, only in `beforeChange`, `afterChange`, `beforeDuplicate` and `beforeValidate` field hooks. */
    previousValue?: TValue;
    /** The Express request object. It is mocked for Local API operations. */
    req: PayloadRequest;
    /**
     * The schemaPath of the field, e.g. ["group", "myArray", "textField"]. The schemaPath is the path but without indexes and would be used in the context of field schemas, not field data.
     */
    schemaPath: string[];
    /**
     * Only available in the `afterRead` hook.
     */
    showHiddenFields?: boolean;
    /** The sibling data passed to a field that the hook is running against. */
    siblingData: Partial<TSiblingData>;
    /**
     * The original siblingData with locales (not modified by any hooks). Only available in `beforeChange` and `beforeDuplicate` field hooks.
     */
    siblingDocWithLocales?: Record<string, unknown>;
    /**
     * The sibling fields of the field which the hook is running against.
     */
    siblingFields: (Field | TabAsField)[];
    /** The value of the field. */
    value?: TValue;
};
type FieldHook<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = (args: FieldHookArgs<TData, TValue, TSiblingData>) => Promise<TValue> | TValue;
type FieldAccessArgs<TData extends TypeWithID = any, TSiblingData = any> = {
    /**
     * The data of the nearest parent block. If the field is not within a block, `blockData` will be equal to `undefined`.
     */
    blockData?: JsonObject | undefined;
    /**
     * The incoming, top-level document data used to `create` or `update` the document with.
     */
    data?: Partial<TData>;
    /**
     * The original data of the document before the `update` is applied. `doc` is undefined during the `create` operation.
     */
    doc?: TData;
    /**
     * The `id` of the current document being read or updated. `id` is undefined during the `create` operation.
     */
    id?: number | string;
    /** The `payload` object to interface with the payload API */
    req: PayloadRequest;
    /**
     * Immediately adjacent data to this field. For example, if this is a `group` field, then `siblingData` will be the other fields within the group.
     */
    siblingData?: Partial<TSiblingData>;
};
type FieldAccess<TData extends TypeWithID = any, TSiblingData = any> = (args: FieldAccessArgs<TData, TSiblingData>) => boolean | Promise<boolean>;
type Condition<TData extends TypeWithID = any, TSiblingData = any> = (
/**
 * The top-level document data
 */
data: Partial<TData>, 
/**
 * Immediately adjacent data to this field. For example, if this is a `group` field, then `siblingData` will be the other fields within the group.
 */
siblingData: Partial<TSiblingData>, { blockData, operation, path, user, }: {
    /**
     * The data of the nearest parent block. If the field is not within a block, `blockData` will be equal to `undefined`.
     */
    blockData: Partial<TData>;
    /**
     * A string relating to which operation the field type is currently executing within.
     */
    operation: Operation;
    /**
     * The path of the field, e.g. ["group", "myArray", 1, "textField"]. The path is the schemaPath but with indexes and would be used in the context of field data, not field schemas.
     */
    path: (number | string)[];
    user: PayloadRequest['user'];
}) => boolean;
type FilterOptionsProps<TData = any> = {
    /**
     * The data of the nearest parent block. Will be `undefined` if the field is not within a block or when called on a `Filter` component within the list view.
     */
    blockData: TData;
    /**
     * An object containing the full collection or global document currently being edited. Will be an empty object when called on a `Filter` component within the list view.
     */
    data: TData;
    /**
     * The `id` of the current document being edited. Will be undefined during the `create` operation or when called on a `Filter` component within the list view.
     */
    id: number | string;
    /**
     * The collection `slug` to filter against, limited to this field's `relationTo` property.
     */
    relationTo: CollectionSlug;
    req: PayloadRequest;
    /**
     * An object containing document data that is scoped to only fields within the same parent of this field. Will be an empty object when called on a `Filter` component within the list view.
     */
    siblingData: unknown;
    /**
     * An object containing the currently authenticated user.
     */
    user: Partial<PayloadRequest['user']>;
};
type FilterOptionsFunc<TData = any> = (options: FilterOptionsProps<TData>) => boolean | Promise<boolean | Where> | Where;
type FilterOptions<TData = any> = FilterOptionsFunc<TData> | null | Where;
type BlockSlugOrString = (({} & string) | BlockSlug)[];
type BlocksFilterOptionsProps<TData = any> = {
    /**
     * The `id` of the current document being edited. Will be undefined during the `create` operation.
     */
    id: number | string;
} & Pick<FilterOptionsProps<TData>, 'data' | 'req' | 'siblingData' | 'user'>;
type BlocksFilterOptions<TData = any> = ((options: BlocksFilterOptionsProps<TData>) => BlockSlugOrString | Promise<BlockSlugOrString | true> | true) | BlockSlugOrString;
type FieldAdmin = {
    className?: string;
    components?: {
        Cell?: PayloadComponent<DefaultServerCellComponentProps, DefaultCellComponentProps>;
        Description?: PayloadComponent<FieldDescriptionServerProps, FieldDescriptionClientProps>;
        Diff?: PayloadComponent<FieldDiffServerProps, FieldDiffClientProps>;
        Field?: PayloadComponent<FieldClientComponent | FieldServerComponent>;
        /**
         * The Filter component has to be a client component
         */
        Filter?: PayloadComponent;
    };
    /**
     * You can programmatically show / hide fields based on what other fields are doing.
     * This is also run on the server, to determine if the field should be validated.
     */
    condition?: Condition;
    /** Extension point to add your custom data. Available in server and client. */
    custom?: Record<string, any>;
    /**
     * The field description will be displayed next to the field in the admin UI. Additionally,
     * we use the field description to generate JSDoc comments for the generated TypeScript types.
     */
    description?: Description;
    disableBulkEdit?: boolean;
    disabled?: boolean;
    /**
     * Shows / hides fields from appearing in the list view groupBy options.
     * @type boolean
     */
    disableGroupBy?: boolean;
    /**
     * Shows / hides fields from appearing in the list view column selector.
     * @type boolean
     */
    disableListColumn?: boolean;
    /**
     * Shows / hides fields from appearing in the list view filter options.
     * @type boolean
     */
    disableListFilter?: boolean;
    hidden?: boolean;
    position?: 'sidebar';
    readOnly?: boolean;
    style?: CSSProperties;
    width?: CSSProperties['width'];
};
type AdminClient = {
    className?: string;
    /** Extension point to add your custom data. Available in server and client. */
    custom?: Record<string, any>;
    description?: StaticDescription;
    disableBulkEdit?: boolean;
    disabled?: boolean;
    /**
     * Shows / hides fields from appearing in the list view groupBy options.
     * @type boolean
     */
    disableGroupBy?: boolean;
    /**
     * Shows / hides fields from appearing in the list view column selector.
     * @type boolean
     */
    disableListColumn?: boolean;
    /**
     * Shows / hides fields from appearing in the list view filter options.
     * @type boolean
     */
    disableListFilter?: boolean;
    hidden?: boolean;
    position?: 'sidebar';
    readOnly?: boolean;
    style?: {
        '--field-width'?: CSSProperties['width'];
    } & CSSProperties;
    width?: CSSProperties['width'];
};
type Labels = {
    plural: LabelFunction | StaticLabel;
    singular: LabelFunction | StaticLabel;
};
type LabelsClient = {
    plural: StaticLabel;
    singular: StaticLabel;
};
type BaseValidateOptions<TData, TSiblingData, TValue> = {
    /**
     * The data of the nearest parent block. If the field is not within a block, `blockData` will be equal to `undefined`.
     */
    blockData: Partial<TData>;
    collectionSlug?: string;
    data: Partial<TData>;
    event?: 'onChange' | 'submit';
    id?: number | string;
    operation?: Operation;
    /**
     * The `overrideAccess` flag that was attached to the request. This is used to bypass access control checks for fields.
     */
    overrideAccess?: boolean;
    /**
     * The path of the field, e.g. ["group", "myArray", 1, "textField"]. The path is the schemaPath but with indexes and would be used in the context of field data, not field schemas.
     */
    path: (number | string)[];
    preferences: DocumentPreferences;
    previousValue?: TValue;
    req: PayloadRequest;
    required?: boolean;
    siblingData: Partial<TSiblingData>;
};
type ValidateOptions<TData, TSiblingData, TFieldConfig extends object, TValue> = BaseValidateOptions<TData, TSiblingData, TValue> & TFieldConfig;
type Validate<TValue = any, TData = any, TSiblingData = any, TFieldConfig extends object = object> = (value: null | TValue | undefined, options: ValidateOptions<TData, TSiblingData, TFieldConfig, TValue>) => Promise<string | true> | string | true;
type OptionLabel = (() => React$1.JSX.Element) | LabelFunction | React$1.JSX.Element | StaticLabel;
type OptionObject = {
    label: OptionLabel;
    value: string;
};
type Option = OptionObject | string;
type FieldGraphQLType = {
    graphQL?: {
        /**
         * Complexity for the query. This is used to limit the complexity of the join query.
         *
         * @default 10
         */
        complexity?: number;
    };
};
interface FieldBase {
    /**
     * Do not set this property manually. This is set to true during sanitization, to avoid
     * sanitizing the same field multiple times.
     */
    _sanitized?: boolean;
    access?: {
        create?: FieldAccess;
        read?: FieldAccess;
        update?: FieldAccess;
    };
    admin?: FieldAdmin;
    /** Extension point to add your custom data. Server only. */
    custom?: FieldCustom;
    defaultValue?: DefaultValue;
    hidden?: boolean;
    hooks?: {
        afterChange?: FieldHook[];
        afterRead?: FieldHook[];
        beforeChange?: FieldHook[];
        /**
         * Runs before a document is duplicated to prevent errors in unique fields or return null to use defaultValue.
         */
        beforeDuplicate?: FieldHook[];
        beforeValidate?: FieldHook[];
    };
    index?: boolean;
    label?: false | LabelFunction | StaticLabel;
    localized?: boolean;
    /**
     * The name of the field. Must be alphanumeric and cannot contain ' . '
     *
     * Must not be one of reserved field names: ['__v', 'salt', 'hash', 'file']
     * @link https://payloadcms.com/docs/fields/overview#field-names
     */
    name: string;
    required?: boolean;
    saveToJWT?: boolean | string;
    /**
     * Allows you to modify the base JSON schema that is generated during generate:types for this field.
     * This JSON schema will be used to generate the TypeScript interface of this field.
     */
    typescriptSchema?: Array<(args: {
        jsonSchema: JSONSchema4;
    }) => JSONSchema4>;
    unique?: boolean;
    validate?: Validate;
    /**
     * Pass `true` to disable field in the DB
     * for [Virtual Fields](https://payloadcms.com/blog/learn-how-virtual-fields-can-help-solve-common-cms-challenges):
     * A virtual field can be used in `admin.useAsTitle` only when linked to a relationship.
     */
    virtual?: boolean | string;
}
interface FieldBaseClient {
    admin?: AdminClient;
    hidden?: boolean;
    index?: boolean;
    label?: StaticLabel;
    localized?: boolean;
    /**
     * The name of the field. Must be alphanumeric and cannot contain ' . '
     *
     * Must not be one of reserved field names: ['__v', 'salt', 'hash', 'file']
     * @link https://payloadcms.com/docs/fields/overview#field-names
     */
    name: string;
    required?: boolean;
    saveToJWT?: boolean | string;
    /**
     * Allows you to modify the base JSON schema that is generated during generate:types for this field.
     * This JSON schema will be used to generate the TypeScript interface of this field.
     */
    typescriptSchema?: Array<(args: {
        jsonSchema: JSONSchema4;
    }) => JSONSchema4>;
    unique?: boolean;
}
type NumberField = {
    admin?: {
        /** Set this property to a string that will be used for browser autocomplete. */
        autoComplete?: string;
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<NumberFieldErrorClientComponent | NumberFieldErrorServerComponent>;
            Label?: CustomComponent<NumberFieldLabelClientComponent | NumberFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        /** Set this property to define a placeholder string for the field. */
        placeholder?: Record<string, string> | string;
        /** Set a value for the number field to increment / decrement using browser controls. */
        step?: number;
    } & FieldAdmin;
    /** Maximum value accepted. Used in the default `validate` function. */
    max?: number;
    /** Minimum value accepted. Used in the default `validate` function. */
    min?: number;
    type: 'number';
} & ({
    /** Makes this field an ordered array of numbers instead of just a single number. */
    hasMany: true;
    /** Maximum number of numbers in the numbers array, if `hasMany` is set to true. */
    maxRows?: number;
    /** Minimum number of numbers in the numbers array, if `hasMany` is set to true. */
    minRows?: number;
    validate?: NumberFieldManyValidation;
} | {
    /** Makes this field an ordered array of numbers instead of just a single number. */
    hasMany?: false | undefined;
    /** Maximum number of numbers in the numbers array, if `hasMany` is set to true. */
    maxRows?: undefined;
    /** Minimum number of numbers in the numbers array, if `hasMany` is set to true. */
    minRows?: undefined;
    validate?: NumberFieldSingleValidation;
}) & Omit<FieldBase, 'validate'>;
type NumberFieldClient = {
    admin?: AdminClient & Pick<NumberField['admin'], 'autoComplete' | 'placeholder' | 'step'>;
} & FieldBaseClient & Pick<NumberField, 'hasMany' | 'max' | 'maxRows' | 'min' | 'minRows' | 'type'>;
type TextField = {
    admin?: {
        autoComplete?: string;
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<TextFieldErrorClientComponent | TextFieldErrorServerComponent>;
            Label?: CustomComponent<TextFieldLabelClientComponent | TextFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        placeholder?: Record<string, string> | string;
        rtl?: boolean;
    } & FieldAdmin;
    maxLength?: number;
    minLength?: number;
    type: 'text';
} & ({
    /** Makes this field an ordered array of strings instead of just a single string. */
    hasMany: true;
    /** Maximum number of strings in the strings array, if `hasMany` is set to true. */
    maxRows?: number;
    /** Minimum number of strings in the strings array, if `hasMany` is set to true. */
    minRows?: number;
    validate?: TextFieldManyValidation;
} | {
    /** Makes this field an ordered array of strings instead of just a single string. */
    hasMany?: false | undefined;
    /** Maximum number of strings in the strings array, if `hasMany` is set to true. */
    maxRows?: undefined;
    /** Minimum number of strings in the strings array, if `hasMany` is set to true. */
    minRows?: undefined;
    validate?: TextFieldSingleValidation;
}) & Omit<FieldBase, 'validate'>;
type TextFieldClient = {
    admin?: AdminClient & PickPreserveOptional<NonNullable<TextField['admin']>, 'autoComplete' | 'placeholder' | 'rtl'>;
} & FieldBaseClient & Pick<TextField, 'hasMany' | 'maxLength' | 'maxRows' | 'minLength' | 'minRows' | 'type'>;
type EmailField = {
    admin?: {
        autoComplete?: string;
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<EmailFieldErrorClientComponent | EmailFieldErrorServerComponent>;
            Label?: CustomComponent<EmailFieldLabelClientComponent | EmailFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        placeholder?: Record<string, string> | string;
    } & FieldAdmin;
    type: 'email';
    validate?: EmailFieldValidation;
} & Omit<FieldBase, 'validate'>;
type EmailFieldClient = {
    admin?: AdminClient & PickPreserveOptional<NonNullable<EmailField['admin']>, 'autoComplete' | 'placeholder'>;
} & FieldBaseClient & Pick<EmailField, 'type'>;
type TextareaField = {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<TextareaFieldErrorClientComponent | TextareaFieldErrorServerComponent>;
            Label?: CustomComponent<TextareaFieldLabelClientComponent | TextareaFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        placeholder?: Record<string, string> | string;
        rows?: number;
        rtl?: boolean;
    } & FieldAdmin;
    maxLength?: number;
    minLength?: number;
    type: 'textarea';
    validate?: TextareaFieldValidation;
} & Omit<FieldBase, 'validate'>;
type TextareaFieldClient = {
    admin?: AdminClient & PickPreserveOptional<NonNullable<TextareaField['admin']>, 'placeholder' | 'rows' | 'rtl'>;
} & FieldBaseClient & Pick<TextareaField, 'maxLength' | 'minLength' | 'type'>;
type CheckboxField = {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<CheckboxFieldErrorClientComponent | CheckboxFieldErrorServerComponent>;
            Label?: CustomComponent<CheckboxFieldLabelClientComponent | CheckboxFieldLabelServerComponent>;
        } & FieldAdmin['components'];
    } & FieldAdmin;
    type: 'checkbox';
    validate?: CheckboxFieldValidation;
} & Omit<FieldBase, 'validate'>;
type CheckboxFieldClient = {
    admin?: AdminClient;
} & FieldBaseClient & Pick<CheckboxField, 'type'>;
type DateFieldTimezoneConfigBase = {
    /**
     * Make only the timezone required in the admin interface. This means a timezone is always required to be selected.
     */
    required?: boolean;
    supportedTimezones?: Timezone[];
} & Pick<TimezonesConfig, 'defaultTimezone'>;
type DateFieldTimezoneConfig = {
    /**
     * A function used to override the timezone field at a granular level.
     * Passes the base select field to you to manipulate beyond the exposed options.
     * @example
     * ```ts
     * {
     *   type: 'date',
     *   name: 'publishedAt',
     *   timezone: {
     *     override: ({ baseField }) => ({
     *       ...baseField,
     *       admin: {
     *         ...baseField.admin,
     *         hidden: false,
     *       },
     *     }),
     *   },
     * }
     * ```
     */
    override?: (args: {
        baseField: SelectField;
    }) => Field;
} & DateFieldTimezoneConfigBase;
type DateFieldTimezoneConfigClient = DateFieldTimezoneConfigBase;
type DateField = {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<DateFieldErrorClientComponent | DateFieldErrorServerComponent>;
            Label?: CustomComponent<DateFieldLabelClientComponent | DateFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        date?: ConditionalDateProps;
        placeholder?: Record<string, string> | string;
    } & FieldAdmin;
    /**
     * Enable timezone selection in the admin interface.
     */
    timezone?: DateFieldTimezoneConfig | true;
    type: 'date';
    validate?: DateFieldValidation;
} & Omit<FieldBase, 'validate'>;
type DateFieldClient = {
    admin?: AdminClient & Pick<DateField['admin'], 'date' | 'placeholder'>;
    /**
     * Enable timezone selection in the admin interface.
     * Note: The `override` function is stripped on the client.
     */
    timezone?: DateFieldTimezoneConfigClient | true;
} & FieldBaseClient & Pick<DateField, 'type'>;
type GroupBase = {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Label?: CustomComponent<GroupFieldLabelClientComponent | GroupFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        hideGutter?: boolean;
    } & FieldAdmin;
    fields: Field[];
    type: 'group';
    validate?: Validate<unknown, unknown, unknown, GroupField>;
} & Omit<FieldBase, 'validate'>;
type NamedGroupField = {
    /** Customize generated GraphQL and Typescript schema names.
     * By default, it is bound to the collection.
     *
     * This is useful if you would like to generate a top level type to share amongst collections/fields.
     * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
     */
    interfaceName?: string;
} & GroupBase;
type UnnamedGroupField = {
    interfaceName?: never;
    localized?: never;
} & Omit<GroupBase, 'hooks' | 'name' | 'virtual'>;
type GroupField = NamedGroupField | UnnamedGroupField;
type UnnamedGroupFieldClient = {
    admin?: AdminClient & Pick<UnnamedGroupField['admin'], 'hideGutter'>;
    fields: ClientField[];
} & Omit<FieldBaseClient, 'name' | 'required'> & Pick<UnnamedGroupField, 'label' | 'type'>;
type NamedGroupFieldClient = Pick<NamedGroupField, 'name'> & UnnamedGroupFieldClient;
type GroupFieldClient = NamedGroupFieldClient | UnnamedGroupFieldClient;
type RowField = {
    admin?: Omit<FieldAdmin, 'description'>;
    fields: Field[];
    type: 'row';
} & Omit<FieldBase, 'admin' | 'hooks' | 'label' | 'localized' | 'name' | 'validate' | 'virtual'>;
type RowFieldClient = {
    admin?: Omit<AdminClient, 'description'>;
    fields: ClientField[];
} & Omit<FieldBaseClient, 'admin' | 'label' | 'name'> & Pick<RowField, 'type'>;
type CollapsibleField = {
    fields: Field[];
    type: 'collapsible';
} & ({
    admin: {
        components: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Label: CustomComponent<CollapsibleFieldLabelClientComponent | CollapsibleFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        initCollapsed?: boolean;
    } & FieldAdmin;
    label?: Required<FieldBase['label']>;
} | {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Label?: CustomComponent<CollapsibleFieldLabelClientComponent | CollapsibleFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        initCollapsed?: boolean;
    } & FieldAdmin;
    label: Required<FieldBase['label']>;
}) & Omit<FieldBase, 'hooks' | 'label' | 'localized' | 'name' | 'validate' | 'virtual'>;
type CollapsibleFieldClient = {
    admin?: {
        initCollapsed?: boolean;
    } & AdminClient;
    fields: ClientField[];
    label: StaticLabel;
} & Omit<FieldBaseClient, 'label' | 'name' | 'validate'> & Pick<CollapsibleField, 'type'>;
type TabBase = {
    /**
     * @deprecated
     * Use `admin.description` instead. This will be removed in a future major version.
     */
    description?: LabelFunction | StaticDescription;
    fields: Field[];
    id?: string;
    interfaceName?: string;
    saveToJWT?: boolean | string;
} & Omit<FieldBase, 'required' | 'validate'>;
type NamedTab = {
    /** Customize generated GraphQL and Typescript schema names.
     * The slug is used by default.
     *
     * This is useful if you would like to generate a top level type to share amongst collections/fields.
     * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
     */
    interfaceName?: string;
} & TabBase;
type UnnamedTab = {
    interfaceName?: never;
    /**
     * Can be either:
     * - A string, which will be used as the tab's label.
     * - An object, where the key is the language code and the value is the label.
     */
    label: {
        [selectedLanguage: string]: string;
    } | LabelFunction | string;
    localized?: never;
} & Omit<TabBase, 'hooks' | 'name' | 'virtual'>;
type Tab = NamedTab | UnnamedTab;
type TabsField = {
    admin?: Omit<FieldAdmin, 'description'>;
    type: 'tabs';
} & {
    tabs: Tab[];
} & Omit<FieldBase, 'admin' | 'localized' | 'name' | 'saveToJWT' | 'virtual'>;
type TabsFieldClient = {
    admin?: Omit<AdminClient, 'description'>;
    tabs: ClientTab[];
} & Omit<FieldBaseClient, 'admin' | 'localized' | 'name' | 'saveToJWT'> & Pick<TabsField, 'type'>;
type TabAsField = {
    name?: string;
    type: 'tab';
} & Tab;
type TabAsFieldClient = ClientTab & Pick<TabAsField, 'name' | 'type'>;
type UIField = {
    admin: {
        components?: {
            /**
             * Allow any custom components to be added to the UI field. This allows
             * the UI field to be used as a vessel for getting components rendered.
             */
            [key: string]: PayloadComponent | undefined;
            Cell?: CustomComponent;
            Field?: CustomComponent;
            /**
             * The Filter component has to be a client component
             */
            Filter?: PayloadComponent;
        } & FieldAdmin['components'];
        condition?: Condition;
        /** Extension point to add your custom data. Available in server and client. */
        custom?: Record<string, any>;
        /**
         * Set `false` make the UI field appear in the list view column selector. `true` by default for UI fields.
         * @default true
         */
        disableBulkEdit?: boolean;
        /**
         * Shows / hides fields from appearing in the list view column selector.
         * @type boolean
         */
        disableListColumn?: boolean;
        position?: string;
        width?: CSSProperties['width'];
    };
    /** Extension point to add your custom data. Server only. */
    custom?: Record<string, any>;
    label?: Record<string, string> | string;
    name: string;
    type: 'ui';
};
type UIFieldClient = {
    admin: DeepUndefinable<FieldBaseClient['admin']> & Pick<UIField['admin'], 'custom' | 'disableBulkEdit' | 'disableListColumn' | 'position' | 'width'>;
} & Omit<DeepUndefinable<FieldBaseClient>, 'admin'> & // still include FieldBaseClient (even if it's undefinable) so that we don't need constant type checks (e.g. if('xy' in field))
Pick<UIField, 'label' | 'name' | 'type'>;
type SharedUploadProperties = {
    /**
     * Toggle the preview in the admin interface.
     */
    displayPreview?: boolean;
    filterOptions?: FilterOptions;
    /**
     * Sets a maximum population depth for this field, regardless of the remaining depth when this field is reached.
     *
     * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
     */
    maxDepth?: number;
    type: 'upload';
} & ({
    hasMany: true;
    /**
     * @deprecated Use 'maxRows' instead
     */
    max?: number;
    maxRows?: number;
    /**
     * @deprecated Use 'minRows' instead
     */
    min?: number;
    minRows?: number;
    validate?: UploadFieldManyValidation;
} | {
    hasMany?: false | undefined;
    /**
     * @deprecated Use 'maxRows' instead
     */
    max?: undefined;
    maxRows?: undefined;
    /**
     * @deprecated Use 'minRows' instead
     */
    min?: undefined;
    minRows?: undefined;
    validate?: UploadFieldSingleValidation;
}) & FieldGraphQLType & Omit<FieldBase, 'validate'>;
type SharedUploadPropertiesClient = FieldBaseClient & Pick<SharedUploadProperties, 'hasMany' | 'max' | 'maxDepth' | 'maxRows' | 'min' | 'minRows' | 'type'>;
type UploadAdmin = {
    allowCreate?: boolean;
    components?: {
        afterInput?: CustomComponent[];
        beforeInput?: CustomComponent[];
        Error?: CustomComponent<RelationshipFieldErrorClientComponent | RelationshipFieldErrorServerComponent>;
        Label?: CustomComponent<RelationshipFieldLabelClientComponent | RelationshipFieldLabelServerComponent>;
    } & FieldAdmin['components'];
    isSortable?: boolean;
} & FieldAdmin;
type UploadAdminClient = AdminClient & Pick<UploadAdmin, 'allowCreate' | 'isSortable'>;
type PolymorphicUploadField = {
    admin?: {
        sortOptions?: Partial<Record<CollectionSlug, string>>;
    } & UploadAdmin;
    /**
     * @todo v4: make relationTo: [] fail type checking
     */
    relationTo: CollectionSlug[];
} & SharedUploadProperties;
type PolymorphicUploadFieldClient = {
    admin?: {
        sortOptions?: Pick<PolymorphicUploadField['admin'], 'sortOptions'>;
    } & UploadAdminClient;
} & Pick<PolymorphicUploadField, 'displayPreview' | 'maxDepth' | 'relationTo' | 'type'> & SharedUploadPropertiesClient;
type SingleUploadField = {
    admin?: {
        sortOptions?: string;
    } & UploadAdmin;
    relationTo: CollectionSlug;
} & SharedUploadProperties;
type SingleUploadFieldClient = {
    admin?: Pick<SingleUploadField['admin'], 'sortOptions'> & UploadAdminClient;
} & Pick<SingleUploadField, 'displayPreview' | 'maxDepth' | 'relationTo' | 'type'> & SharedUploadPropertiesClient;
type UploadField = PolymorphicUploadField | SingleUploadField;
type UploadFieldClient = PolymorphicUploadFieldClient | SingleUploadFieldClient;
type CodeField = {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<CodeFieldErrorClientComponent | CodeFieldErrorServerComponent>;
            Label?: CustomComponent<CodeFieldLabelClientComponent | CodeFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        editorOptions?: EditorProps['options'];
        editorProps?: Partial<EditorProps>;
        language?: string;
    } & FieldAdmin;
    maxLength?: number;
    minLength?: number;
    type: 'code';
    validate?: CodeFieldValidation;
} & Omit<FieldBase, 'admin' | 'validate'>;
type CodeFieldClient = {
    admin?: AdminClient & Partial<Pick<CodeField['admin'], 'editorOptions' | 'editorProps' | 'language'>>;
} & Omit<FieldBaseClient, 'admin'> & Pick<CodeField, 'maxLength' | 'minLength' | 'type'>;
type JSONField = {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<JSONFieldErrorClientComponent | JSONFieldErrorServerComponent>;
            Label?: CustomComponent<JSONFieldLabelClientComponent | JSONFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        editorOptions?: EditorProps['options'];
        maxHeight?: number;
    } & FieldAdmin;
    jsonSchema?: {
        fileMatch: string[];
        schema: JSONSchema4;
        uri: string;
    };
    type: 'json';
    validate?: JSONFieldValidation;
} & Omit<FieldBase, 'admin' | 'validate'>;
type JSONFieldClient = {
    admin?: AdminClient & Pick<JSONField['admin'], 'editorOptions' | 'maxHeight'>;
} & Omit<FieldBaseClient, 'admin'> & Pick<JSONField, 'jsonSchema' | 'type'>;
type SelectField = {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<SelectFieldErrorClientComponent | SelectFieldErrorServerComponent>;
            Label?: CustomComponent<SelectFieldLabelClientComponent | SelectFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        isClearable?: boolean;
        isSortable?: boolean;
        placeholder?: LabelFunction | string;
    } & FieldAdmin;
    /**
     * Customize the SQL table name
     */
    dbName?: DBIdentifierName;
    /**
     * Customize the DB enum name
     */
    enumName?: DBIdentifierName;
    /**
     * Reduce the available options based on the current user, value of another field, etc.
     * Similar to the `filterOptions` property on `relationship` and `upload` fields, except with a different return type.
     */
    filterOptions?: (args: {
        data: Data;
        options: Option[];
        req: PayloadRequest;
        siblingData: Data;
    }) => Option[];
    hasMany?: boolean;
    /**
     * Customize generated GraphQL and Typescript schema names.
     * By default, it is bound to the collection.
     *
     * This is useful if you would like to generate a top level type to share amongst collections/fields.
     * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
     */
    interfaceName?: string;
    options: Option[];
    type: 'select';
} & ({
    hasMany: true;
    validate?: SelectFieldManyValidation;
} | {
    hasMany?: false | undefined;
    validate?: SelectFieldSingleValidation;
}) & Omit<FieldBase, 'validate'>;
type SelectFieldClient = {
    admin?: AdminClient & Pick<SelectField['admin'], 'isClearable' | 'isSortable' | 'placeholder'>;
} & FieldBaseClient & Pick<SelectField, 'hasMany' | 'interfaceName' | 'options' | 'type'>;
type SharedRelationshipProperties = {
    filterOptions?: FilterOptions;
    /**
     * Sets a maximum population depth for this field, regardless of the remaining depth when this field is reached.
     *
     * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
     */
    maxDepth?: number;
    type: 'relationship';
} & ({
    hasMany: true;
    /**
     * @deprecated Use 'maxRows' instead
     */
    max?: number;
    maxRows?: number;
    /**
     * @deprecated Use 'minRows' instead
     */
    min?: number;
    minRows?: number;
    validate?: RelationshipFieldManyValidation;
} | {
    hasMany?: false | undefined;
    /**
     * @deprecated Use 'maxRows' instead
     */
    max?: undefined;
    maxRows?: undefined;
    /**
     * @deprecated Use 'minRows' instead
     */
    min?: undefined;
    minRows?: undefined;
    validate?: RelationshipFieldSingleValidation;
}) & FieldGraphQLType & Omit<FieldBase, 'validate'>;
type SharedRelationshipPropertiesClient = FieldBaseClient & Pick<SharedRelationshipProperties, 'hasMany' | 'max' | 'maxDepth' | 'maxRows' | 'min' | 'minRows' | 'type'>;
type RelationshipAdmin = {
    allowCreate?: boolean;
    allowEdit?: boolean;
    appearance?: 'drawer' | 'select';
    components?: {
        afterInput?: CustomComponent[];
        beforeInput?: CustomComponent[];
        Error?: CustomComponent<RelationshipFieldErrorClientComponent | RelationshipFieldErrorServerComponent>;
        Label?: CustomComponent<RelationshipFieldLabelClientComponent | RelationshipFieldLabelServerComponent>;
    } & FieldAdmin['components'];
    isSortable?: boolean;
    placeholder?: LabelFunction | string;
} & FieldAdmin;
type RelationshipAdminClient = AdminClient & Pick<RelationshipAdmin, 'allowCreate' | 'allowEdit' | 'appearance' | 'isSortable' | 'placeholder'>;
type PolymorphicRelationshipField = {
    admin?: {
        sortOptions?: Partial<Record<CollectionSlug, string>>;
    } & RelationshipAdmin;
    /**
     * @todo v4: make relationTo: [] fail type checking
     */
    relationTo: CollectionSlug[];
} & SharedRelationshipProperties;
type PolymorphicRelationshipFieldClient = {
    admin?: {
        sortOptions?: PolymorphicRelationshipField['admin']['sortOptions'];
    } & RelationshipAdminClient;
} & Pick<PolymorphicRelationshipField, 'relationTo'> & SharedRelationshipPropertiesClient;
type SingleRelationshipField = {
    admin?: {
        sortOptions?: string;
    } & RelationshipAdmin;
    relationTo: CollectionSlug;
} & SharedRelationshipProperties;
type SingleRelationshipFieldClient = {
    admin?: Partial<Pick<SingleRelationshipField['admin'], 'sortOptions'>> & RelationshipAdminClient;
} & Pick<SingleRelationshipField, 'relationTo'> & SharedRelationshipPropertiesClient;
type RelationshipField = PolymorphicRelationshipField | SingleRelationshipField;
type RelationshipFieldClient = PolymorphicRelationshipFieldClient | SingleRelationshipFieldClient;
type ValueWithRelation = {
    relationTo: CollectionSlug;
    value: number | string;
};
type RelationshipValue = RelationshipValueMany | RelationshipValueSingle;
type RelationshipValueMany = (number | string)[] | ValueWithRelation[];
type RelationshipValueSingle = number | string | ValueWithRelation;
type RichTextField<TValue extends object = any, TAdapterProps = any, TExtraProperties = object> = {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent;
            Label?: CustomComponent;
        } & FieldAdmin['components'];
    } & FieldAdmin;
    editor?: RichTextAdapter<TValue, TAdapterProps, TExtraProperties> | RichTextAdapterProvider<TValue, TAdapterProps, TExtraProperties>;
    /**
     * Sets a maximum population depth for this field, regardless of the remaining depth when this field is reached.
     *
     * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
     */
    maxDepth?: number;
    type: 'richText';
    validate?: RichTextFieldValidation;
} & Omit<FieldBase, 'validate'> & TExtraProperties;
type RichTextFieldClient<TValue extends object = any, TAdapterProps = any, TExtraProperties = object> = FieldBaseClient & Pick<RichTextField<TValue, TAdapterProps, TExtraProperties>, 'maxDepth' | 'type'> & TExtraProperties;
type ArrayField = {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<ArrayFieldErrorClientComponent | ArrayFieldErrorServerComponent>;
            Label?: CustomComponent<ArrayFieldLabelClientComponent | ArrayFieldLabelServerComponent>;
            RowLabel?: RowLabelComponent;
        } & FieldAdmin['components'];
        initCollapsed?: boolean;
        /**
         * Disable drag and drop sorting
         */
        isSortable?: boolean;
    } & FieldAdmin;
    /**
     * Customize the SQL table name
     */
    dbName?: DBIdentifierName;
    fields: Field[];
    /** Customize generated GraphQL and Typescript schema names.
     * By default, it is bound to the collection.
     *
     * This is useful if you would like to generate a top level type to share amongst collections/fields.
     * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
     */
    interfaceName?: string;
    labels?: Labels;
    maxRows?: number;
    minRows?: number;
    type: 'array';
    validate?: ArrayFieldValidation;
} & Omit<FieldBase, 'validate'>;
type ArrayFieldClient = {
    admin?: AdminClient & Pick<ArrayField['admin'], 'initCollapsed' | 'isSortable'>;
    fields: ClientField[];
    labels?: LabelsClient;
} & FieldBaseClient & Pick<ArrayField, 'interfaceName' | 'maxRows' | 'minRows' | 'type'>;
type RadioField = {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<RadioFieldErrorClientComponent | RadioFieldErrorServerComponent>;
            Label?: CustomComponent<RadioFieldLabelClientComponent | RadioFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        layout?: 'horizontal' | 'vertical';
    } & FieldAdmin;
    /**
     * Customize the SQL table name
     */
    dbName?: DBIdentifierName;
    /**
     * Customize the DB enum name
     */
    enumName?: DBIdentifierName;
    /** Customize generated GraphQL and Typescript schema names.
     * By default, it is bound to the collection.
     *
     * This is useful if you would like to generate a top level type to share amongst collections/fields.
     * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
     */
    interfaceName?: string;
    options: Option[];
    type: 'radio';
    validate?: RadioFieldValidation;
} & Omit<FieldBase, 'validate'>;
type RadioFieldClient = {
    admin?: AdminClient & Pick<RadioField['admin'], 'layout'>;
} & FieldBaseClient & Pick<RadioField, 'interfaceName' | 'options' | 'type'>;
type BlockFields = {
    [key: string]: any;
    blockName?: string;
    blockType?: string;
};
type BlockJSX = {
    /**
     * Override the default regex used to search for the start of the block in the JSX.
     * By default, it's <BlockSlugHere
     */
    customEndRegex?: {
        /**
         * Whether the end match is optional. If true, the end match is
         * not required to match for the transformer to be triggered.
         * The entire text from regexpStart to the end of the document will then be matched.
         */
        optional?: true;
        regExp: RegExp;
    } | RegExp;
    /**
     * Override the default regex used to search for the start of the block in the JSX.
     * By default, it's <BlockSlugHere/>
     */
    customStartRegex?: RegExp;
    /**
     * By default, all spaces at the beginning and end of every line of the
     * children (text between the open and close match) are removed.
     * Set this to true to disable this behavior.
     */
    doNotTrimChildren?: boolean;
    /**
     * Function that receives the data for a given block and returns a JSX representation of it.
     *
     * This is used to convert Lexical => JSX
     */
    export: (props: {
        fields: BlockFields;
        lexicalToMarkdown: (props: {
            editorState: Record<string, any>;
        }) => string;
    }) => {
        children?: string;
        props?: object;
    } | false | string;
    /**
     * Function that receives the markdown string and parsed
     * JSX props for a given matched block and returns a Lexical representation of it.
     *
     * This is used to convert JSX => Lexical
     */
    import: (props: {
        children: string;
        closeMatch: null | RegExpMatchArray;
        htmlToLexical?: ((props: {
            html: string;
        }) => any) | null;
        markdownToLexical: (props: {
            markdown: string;
        }) => Record<string, any>;
        openMatch?: RegExpMatchArray;
        props: Record<string, any>;
    }) => BlockFields | false;
};
type Block = {
    /**
     * Do not set this property manually. This is set to true during sanitization, to avoid
     * sanitizing the same block multiple times.
     */
    _sanitized?: boolean;
    admin?: {
        components?: {
            /**
             * This will replace the entire block component, including the block header / collapsible.
             */
            Block?: PayloadComponent<any, any>;
            Label?: PayloadComponent<any, any>;
        };
        /** Extension point to add your custom data. Available in server and client. */
        custom?: Record<string, any>;
        /**
         * Hides the block name field from the Block's header
         *
         * @default false
         */
        disableBlockName?: boolean;
        group?: Record<string, string> | string;
        jsx?: PayloadComponent;
    };
    /** Extension point to add your custom data. Server only. */
    custom?: Record<string, any>;
    /**
     * Customize the SQL table name
     */
    dbName?: DBIdentifierName;
    fields: Field[];
    /** @deprecated - please migrate to the interfaceName property instead. */
    graphQL?: {
        singularName?: string;
    };
    imageAltText?: string;
    /**
     * Preferred aspect ratio of the image is 3 : 2
     */
    imageURL?: string;
    /** Customize generated GraphQL and Typescript schema names.
     * The slug is used by default.
     *
     * This is useful if you would like to generate a top level type to share amongst collections/fields.
     * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
     */
    interfaceName?: string;
    jsx?: BlockJSX;
    labels?: Labels;
    slug: string;
};
type ClientBlock = {
    admin?: Pick<Block['admin'], 'custom' | 'disableBlockName' | 'group'>;
    fields: ClientField[];
    labels?: LabelsClient;
} & Pick<Block, 'imageAltText' | 'imageURL' | 'jsx' | 'slug'>;
type BlocksField = {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<BlocksFieldErrorClientComponent | BlocksFieldErrorServerComponent>;
            Label?: CustomComponent<BlocksFieldLabelClientComponent | BlocksFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        initCollapsed?: boolean;
        /**
         * Disable drag and drop sorting
         */
        isSortable?: boolean;
    } & FieldAdmin;
    /**
     * Like `blocks`, but allows you to also pass strings that are slugs of blocks defined in `config.blocks`.
     *
     * @todo `blockReferences` will be merged with `blocks` in 4.0
     */
    blockReferences?: (Block | BlockSlug)[];
    blocks: Block[];
    defaultValue?: DefaultValue;
    /**
     * Blocks can be conditionally enabled using the `filterOptions` property on the blocks field.
     * It allows you to provide a function that returns which block slugs should be available based on the given context.
     *
     * @behavior
     *
     * - `filterOptions` is re-evaluated as part of the form state request, whenever the document data changes.
     * - If a block is present in the field but no longer allowed by `filterOptions`, a validation error will occur when saving.
     *
     * @example
     *
     * ```ts
     * {
     *   name: 'blocksWithDynamicFilterOptions',
     *   type: 'blocks',
     *   filterOptions: ({ siblingData }) => {
     *     return siblingData?.enabledBlocks?.length
     *       ? [siblingData.enabledBlocks] // allow only the matching block
     *       : true // allow all blocks if no value is set
     *   },
     *   blocks: [
     *     { slug: 'block1', fields: [{ type: 'text', name: 'block1Text' }] },
     *     { slug: 'block2', fields: [{ type: 'text', name: 'block2Text' }] },
     *     { slug: 'block3', fields: [{ type: 'text', name: 'block3Text' }] },
     *   ],
     * }
     * ```
     * In this example, the list of available blocks is determined by the enabledBlocks sibling field. If no value is set, all blocks remain available.
     */
    filterOptions?: BlocksFilterOptions;
    labels?: Labels;
    maxRows?: number;
    minRows?: number;
    type: 'blocks';
    validate?: BlocksFieldValidation;
} & Omit<FieldBase, 'validate'>;
type BlocksFieldClient = {
    admin?: AdminClient & Pick<BlocksField['admin'], 'initCollapsed' | 'isSortable'>;
    /**
     * Like `blocks`, but allows you to also pass strings that are slugs of blocks defined in `config.blocks`.
     *
     * @todo `blockReferences` will be merged with `blocks` in 4.0
     */
    blockReferences?: (ClientBlock | string)[];
    blocks: ClientBlock[];
    labels?: LabelsClient;
} & FieldBaseClient & Pick<BlocksField, 'maxRows' | 'minRows' | 'type'>;
type PointField = {
    admin?: {
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<PointFieldErrorClientComponent | PointFieldErrorServerComponent>;
            Label?: CustomComponent<PointFieldLabelClientComponent | PointFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        placeholder?: Record<string, string> | string;
        step?: number;
    } & FieldAdmin;
    type: 'point';
    validate?: PointFieldValidation;
} & Omit<FieldBase, 'validate'>;
type PointFieldClient = {
    admin?: AdminClient & Pick<PointField['admin'], 'placeholder' | 'step'>;
} & FieldBaseClient & Pick<PointField, 'type'>;
/**
 * A virtual field that loads in related collections by querying a relationship or upload field.
 */
type JoinField = {
    access?: {
        create?: never;
        read?: FieldAccess;
        update?: never;
    };
    admin?: {
        allowCreate?: boolean;
        components?: {
            afterInput?: CustomComponent[];
            beforeInput?: CustomComponent[];
            Error?: CustomComponent<JoinFieldErrorClientComponent | JoinFieldErrorServerComponent>;
            Label?: CustomComponent<JoinFieldLabelClientComponent | JoinFieldLabelServerComponent>;
        } & FieldAdmin['components'];
        defaultColumns?: string[];
        disableBulkEdit?: never;
        disableRowTypes?: boolean;
        readOnly?: never;
    } & FieldAdmin;
    /**
     * The slug of the collection to relate with.
     */
    collection: CollectionSlug | CollectionSlug[];
    defaultLimit?: number;
    defaultSort?: Sort;
    defaultValue?: never;
    /**
     * This does not need to be set and will be overridden by the relationship field's hasMany property.
     */
    hasMany?: boolean;
    hidden?: false;
    index?: never;
    /**
     * This does not need to be set and will be overridden by the relationship field's localized property.
     */
    localized?: boolean;
    /**
     * The maximum allowed depth to be permitted application-wide. This setting helps prevent against malicious queries.
     *
     * @see https://payloadcms.com/docs/getting-started/concepts#depth
     *
     * @default 1
     */
    maxDepth?: number;
    /**
     * A string for the field in the collection being joined to.
     */
    on: string;
    /**
     * If true, enables custom ordering for the collection with the relationship, and joined documents can be reordered via drag and drop.
     * New documents are inserted at the end of the list according to this parameter.
     *
     * Under the hood, a field with {@link https://observablehq.com/@dgreensp/implementing-fractional-indexing|fractional indexing} is used to optimize inserts and reorderings.
     *
     * @default false
     *
     * @experimental There may be frequent breaking changes to this API
     */
    orderable?: boolean;
    sanitizedMany?: JoinField[];
    type: 'join';
    validate?: never;
    where?: Where;
} & FieldBase & FieldGraphQLType;
type JoinFieldClient = {
    admin?: AdminClient & Pick<JoinField['admin'], 'allowCreate' | 'defaultColumns' | 'disableBulkEdit' | 'disableRowTypes' | 'readOnly'>;
} & {
    targetField: Pick<RelationshipFieldClient, 'relationTo'>;
} & FieldBaseClient & Pick<JoinField, 'collection' | 'defaultLimit' | 'defaultSort' | 'index' | 'maxDepth' | 'on' | 'orderable' | 'type' | 'where'>;
type FlattenedBlock = {
    flattenedFields: FlattenedField$1[];
} & Block;
type FlattenedBlocksField = {
    /**
     * Like `blocks`, but allows you to also pass strings that are slugs of blocks defined in `config.blocks`.
     *
     * @todo `blockReferences` will be merged with `blocks` in 4.0
     */
    blockReferences?: (FlattenedBlock | string)[];
    blocks: FlattenedBlock[];
} & Omit<BlocksField, 'blockReferences' | 'blocks'>;
type FlattenedGroupField = {
    flattenedFields: FlattenedField$1[];
    name: string;
} & GroupField;
type FlattenedArrayField = {
    flattenedFields: FlattenedField$1[];
} & ArrayField;
type FlattenedTabAsField = {
    flattenedFields: FlattenedField$1[];
} & MarkRequired<TabAsField, 'name'>;
type FlattenedJoinField = {
    targetField: RelationshipField | UploadField;
} & JoinField;
type FlattenedField$1 = CheckboxField | CodeField | DateField | EmailField | FlattenedArrayField | FlattenedBlocksField | FlattenedGroupField | FlattenedJoinField | FlattenedTabAsField | JSONField | NumberField | PointField | RadioField | RelationshipField | RichTextField | SelectField | TextareaField | TextField | UploadField;
type Field = ArrayField | BlocksField | CheckboxField | CodeField | CollapsibleField | DateField | EmailField | GroupField | JoinField | JSONField | NumberField | PointField | RadioField | RelationshipField | RichTextField | RowField | SelectField | TabsField | TextareaField | TextField | UIField | UploadField;
type ClientField = ArrayFieldClient | BlocksFieldClient | CheckboxFieldClient | CodeFieldClient | CollapsibleFieldClient | DateFieldClient | EmailFieldClient | GroupFieldClient | JoinFieldClient | JSONFieldClient | NumberFieldClient | PointFieldClient | RadioFieldClient | RelationshipFieldClient | RichTextFieldClient | RowFieldClient | SelectFieldClient | TabsFieldClient | TextareaFieldClient | TextFieldClient | UIFieldClient | UploadFieldClient;
type ClientFieldProps = ArrayFieldClientProps | BlocksFieldClientProps | CheckboxFieldClientProps | CodeFieldClientProps | CollapsibleFieldClientProps | DateFieldClientProps | EmailFieldClientProps | GroupFieldClientProps | HiddenFieldProps | JoinFieldClientProps | JSONFieldClientProps | NumberFieldClientProps | PointFieldClientProps | RadioFieldClientProps | RelationshipFieldClientProps | RichTextFieldClientProps | RowFieldClientProps | SelectFieldClientProps | TabsFieldClientProps | TextareaFieldClientProps | TextFieldClientProps | UploadFieldClientProps;
type ExtractFieldTypes<T> = T extends {
    type: infer U;
} ? U : never;
type FieldTypes = ExtractFieldTypes<Field>;
type FieldAffectingData = ArrayField | BlocksField | CheckboxField | CodeField | DateField | EmailField | JoinField | JSONField | NamedGroupField | NumberField | PointField | RadioField | RelationshipField | RichTextField | SelectField | TabAsField | TextareaField | TextField | UploadField;
type FieldAffectingDataClient = ArrayFieldClient | BlocksFieldClient | CheckboxFieldClient | CodeFieldClient | DateFieldClient | EmailFieldClient | JoinFieldClient | JSONFieldClient | NamedGroupFieldClient | NumberFieldClient | PointFieldClient | RadioFieldClient | RelationshipFieldClient | RichTextFieldClient | SelectFieldClient | TabAsFieldClient | TextareaFieldClient | TextFieldClient | UploadFieldClient;
type NonPresentationalField = ArrayField | BlocksField | CheckboxField | CodeField | CollapsibleField | DateField | EmailField | JSONField | NamedGroupField | NumberField | PointField | RadioField | RelationshipField | RichTextField | RowField | SelectField | TabsField | TextareaField | TextField | UploadField;
type NonPresentationalFieldClient = ArrayFieldClient | BlocksFieldClient | CheckboxFieldClient | CodeFieldClient | CollapsibleFieldClient | DateFieldClient | EmailFieldClient | JSONFieldClient | NamedGroupFieldClient | NumberFieldClient | PointFieldClient | RadioFieldClient | RelationshipFieldClient | RichTextFieldClient | RowFieldClient | SelectFieldClient | TabsFieldClient | TextareaFieldClient | TextFieldClient | UploadFieldClient;
type FieldWithPath = {
    path?: string;
} & Field;
type FieldWithPathClient = {
    path?: string;
} & ClientField;
type FieldWithSubFields = ArrayField | CollapsibleField | GroupField | RowField;
type FieldWithSubFieldsClient = ArrayFieldClient | CollapsibleFieldClient | GroupFieldClient | RowFieldClient;
type FieldPresentationalOnly = UIField;
type FieldPresentationalOnlyClient = UIFieldClient;
type FieldWithMany = RelationshipField | SelectField;
type FieldWithManyClient = RelationshipFieldClient | SelectFieldClient;
type FieldWithMaxDepth = RelationshipField | UploadField;
type FieldWithMaxDepthClient = JoinFieldClient | RelationshipFieldClient | UploadFieldClient;
type HookName = 'afterChange' | 'afterRead' | 'beforeChange' | 'beforeRead' | 'beforeValidate';

type RichTextFieldClientWithoutType<TValue extends object = any, TAdapterProps = any, TExtraProperties = object> = MarkOptional<RichTextFieldClient<TValue, TAdapterProps, TExtraProperties>, 'type'>;
type RichTextFieldBaseClientProps<TValue extends object = any, TAdapterProps = any, TExtraProperties = object> = {
    readonly path: string;
    readonly validate?: RichTextFieldValidation;
};
type RichTextFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type RichTextFieldClientProps<TValue extends object = any, TAdapterProps = any, TExtraProperties = object> = ClientFieldBase<RichTextFieldClientWithoutType<TValue, TAdapterProps, TExtraProperties>> & RichTextFieldBaseClientProps<TValue, TAdapterProps, TExtraProperties>;
type RichTextFieldServerProps = RichTextFieldBaseServerProps & ServerFieldBase<RichTextField, RichTextFieldClientWithoutType>;
type RichTextFieldServerComponent = FieldServerComponent<RichTextField, RichTextFieldClientWithoutType, RichTextFieldBaseServerProps>;
type RichTextFieldClientComponent = FieldClientComponent<RichTextFieldClientWithoutType, RichTextFieldBaseClientProps>;
type RichTextFieldLabelServerComponent = FieldLabelServerComponent<RichTextField, RichTextFieldClientWithoutType>;
type RichTextFieldLabelClientComponent = FieldLabelClientComponent<RichTextFieldClientWithoutType>;
type RichTextFieldDescriptionServerComponent = FieldDescriptionServerComponent<RichTextField, RichTextFieldClientWithoutType>;
type RichTextFieldDescriptionClientComponent = FieldDescriptionClientComponent<RichTextFieldClientWithoutType>;
type RichTextFieldErrorServerComponent = FieldErrorServerComponent<RichTextField, RichTextFieldClientWithoutType>;
type RichTextFieldErrorClientComponent = FieldErrorClientComponent<RichTextFieldClientWithoutType>;
type RichTextFieldDiffServerComponent = FieldDiffServerComponent<RichTextField, RichTextFieldClient>;
type RichTextFieldDiffClientComponent = FieldDiffClientComponent<RichTextFieldClient>;

type AfterReadRichTextHookArgs<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = {
    currentDepth?: number;
    depth?: number;
    draft?: boolean;
    fallbackLocale?: TypedFallbackLocale;
    fieldPromises?: Promise<void>[];
    /** Boolean to denote if this hook is running against finding one, or finding many within the afterRead hook. */
    findMany?: boolean;
    flattenLocales?: boolean;
    locale?: string;
    /** A string relating to which operation the field type is currently executing within. */
    operation?: 'create' | 'delete' | 'read' | 'update';
    overrideAccess?: boolean;
    populate?: PopulateType;
    populationPromises?: Promise<void>[];
    showHiddenFields?: boolean;
    triggerAccessControl?: boolean;
    triggerHooks?: boolean;
};
type AfterChangeRichTextHookArgs<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = {
    /** A string relating to which operation the field type is currently executing within. */
    operation: 'create' | 'update';
    /** The document before changes were applied. */
    previousDoc?: TData;
    /** The sibling data of the document before changes being applied. */
    previousSiblingDoc?: TSiblingData;
    /** The previous value of the field, before changes */
    previousValue?: TValue;
};
type BeforeValidateRichTextHookArgs<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = {
    /** A string relating to which operation the field type is currently executing within. */
    operation: 'create' | 'update';
    overrideAccess?: boolean;
    /** The sibling data of the document before changes being applied. */
    previousSiblingDoc?: TSiblingData;
    /** The previous value of the field, before changes */
    previousValue?: TValue;
};
type BeforeChangeRichTextHookArgs<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = {
    /**
     * The original data with locales (not modified by any hooks). Only available in `beforeChange` and `beforeDuplicate` field hooks.
     */
    docWithLocales?: JsonObject;
    duplicate?: boolean;
    errors?: ValidationFieldError[];
    /**
     * Built up field label
     *
     * @example "Group Field > Tab Field > Rich Text Field"
     */
    fieldLabelPath: string;
    /** Only available in `beforeChange` field hooks */
    mergeLocaleActions?: (() => Promise<void> | void)[];
    /** A string relating to which operation the field type is currently executing within. */
    operation?: 'create' | 'delete' | 'read' | 'update';
    overrideAccess: boolean;
    /** The sibling data of the document before changes being applied. */
    previousSiblingDoc?: TSiblingData;
    /** The previous value of the field, before changes */
    previousValue?: TValue;
    /**
     * The original siblingData with locales (not modified by any hooks).
     */
    siblingDocWithLocales?: JsonObject;
    skipValidation?: boolean;
};
type BaseRichTextHookArgs<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = {
    /** The collection which the field belongs to. If the field belongs to a global, this will be null. */
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    /** The data passed to update the document within create and update operations, and the full document itself in the afterRead hook. */
    data?: Partial<TData>;
    /** The field which the hook is running against. */
    field: FieldAffectingData;
    /** The global which the field belongs to. If the field belongs to a collection, this will be null. */
    global: null | SanitizedGlobalConfig;
    indexPath: number[];
    /** The full original document in `update` operations. In the `afterChange` hook, this is the resulting document of the operation. */
    originalDoc?: TData;
    parentIsLocalized: boolean;
    /**
     * The path of the field, e.g. ["group", "myArray", 1, "textField"]. The path is the schemaPath but with indexes and would be used in the context of field data, not field schemas.
     */
    path: (number | string)[];
    /** The Express request object. It is mocked for Local API operations. */
    req: PayloadRequest;
    /**
     * The schemaPath of the field, e.g. ["group", "myArray", "textField"]. The schemaPath is the path but without indexes and would be used in the context of field schemas, not field data.
     */
    schemaPath: string[];
    /** The sibling data passed to a field that the hook is running against. */
    siblingData: Partial<TSiblingData>;
    /** The value of the field. */
    value?: TValue;
};
type AfterReadRichTextHook<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = (args: AfterReadRichTextHookArgs<TData, TValue, TSiblingData> & BaseRichTextHookArgs<TData, TValue, TSiblingData>) => Promise<TValue> | TValue;
type AfterChangeRichTextHook<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = (args: AfterChangeRichTextHookArgs<TData, TValue, TSiblingData> & BaseRichTextHookArgs<TData, TValue, TSiblingData>) => Promise<TValue> | TValue;
type BeforeChangeRichTextHook<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = (args: BaseRichTextHookArgs<TData, TValue, TSiblingData> & BeforeChangeRichTextHookArgs<TData, TValue, TSiblingData>) => Promise<TValue> | TValue;
type BeforeValidateRichTextHook<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = (args: BaseRichTextHookArgs<TData, TValue, TSiblingData> & BeforeValidateRichTextHookArgs<TData, TValue, TSiblingData>) => Promise<TValue> | TValue;
type RichTextHooks = {
    afterChange?: AfterChangeRichTextHook[];
    afterRead?: AfterReadRichTextHook[];
    beforeChange?: BeforeChangeRichTextHook[];
    beforeValidate?: BeforeValidateRichTextHook[];
};
type RichTextAdapterBase<Value extends object = object, AdapterProps = any, ExtraFieldProperties = {}> = {
    /**
     * Provide a function that can be used to add items to the import map. This is useful for
     * making modules available to the client.
     */
    generateImportMap?: ImportMapGenerators[0];
    /**
     * Provide a function that can be used to add items to the schema map. This is useful for
     * richtext sub-fields the server needs to "know" about in order to do things like calculate form state.
     *
     * This function is run within `buildFieldSchemaMap`.
     */
    generateSchemaMap?: (args: {
        config: SanitizedConfig;
        field: RichTextField;
        i18n: I18n<any, any>;
        schemaMap: FieldSchemaMap;
        schemaPath: string;
    }) => FieldSchemaMap;
    /**
     * Like an afterRead hook, but runs only for the GraphQL resolver. For populating data, this should be used, as afterRead hooks do not have a depth in graphQL.
     *
     * To populate stuff / resolve field hooks, mutate the incoming populationPromises or fieldPromises array. They will then be awaited in the correct order within payload itself.
     * @param data
     */
    graphQLPopulationPromises?: (data: {
        context: RequestContext;
        currentDepth?: number;
        depth: number;
        draft: boolean;
        field: RichTextField<Value, AdapterProps, ExtraFieldProperties>;
        fieldPromises: Promise<void>[];
        findMany: boolean;
        flattenLocales: boolean;
        overrideAccess?: boolean;
        parentIsLocalized: boolean;
        populateArg?: PopulateType;
        populationPromises: Promise<void>[];
        req: PayloadRequest;
        showHiddenFields: boolean;
        siblingDoc: JsonObject;
    }) => void;
    hooks?: RichTextHooks;
    /**
     * @deprecated - manually merge i18n translations into the config.i18n.translations object within the adapter provider instead.
     * This property will be removed in v4.
     */
    i18n?: Partial<GenericLanguages>;
    /**
     * Return the JSON schema for the field value. The JSON schema is read by
     * `json-schema-to-typescript` which is used to generate types for this richtext field
     * payload-types.ts)
     */
    outputSchema?: (args: {
        collectionIDFieldTypes: {
            [key: string]: 'number' | 'string';
        };
        config?: SanitizedConfig;
        field: RichTextField<Value, AdapterProps, ExtraFieldProperties>;
        i18n?: I18n;
        /**
         * Allows you to define new top-level interfaces that can be re-used in the output schema.
         */
        interfaceNameDefinitions: Map<string, JSONSchema4>;
        isRequired: boolean;
    }) => JSONSchema4;
    /**
     * Provide validation function for the richText field. This function is run the same way
     * as other field validation functions.
     */
    validate: Validate<Value, Value, unknown, RichTextField<Value, AdapterProps, ExtraFieldProperties>>;
};
type RichTextAdapter<Value extends object = any, AdapterProps = any, ExtraFieldProperties = any> = {
    /**
     * Component that will be displayed in the list view. Can be typed as
     * `DefaultCellComponentProps` or `DefaultServerCellComponentProps`.
     */
    CellComponent: PayloadComponent<never>;
    /**
     * Component that will be displayed in the version diff view.
     * If not provided, richtext content will be diffed as JSON.
     */
    DiffComponent?: PayloadComponent<FieldDiffServerProps<RichTextField, RichTextFieldClient>, FieldDiffClientProps<RichTextFieldClient>>;
    /**
     * Component that will be displayed in the edit view.
     */
    FieldComponent: PayloadComponent<RichTextFieldServerProps, RichTextFieldClientProps>;
} & RichTextAdapterBase<Value, AdapterProps, ExtraFieldProperties>;
type RichTextAdapterProvider<Value extends object = object, AdapterProps = any, ExtraFieldProperties = {}> = ({ config, isRoot, parentIsLocalized, }: {
    config: SanitizedConfig;
    /**
     * Whether or not this is the root richText editor, defined in the top-level `editor` property
     * of the Payload Config.
     *
     * @default false
     */
    isRoot?: boolean;
    parentIsLocalized: boolean;
}) => Promise<RichTextAdapter<Value, AdapterProps, ExtraFieldProperties>> | RichTextAdapter<Value, AdapterProps, ExtraFieldProperties>;

type CookieOptions = {
    domain?: string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    name: string;
    path?: string;
    returnCookieAsObject: boolean;
    sameSite?: 'Lax' | 'None' | 'Strict';
    secure?: boolean;
    value?: string;
};
type CookieObject = {
    domain?: string;
    expires?: string;
    httpOnly?: boolean;
    maxAge?: number;
    name: string;
    path?: string;
    sameSite?: 'Lax' | 'None' | 'Strict';
    secure?: boolean;
    value: string | undefined;
};
declare const generateCookie: <ReturnCookieAsObject = boolean>(args: CookieOptions) => ReturnCookieAsObject extends true ? CookieObject : string;
type GetCookieExpirationArgs = {
    seconds: number;
};
declare const getCookieExpiration: ({ seconds }: GetCookieExpirationArgs) => Date;
type GeneratePayloadCookieArgs = {
    collectionAuthConfig: SanitizedCollectionConfig['auth'];
    cookiePrefix: string;
    returnCookieAsObject?: boolean;
    token: string;
};
declare const generatePayloadCookie: <T extends GeneratePayloadCookieArgs>({ collectionAuthConfig, cookiePrefix, returnCookieAsObject, token, }: T) => T["returnCookieAsObject"] extends true ? CookieObject : string;
declare const generateExpiredPayloadCookie: <T extends Omit<GeneratePayloadCookieArgs, "token">>({ collectionAuthConfig, cookiePrefix, returnCookieAsObject, }: T) => T["returnCookieAsObject"] extends true ? CookieObject : string;
declare function parseCookies(headers: Request['headers']): Map<string, string>;

declare const extractJWT: (args: Omit<AuthStrategyFunctionArgs, "strategyName">) => null | string;

type ServerOnlyFieldProperties = 'dbName' | 'editor' | 'enumName' | 'filterOptions' | 'graphQL' | 'label' | 'typescriptSchema' | 'validate' | keyof Pick<FieldBase, 'access' | 'custom' | 'defaultValue' | 'hooks'>;
type ServerOnlyFieldAdminProperties = keyof Pick<FieldBase['admin'], 'components' | 'condition'>;
declare const createClientField: ({ defaultIDType, field: incomingField, i18n, importMap, }: {
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    field: Field;
    i18n: I18nClient;
    importMap: ImportMap;
}) => ClientField;
declare const createClientFields: ({ defaultIDType, disableAddingID, fields, i18n, importMap, }: {
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    disableAddingID?: boolean;
    fields: Field[];
    i18n: I18nClient;
    importMap: ImportMap;
}) => ClientField[];

type ServerOnlyCollectionProperties = keyof Pick<SanitizedCollectionConfig, 'access' | 'custom' | 'endpoints' | 'flattenedFields' | 'hooks' | 'indexes' | 'joins' | 'polymorphicJoins' | 'sanitizedIndexes'>;
type ServerOnlyCollectionAdminProperties = keyof Pick<SanitizedCollectionConfig['admin'], 'baseFilter' | 'baseListFilter' | 'components' | 'formatDocURL' | 'hidden'>;
type ServerOnlyUploadProperties = keyof Pick<SanitizedCollectionConfig['upload'], 'adminThumbnail' | 'externalFileHeaderFilter' | 'handlers' | 'modifyResponseHeaders' | 'withMetadata'>;
type ClientCollectionConfig = {
    admin: {
        description?: StaticDescription;
        livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>;
        preview?: boolean;
    } & Omit<SanitizedCollectionConfig['admin'], 'components' | 'description' | 'formatDocURL' | 'joins' | 'livePreview' | 'preview' | ServerOnlyCollectionAdminProperties>;
    auth?: {
        verify?: true;
    } & Omit<SanitizedCollectionConfig['auth'], 'forgotPassword' | 'strategies' | 'verify'>;
    fields: ClientField[];
    labels: {
        plural: StaticLabel;
        singular: StaticLabel;
    };
} & Omit<SanitizedCollectionConfig, 'admin' | 'auth' | 'fields' | 'labels' | ServerOnlyCollectionProperties>;
declare const createClientCollectionConfig: ({ collection, defaultIDType, i18n, importMap, }: {
    collection: SanitizedCollectionConfig;
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    i18n: I18nClient;
    importMap: ImportMap;
}) => ClientCollectionConfig;
declare const createClientCollectionConfigs: ({ collections, defaultIDType, i18n, importMap, }: {
    collections: SanitizedCollectionConfig[];
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    i18n: I18nClient;
    importMap: ImportMap;
}) => ClientCollectionConfig[];

type ServerOnlyGlobalProperties = keyof Pick<SanitizedGlobalConfig, 'access' | 'admin' | 'custom' | 'endpoints' | 'fields' | 'flattenedFields' | 'hooks'>;
type ServerOnlyGlobalAdminProperties = keyof Pick<SanitizedGlobalConfig['admin'], 'components' | 'hidden'>;
type ClientGlobalConfig = {
    admin: {
        components: null;
        livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>;
        preview?: boolean;
    } & Omit<SanitizedGlobalConfig['admin'], 'components' | 'livePreview' | 'preview' | ServerOnlyGlobalAdminProperties>;
    fields: ClientField[];
} & Omit<SanitizedGlobalConfig, 'admin' | 'fields' | ServerOnlyGlobalProperties>;
declare const createClientGlobalConfig: ({ defaultIDType, global, i18n, importMap, }: {
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    global: SanitizedConfig["globals"][0];
    i18n: I18nClient;
    importMap: ImportMap;
}) => ClientGlobalConfig;
declare const createClientGlobalConfigs: ({ defaultIDType, globals, i18n, importMap, }: {
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    globals: SanitizedConfig["globals"];
    i18n: I18nClient;
    importMap: ImportMap;
}) => ClientGlobalConfig[];

type ServerOnlyRootProperties = keyof Pick<SanitizedConfig, 'bin' | 'cors' | 'csrf' | 'custom' | 'db' | 'editor' | 'email' | 'endpoints' | 'graphQL' | 'hooks' | 'i18n' | 'jobs' | 'kv' | 'logger' | 'onInit' | 'plugins' | 'queryPresets' | 'secret' | 'sharp' | 'typescript'>;
type ServerOnlyRootAdminProperties = keyof Pick<SanitizedConfig['admin'], 'components'>;
type ClientConfig = {
    admin: {
        dashboard?: SanitizedDashboardConfig;
        livePreview?: Omit<RootLivePreviewConfig, ServerOnlyLivePreviewProperties>;
    } & Omit<SanitizedConfig['admin'], 'components' | 'dashboard' | 'dependencies' | 'livePreview'>;
    blocks: ClientBlock[];
    blocksMap: Record<BlockSlug, ClientBlock>;
    collections: ClientCollectionConfig[];
    custom?: Record<string, any>;
    globals: ClientGlobalConfig[];
    unauthenticated?: boolean;
} & Omit<SanitizedConfig, 'admin' | 'collections' | 'globals' | 'i18n' | ServerOnlyRootProperties>;
type UnauthenticatedClientConfig = {
    admin: {
        routes: ClientConfig['admin']['routes'];
        user: ClientConfig['admin']['user'];
    };
    collections: [
        {
            auth: ClientCollectionConfig['auth'];
            slug: string;
        }
    ];
    globals: [];
    routes: ClientConfig['routes'];
    serverURL: ClientConfig['serverURL'];
    unauthenticated: true;
};
declare const serverOnlyAdminConfigProperties: readonly Partial<ServerOnlyRootAdminProperties>[];
declare const serverOnlyConfigProperties: readonly Partial<ServerOnlyRootProperties>[];
type CreateClientConfigArgs = {
    config: SanitizedConfig;
    i18n: I18nClient;
    importMap: ImportMap;
    /**
     * If unauthenticated, the client config will omit some sensitive properties
     * such as field schemas, etc. This is useful for login and error pages where
     * the page source should not contain this information.
     *
     * For example, allow `true` to generate a client config for the "create first user" page
     * where there is no user yet, but the config should still be complete.
     */
    user: true | TypedUser;
};
declare const createUnauthenticatedClientConfig: ({ clientConfig, }: {
    /**
     * Send the previously generated client config to share memory when applicable.
     * E.g. the admin-enabled collection config can reference the existing collection rather than creating a new object.
     */
    clientConfig: ClientConfig;
}) => UnauthenticatedClientConfig;
declare const createClientConfig: ({ config, i18n, importMap, }: CreateClientConfigArgs) => ClientConfig;

type LanguageOptions = {
    label: string;
    value: AcceptedLanguages;
}[];

type EditViewProps = {
    readonly collectionSlug?: string;
    readonly globalSlug?: string;
};
/**
 * Properties specific to the versions view
 */
type RenderDocumentVersionsProperties = {
    /**
     * @default false
     */
    disableGutter?: boolean;
    /**
     * Use createdAt cell that appends params to the url on version selection instead of redirecting user
     * @default false
     */
    useVersionDrawerCreatedAtCell?: boolean;
};
type DocumentViewServerPropsOnly = {
    doc: Data;
    hasPublishedDoc: boolean;
    initPageResult: InitPageResult;
    routeSegments: string[];
    versions?: RenderDocumentVersionsProperties;
} & ServerProps;
type DocumentViewServerProps = DocumentViewClientProps & DocumentViewServerPropsOnly;
type DocumentViewClientProps = {
    documentSubViewType: DocumentSubViewTypes;
    formState: FormState;
    viewType: ViewTypes;
} & DocumentSlots;
/**
 * @todo: This should be renamed to `DocumentSubViewType` (singular)
 */
type DocumentSubViewTypes = 'api' | 'default' | 'version' | 'versions';
type DocumentTabServerPropsOnly = {
    readonly apiURL?: string;
    readonly collectionConfig?: SanitizedCollectionConfig;
    readonly globalConfig?: SanitizedGlobalConfig;
    readonly permissions: SanitizedPermissions;
    readonly req: PayloadRequest;
} & ServerProps;
type DocumentTabClientProps = {
    path: string;
};
type DocumentTabServerProps = DocumentTabClientProps & DocumentTabServerPropsOnly;
type DocumentTabCondition = (args: {
    collectionConfig: SanitizedCollectionConfig;
    /**
     * @deprecated: Use `req.payload.config` instead. This will be removed in v4.
     */
    config: SanitizedConfig;
    globalConfig: SanitizedGlobalConfig;
    permissions: SanitizedPermissions;
    req: PayloadRequest;
}) => boolean;
type DocumentTabConfig = {
    readonly Component?: DocumentTabComponent;
    readonly condition?: DocumentTabCondition;
    readonly href?: ((args: {
        apiURL: string;
        collection: SanitizedCollectionConfig;
        global: SanitizedGlobalConfig;
        id?: string;
        routes: SanitizedConfig['routes'];
    }) => string) | string;
    readonly isActive?: ((args: {
        href: string;
    }) => boolean) | boolean;
    readonly label?: ((args: {
        t: (key: string) => string;
    }) => string) | string;
    readonly newTab?: boolean;
    /**
     * Sets the order to render the tab in the admin panel
     * Recommended to use increments of 100 (e.g. 0, 100, 200)
     */
    readonly order?: number;
    readonly Pill?: PayloadComponent;
};
/**
 * @todo: Remove this type as it's only used internally for the config (above)
 */
type DocumentTabComponent = PayloadComponent<{
    path: string;
}>;
type BeforeDocumentControlsClientProps = {};
type BeforeDocumentControlsServerPropsOnly = {} & ServerProps;
type BeforeDocumentControlsServerProps = BeforeDocumentControlsClientProps & BeforeDocumentControlsServerPropsOnly;

type AdminViewConfig = {
    Component: PayloadComponent;
    /** Whether the path should be matched exactly or as a prefix */
    exact?: boolean;
    meta?: MetaConfig;
    /**
     * Any valid URL path or array of paths that [`path-to-regexp`](https://www.npmjs.com/package/path-to-regex) understands. Must begin with a forward slash (`/`).
     */
    path?: `/${string}`;
    sensitive?: boolean;
    strict?: boolean;
};
type AdminViewClientProps = {
    browseByFolderSlugs?: SanitizedCollectionConfig['slug'][];
    clientConfig: ClientConfig;
    documentSubViewType?: DocumentSubViewTypes;
    viewType: ViewTypes;
};
type AdminViewServerPropsOnly = {
    readonly clientConfig: ClientConfig;
    readonly collectionConfig?: SanitizedCollectionConfig;
    readonly disableActions?: boolean;
    /**
     * @todo remove `docID` here as it is already contained in `initPageResult`
     */
    readonly docID?: number | string;
    readonly folderID?: number | string;
    readonly globalConfig?: SanitizedGlobalConfig;
    readonly importMap: ImportMap;
    readonly initialData?: Data;
    readonly initPageResult: InitPageResult;
    readonly params?: {
        [key: string]: string | string[] | undefined;
    };
    readonly redirectAfterCreate?: boolean;
    readonly redirectAfterDelete?: boolean;
    readonly redirectAfterDuplicate?: boolean;
    readonly redirectAfterRestore?: boolean;
    readonly viewActions?: CustomComponent[];
} & ServerProps;
type AdminViewServerProps = AdminViewClientProps & AdminViewServerPropsOnly;
/**
 * @deprecated This should be removed in favor of direct props
 */
type AdminViewComponent = PayloadComponent<AdminViewServerProps>;
type VisibleEntities = {
    collections: SanitizedCollectionConfig['slug'][];
    globals: SanitizedGlobalConfig['slug'][];
};
type InitPageResult = {
    collectionConfig?: SanitizedCollectionConfig;
    cookies: Map<string, string>;
    docID?: number | string;
    globalConfig?: SanitizedGlobalConfig;
    languageOptions: LanguageOptions;
    locale?: Locale;
    permissions: SanitizedPermissions;
    redirectTo?: string;
    req: PayloadRequest;
    translations: ClientTranslationsObject;
    visibleEntities: VisibleEntities;
};
/**
 * @todo This should be renamed to `ViewType` (singular)
 */
type ViewTypes = 'account' | 'collection-folders' | 'createFirstUser' | 'dashboard' | 'document' | 'folders' | 'list' | 'reset' | 'trash' | 'verify' | 'version';
type ServerPropsFromView = {
    collectionConfig?: SanitizedConfig['collections'][number];
    globalConfig?: SanitizedConfig['globals'][number];
    viewActions: CustomComponent[];
};
type ViewDescriptionClientProps = {
    collectionSlug?: SanitizedCollectionConfig['slug'];
    description: StaticDescription;
};
type ViewDescriptionServerPropsOnly = {} & ServerProps;
type ViewDescriptionServerProps = ViewDescriptionClientProps & ViewDescriptionServerPropsOnly;

type Prettify$1<T> = {
    [K in keyof T]: T[K];
} & NonNullable<unknown>;
/**
 * Options for sending an email. Allows access to the PayloadRequest object
 */
type SendEmailOptions = Prettify$1<SendMailOptions>;
/**
 * Email adapter after it has been initialized. This is used internally by Payload.
 */
type InitializedEmailAdapter<TSendEmailResponse = unknown> = ReturnType<EmailAdapter<TSendEmailResponse>>;
/**
 * Email adapter interface. Allows a generic type for the response of the sendEmail method.
 *
 * This is the interface to use if you are creating a new email adapter.
 */
type EmailAdapter<TSendEmailResponse = unknown> = ({ payload }: {
    payload: Payload;
}) => {
    defaultFromAddress: string;
    defaultFromName: string;
    name: string;
    sendEmail: (message: SendEmailOptions) => Promise<TSendEmailResponse>;
};

declare class AuthenticationError extends APIError {
    constructor(t?: TFunction, loginWithUsername?: boolean);
}

declare class DuplicateCollection extends APIError {
    constructor(propertyName: string, duplicate: string);
}

declare class DuplicateFieldName extends APIError {
    constructor(fieldName: string);
}

declare class DuplicateGlobal extends APIError {
    constructor(config: GlobalConfig);
}

declare class ErrorDeletingFile extends APIError {
    constructor(t?: TFunction);
}

declare class FileRetrievalError extends APIError {
    constructor(t?: TFunction, message?: string);
}

declare class FileUploadError extends APIError {
    constructor(t?: TFunction);
}

declare class Forbidden extends APIError {
    constructor(t?: TFunction);
}

declare class InvalidConfiguration extends APIError {
    constructor(message: string);
}

declare class InvalidFieldName extends APIError {
    constructor(field: FieldAffectingData, fieldName: string);
}

declare class InvalidFieldRelationship extends APIError {
    constructor(field: RelationshipField | UploadField, relationship: string);
}

declare class Locked extends APIError {
    constructor(message: string);
}

declare class LockedAuth extends APIError {
    constructor(t?: TFunction);
}

declare class MissingCollectionLabel extends APIError {
    constructor();
}

declare class MissingEditorProp extends APIError {
    constructor(field: Field);
}

declare class MissingFieldInputOptions extends APIError {
    constructor(field: RadioField | SelectField);
}

declare class MissingFieldType extends APIError {
    constructor(field: Field);
}

declare class MissingFile extends APIError {
    constructor(t?: TFunction);
}

declare class NotFound extends APIError {
    constructor(t?: TFunction);
}

declare class QueryError extends APIError<{
    path: string;
}[]> {
    constructor(results: {
        path: string;
    }[]);
}

declare class UnauthorizedError extends APIError {
    constructor(t?: TFunction);
}

declare class UnverifiedEmail extends APIError {
    constructor({ t }: {
        t?: TFunction;
    });
}

/**
 * Error names that can be thrown by Payload during runtime
 */
type ErrorName = 'APIError' | 'AuthenticationError' | 'ErrorDeletingFile' | 'FileRetrievalError' | 'FileUploadError' | 'Forbidden' | 'Locked' | 'LockedAuth' | 'MissingFile' | 'NotFound' | 'QueryError' | 'UnverifiedEmail' | 'ValidationError';

type FolderBreadcrumb = {
    folderType?: CollectionSlug[];
    id: null | number | string;
    name: string;
};
/**
 * `${relationTo}-${id}` is used as a key for the item
 */
type FolderDocumentItemKey = `${string}-${number | string}`;
/**
 * Needed for document card view for upload enabled collections
 */
type DocumentMediaData = {
    filename?: string;
    mimeType?: string;
    url?: string;
};
/**
 * A generic structure for a folder or document item.
 */
type FolderOrDocument = {
    itemKey: FolderDocumentItemKey;
    relationTo: CollectionSlug;
    value: {
        _folderOrDocumentTitle: string;
        createdAt?: string;
        folderID?: number | string;
        folderType: CollectionSlug[];
        id: number | string;
        updatedAt?: string;
    } & DocumentMediaData;
};
type GetFolderDataResult = {
    breadcrumbs: FolderBreadcrumb[] | null;
    documents: FolderOrDocument[];
    folderAssignedCollections: CollectionSlug[] | undefined;
    subfolders: FolderOrDocument[];
};
type RootFoldersConfiguration = {
    /**
     * If true, the browse by folder view will be enabled
     *
     * @default true
     */
    browseByFolder?: boolean;
    /**
     * An array of functions to be ran when the folder collection is initialized
     * This allows plugins to modify the collection configuration
     */
    collectionOverrides?: (({ collection, }: {
        collection: Omit<CollectionConfig, 'trash'>;
    }) => Omit<CollectionConfig, 'trash'> | Promise<Omit<CollectionConfig, 'trash'>>)[];
    /**
     * If true, you can scope folders to specific collections.
     *
     * @default true
     */
    collectionSpecific?: boolean;
    /**
     * Ability to view hidden fields and collections related to folders
     *
     * @default false
     */
    debug?: boolean;
    /**
     * The Folder field name
     *
     * @default "folder"
     */
    fieldName?: string;
    /**
     * Slug for the folder collection
     *
     * @default "payload-folders"
     */
    slug?: string;
};
type CollectionFoldersConfiguration = {
    /**
     * If true, the collection will be included in the browse by folder view
     *
     * @default true
     */
    browseByFolder?: boolean;
};
type BaseFolderSortKeys = 'createdAt' | 'name' | 'updatedAt';
type FolderSortKeys = `-${BaseFolderSortKeys}` | BaseFolderSortKeys;

declare const operations: readonly ["read", "update", "delete"];
type ConstraintOperation = (typeof operations)[number];
type DefaultConstraint = 'everyone' | 'onlyMe' | 'specificUsers';
type QueryPreset = {
    access: {
        [operation in ConstraintOperation]: {
            constraint: DefaultConstraint;
            users?: string[];
        };
    };
    columns: CollectionPreferences['columns'];
    groupBy?: string;
    id: number | string;
    isShared: boolean;
    relatedCollection: CollectionSlug;
    title: string;
    where: Where;
};
type QueryPresetConstraint = {
    access: Access<QueryPreset>;
    fields?: Field[];
    label: string;
    value: string;
};
type QueryPresetConstraints = QueryPresetConstraint[];

type TaskInputOutput = {
    input: object;
    output: object;
};
type TaskHandlerResult<TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] | TaskInputOutput> = {
    /**
     * @deprecated Returning `state: 'failed'` is deprecated. Throw an error instead.
     */
    errorMessage?: string;
    /**
     * @deprecated Returning `state: 'failed'` is deprecated. Throw an error instead.
     */
    state: 'failed';
} | {
    output: TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] ? TypedJobs['tasks'][TTaskSlugOrInputOutput]['output'] : TTaskSlugOrInputOutput extends TaskInputOutput ? TTaskSlugOrInputOutput['output'] : never;
    state?: 'succeeded';
};
type TaskHandlerArgs<TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] | TaskInputOutput, TWorkflowSlug extends keyof TypedJobs['workflows'] = string> = {
    /**
     * Use this function to run a sub-task from within another task.
     */
    inlineTask: RunInlineTaskFunction;
    input: TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] ? TypedJobs['tasks'][TTaskSlugOrInputOutput]['input'] : TTaskSlugOrInputOutput extends TaskInputOutput ? TTaskSlugOrInputOutput['input'] : never;
    job: Job<TWorkflowSlug>;
    req: PayloadRequest;
    tasks: RunTaskFunctions;
};
/**
 * Inline tasks in JSON workflows have no input, as they can just get the input from job.taskStatus
 */
type TaskHandlerArgsNoInput<TWorkflowInput extends false | object = false> = {
    job: Job<TWorkflowInput>;
    req: PayloadRequest;
};
type TaskHandler<TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] | TaskInputOutput, TWorkflowSlug extends keyof TypedJobs['workflows'] = string> = (args: TaskHandlerArgs<TTaskSlugOrInputOutput, TWorkflowSlug>) => MaybePromise<TaskHandlerResult<TTaskSlugOrInputOutput>>;
/**
 * @todo rename to TaskSlug in 4.0, similar to CollectionSlug
 */
type TaskType = StringKeyOf<TypedJobs['tasks']>;
type TaskInput<T extends keyof TypedJobs['tasks']> = TypedJobs['tasks'][T]['input'];
type TaskOutput<T extends keyof TypedJobs['tasks']> = TypedJobs['tasks'][T]['output'];
type TaskHandlerResults = {
    [TTaskSlug in keyof TypedJobs['tasks']]: {
        [id: string]: TaskHandlerResult<TTaskSlug>;
    };
};
type RunTaskFunctionArgs<TTaskSlug extends keyof TypedJobs['tasks']> = {
    input?: TaskInput<TTaskSlug>;
    /**
     * Specify the number of times that this task should be retried if it fails for any reason.
     * If this is undefined, the task will either inherit the retries from the workflow or have no retries.
     * If this is 0, the task will not be retried.
     *
     * @default By default, tasks are not retried and `retries` is `undefined`.
     */
    retries?: number | RetryConfig | undefined;
};
type RunTaskFunction<TTaskSlug extends keyof TypedJobs['tasks']> = (taskID: string, taskArgs?: RunTaskFunctionArgs<TTaskSlug>) => Promise<TaskOutput<TTaskSlug>>;
type RunTaskFunctions = {
    [TTaskSlug in keyof TypedJobs['tasks']]: RunTaskFunction<TTaskSlug>;
};
type RunInlineTaskFunction = <TTaskInput extends object, TTaskOutput extends object>(taskID: string, taskArgs: {
    input?: TTaskInput;
    /**
     * Specify the number of times that this task should be retried if it fails for any reason.
     * If this is undefined, the task will either inherit the retries from the workflow or have no retries.
     * If this is 0, the task will not be retried.
     *
     * @default By default, tasks are not retried and `retries` is `undefined`.
     */
    retries?: number | RetryConfig | undefined;
    task: (args: {
        inlineTask: RunInlineTaskFunction;
        input: TTaskInput;
        job: Job<any>;
        req: PayloadRequest;
        tasks: RunTaskFunctions;
    }) => MaybePromise<{
        /**
         * @deprecated Returning `state: 'failed'` is deprecated. Throw an error instead.
         */
        errorMessage?: string;
        /**
         * @deprecated Returning `state: 'failed'` is deprecated. Throw an error instead.
         */
        state: 'failed';
    } | {
        output: TTaskOutput;
        state?: 'succeeded';
    }>;
}) => Promise<TTaskOutput>;
type TaskCallbackArgs = {
    /**
     * Input data passed to the task
     */
    input?: object;
    job: Job;
    req: PayloadRequest;
    taskStatus: null | SingleTaskStatus<string>;
};
type ShouldRestoreFn = (args: {
    taskStatus: SingleTaskStatus<string>;
} & Omit<TaskCallbackArgs, 'taskStatus'>) => MaybePromise<boolean>;
type TaskCallbackFn = (args: TaskCallbackArgs) => MaybePromise<void>;
type RetryConfig = {
    /**
     * This controls how many times the task should be retried if it fails.
     *
     * @default undefined - attempts are either inherited from the workflow retry config or set to 0.
     */
    attempts?: number;
    /**
     * The backoff strategy to use when retrying the task. This determines how long to wait before retrying the task.
     *
     * If this is set on a single task, the longest backoff time of a task will determine the time until the entire workflow is retried.
     */
    backoff?: {
        /**
         * Base delay between running jobs in ms
         */
        delay?: number;
        /**
         * @default fixed
         *
         * The backoff strategy to use when retrying the task. This determines how long to wait before retrying the task.
         * If fixed (default) is used, the delay will be the same between each retry.
         *
         * If exponential is used, the delay will increase exponentially with each retry.
         *
         * @example
         * delay = 1000
         * attempts = 3
         * type = 'fixed'
         *
         * The task will be retried 3 times with a delay of 1000ms between each retry.
         *
         * @example
         * delay = 1000
         * attempts = 3
         * type = 'exponential'
         *
         * The task will be retried 3 times with a delay of 1000ms, 2000ms, and 4000ms between each retry.
         */
        type: 'exponential' | 'fixed';
    };
    /**
     * This controls whether the task output should be restored if the task previously succeeded and the workflow is being retried.
     *
     * If this is set to false, the task will be re-run even if it previously succeeded, ignoring the maximum number of retries.
     *
     * If this is set to true, the task will only be re-run if it previously failed.
     *
     * If this is a function, the return value of the function will determine whether the task should be re-run. This can be used for more complex restore logic,
     * e.g you may want to re-run a task up until a certain point and then restore it, or only re-run a task if the input has changed.
     *
     * @default true - the task output will be restored if the task previously succeeded.
     */
    shouldRestore?: boolean | ShouldRestoreFn;
};
type TaskConfig<TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] | TaskInputOutput = TaskType> = {
    /**
     * Job concurrency controls for preventing race conditions.
     *
     * Can be an object with full options, or a shorthand function that just returns the key
     * (in which case exclusive defaults to true).
     */
    concurrency?: ConcurrencyConfig<TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] ? TypedJobs['tasks'][TTaskSlugOrInputOutput]['input'] : TTaskSlugOrInputOutput extends TaskInputOutput ? TTaskSlugOrInputOutput['input'] : object>;
    /**
     * The function that should be responsible for running the job.
     * You can either pass a string-based path to the job function file, or the job function itself.
     *
     * If you are using large dependencies within your job, you might prefer to pass the string path
     * because that will avoid bundling large dependencies in your Next.js app. Passing a string path is an advanced feature
     * that may require a sophisticated build pipeline in order to work.
     */
    handler: string | TaskHandler<TTaskSlugOrInputOutput>;
    /**
     * Define the input field schema - payload will generate a type for this schema.
     */
    inputSchema?: Field[];
    /**
     * You can use interfaceName to change the name of the interface that is generated for this task. By default, this is "Task" + the capitalized task slug.
     */
    interfaceName?: string;
    /**
     * Define a human-friendly label for this task.
     */
    label?: string;
    /**
     * Function to be executed if the task fails.
     */
    onFail?: TaskCallbackFn;
    /**
     * Function to be executed if the task succeeds.
     */
    onSuccess?: TaskCallbackFn;
    /**
     * Define the output field schema - payload will generate a type for this schema.
     */
    outputSchema?: Field[];
    /**
     * Specify the number of times that this step should be retried if it fails.
     * If this is undefined, the task will either inherit the retries from the workflow or have no retries.
     * If this is 0, the task will not be retried.
     *
     * @default By default, tasks are not retried and `retries` is `undefined`.
     */
    retries?: number | RetryConfig | undefined;
    /**
     * Allows automatically scheduling this task to run regularly at a specified interval.
     */
    schedule?: ScheduleConfig[];
    /**
     * Define a slug-based name for this job. This slug needs to be unique among both tasks and workflows.
     */
    slug: TTaskSlugOrInputOutput extends keyof TypedJobs['tasks'] ? TTaskSlugOrInputOutput : string;
};

type TaskParent = {
    taskID: string;
    taskSlug: string;
};

type WorkflowStep<TTaskSlug extends keyof TypedJobs['tasks'], TWorkflowSlug extends false | keyof TypedJobs['workflows'] = false> = {
    /**
     * If this step is completed, the workflow will be marked as completed
     */
    completesJob?: boolean;
    condition?: (args: {
        job: Job<TWorkflowSlug>;
    }) => boolean;
    /**
     * Each task needs to have a unique ID to track its status
     */
    id: string;
    /**
     * Specify the number of times that this workflow should be retried if it fails for any reason.
     *
     * @default By default, workflows are not retried and `retries` is `0`.
     */
    retries?: number | RetryConfig;
} & ({
    inlineTask?: (args: TWorkflowSlug extends keyof TypedJobs['workflows'] ? TaskHandlerArgsNoInput<TypedJobs['workflows'][TWorkflowSlug]['input']> : TaskHandlerArgsNoInput) => Promise<TaskHandlerResult<TTaskSlug>> | TaskHandlerResult<TTaskSlug>;
} | {
    input: (args: {
        job: Job<TWorkflowSlug>;
    }) => TypedJobs['tasks'][TTaskSlug]['input'];
    task: TTaskSlug;
});
type AllWorkflowSteps<TWorkflowSlug extends false | keyof TypedJobs['workflows'] = false> = {
    [TTaskSlug in keyof TypedJobs['tasks']]: WorkflowStep<TTaskSlug, TWorkflowSlug>;
}[keyof TypedJobs['tasks']];
type WorkflowJSON<TWorkflowSlug extends false | keyof TypedJobs['workflows'] = false> = Array<AllWorkflowSteps<TWorkflowSlug>>;

type JobLog = {
    completedAt: string;
    error?: unknown;
    executedAt: string;
    /**
     * ID added by the array field when the log is saved in the database
     */
    id: string;
    input?: Record<string, any>;
    output?: Record<string, any>;
    /**
     * Sub-tasks (tasks that are run within a task) will have a parent task ID
     */
    parent?: TaskParent;
    state: 'failed' | 'succeeded';
    taskID: string;
    taskSlug: TaskType;
};
/**
 * @deprecated - will be made private in 4.0. Please use the `Job` type instead.
 */
type BaseJob<TWorkflowSlugOrInput extends false | keyof TypedJobs['workflows'] | object = false> = {
    completedAt?: null | string;
    /**
     * Used for concurrency control. Jobs with the same key are subject to exclusive/supersedes rules.
     */
    concurrencyKey?: null | string;
    createdAt: string;
    error?: unknown;
    hasError?: boolean;
    id: number | string;
    input: TWorkflowSlugOrInput extends false ? object : TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] ? TypedJobs['workflows'][TWorkflowSlugOrInput]['input'] : TWorkflowSlugOrInput;
    log?: JobLog[];
    meta?: {
        [key: string]: unknown;
        /**
         * If true, this job was queued by the scheduling system.
         */
        scheduled?: boolean;
    };
    processing?: boolean;
    queue?: string;
    taskSlug?: null | TaskType;
    taskStatus: JobTaskStatus;
    totalTried: number;
    updatedAt: string;
    waitUntil?: null | string;
    workflowSlug?: null | WorkflowTypes;
};
/**
 * @todo rename to WorkflowSlug in 4.0, similar to CollectionSlug
 */
type WorkflowTypes = StringKeyOf<TypedJobs['workflows']>;
/**
 * @deprecated - will be removed in 4.0. Use `Job` type instead.
 */
type RunningJob<TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] | object> = {
    input: TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] ? TypedJobs['workflows'][TWorkflowSlugOrInput]['input'] : TWorkflowSlugOrInput;
    taskStatus: JobTaskStatus;
} & Omit<TypedCollection['payload-jobs'], 'input' | 'taskStatus'>;
type RunningJobFromTask<TTaskSlug extends keyof TypedJobs['tasks']> = {
    input: TypedJobs['tasks'][TTaskSlug]['input'];
} & TypedCollection['payload-jobs'];
type WorkflowHandler<TWorkflowSlugOrInput extends false | keyof TypedJobs['workflows'] | object = false> = (args: {
    inlineTask: RunInlineTaskFunction;
    job: Job<TWorkflowSlugOrInput>;
    req: PayloadRequest;
    tasks: RunTaskFunctions;
}) => MaybePromise<void>;
type SingleTaskStatus<T extends keyof TypedJobs['tasks']> = {
    complete: boolean;
    input: TaskInput<T>;
    output: TaskOutput<T>;
    taskSlug: TaskType;
    totalTried: number;
};
/**
 * Task IDs mapped to their status
 */
type JobTaskStatus = {
    [taskSlug in TaskType]: {
        [taskID: string]: SingleTaskStatus<taskSlug>;
    };
};
/**
 * Concurrency configuration for workflows and tasks.
 * Controls how jobs with the same concurrency key are handled.
 */
type ConcurrencyConfig<TInput = object> = ((args: {
    input: TInput;
    queue: string;
}) => string) | {
    /**
     * Only one job with this key can run at a time.
     * Other jobs with the same key remain queued until the running job completes.
     * @default true
     */
    exclusive?: boolean;
    /**
     * Function that returns a key to group related jobs.
     * Jobs with the same key are subject to concurrency rules.
     * The queue name is provided to allow for queue-specific concurrency keys if needed.
     */
    key: (args: {
        input: TInput;
        queue: string;
    }) => string;
    /**
     * When a new job is queued, delete older pending (not yet running) jobs with the same key.
     * Already-running jobs are not affected.
     * Useful when only the latest state matters (e.g., regenerating data after multiple rapid edits).
     * @default false
     */
    supersedes?: boolean;
};
type WorkflowConfig<TWorkflowSlugOrInput extends false | keyof TypedJobs['workflows'] | object = false> = {
    /**
     * Job concurrency controls for preventing race conditions.
     *
     * Can be an object with full options, or a shorthand function that just returns the key
     * (in which case exclusive defaults to true).
     */
    concurrency?: ConcurrencyConfig<TWorkflowSlugOrInput extends false ? object : TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] ? TypedJobs['workflows'][TWorkflowSlugOrInput]['input'] : TWorkflowSlugOrInput>;
    /**
     * You can either pass a string-based path to the workflow function file, or the workflow function itself.
     *
     * If you are using large dependencies within your workflow control flow, you might prefer to pass the string path
     * because that will avoid bundling large dependencies in your Next.js app. Passing a string path is an advanced feature
     * that may require a sophisticated build pipeline in order to work.
     */
    handler: string | WorkflowHandler<TWorkflowSlugOrInput> | WorkflowJSON<TWorkflowSlugOrInput extends object ? string : TWorkflowSlugOrInput>;
    /**
     * Define the input field schema  - payload will generate a type for this schema.
     */
    inputSchema?: Field[];
    /**
     * You can use interfaceName to change the name of the interface that is generated for this workflow. By default, this is "Workflow" + the capitalized workflow slug.
     */
    interfaceName?: string;
    /**
     * Define a human-friendly label for this workflow.
     */
    label?: string;
    /**
     * Optionally, define the default queue name that this workflow should be tied to.
     * Defaults to "default".
     * Can be overridden when queuing jobs via Local API.
     */
    queue?: string;
    /**
     * You can define `retries` on the workflow level, which will enforce that the workflow can only fail up to that number of retries. If a task does not have retries specified, it will inherit the retry count as specified on the workflow.
     *
     * You can specify `0` as `workflow` retries, which will disregard all `task` retry specifications and fail the entire workflow on any task failure.
     * You can leave `workflow` retries as undefined, in which case, the workflow will respect what each task dictates as their own retry count.
     *
     * @default undefined. By default, workflows retries are defined by their tasks
     */
    retries?: number | RetryConfig | undefined;
    /**
     * Allows automatically scheduling this workflow to run regularly at a specified interval.
     */
    schedule?: ScheduleConfig[];
    /**
     * Define a slug-based name for this job.
     */
    slug: TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] ? TWorkflowSlugOrInput : string;
};

/**
 * Type for data stored in the payload-jobs-stats global.
 */
type JobStats = {
    stats?: {
        scheduledRuns?: {
            queues?: {
                [queueSlug: string]: {
                    tasks?: {
                        [taskSlug: TaskType]: {
                            lastScheduledRun: string;
                        };
                    };
                    workflows?: {
                        [workflowSlug: WorkflowTypes]: {
                            lastScheduledRun: string;
                        };
                    };
                };
            };
        };
    };
};

type HandleSchedulesResult = {
    errored: Queueable[];
    queued: Queueable[];
    skipped: Queueable[];
};

type RunJobsSilent = {
    error?: boolean;
    info?: boolean;
} | boolean;

type AutorunCronConfig = {
    /**
     * If you want to autoRUn jobs from all queues, set this to true.
     * If you set this to true, the `queue` property will be ignored.
     *
     * @default false
     */
    allQueues?: boolean;
    /**
     * The cron schedule for the job.
     * @default '* * * * *' (every minute).
     *
     * @example
     *     ┌───────────── (optional) second (0 - 59)
     *     │ ┌───────────── minute (0 - 59)
     *     │ │ ┌───────────── hour (0 - 23)
     *     │ │ │ ┌───────────── day of the month (1 - 31)
     *     │ │ │ │ ┌───────────── month (1 - 12)
     *     │ │ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
     *     │ │ │ │ │ │
     *     │ │ │ │ │ │
     *  - '* 0 * * * *' every hour at minute 0
     *  - '* 0 0 * * *' daily at midnight
     *  - '* 0 0 * * 0' weekly at midnight on Sundays
     *  - '* 0 0 1 * *' monthly at midnight on the 1st day of the month
     *  - '* 0/5 * * * *' every 5 minutes
     *  - '* * * * * *' every second
     */
    cron?: string;
    /**
     * By default, the autorun will attempt to schedule jobs for tasks and workflows that have a `schedule` property, given
     * the queue name is the same.
     *
     * Set this to `true` to disable the scheduling of jobs automatically.
     *
     * @default false
     */
    disableScheduling?: boolean;
    /**
     * The limit for the job. This can be overridden by the user. Defaults to 10.
     */
    limit?: number;
    /**
     * The queue name for the job.
     *
     * @default 'default'
     */
    queue?: string;
    /**
     * If set to true, the job system will not log any output to the console (for both info and error logs).
     * Can be an option for more granular control over logging.
     *
     * This will not automatically affect user-configured logs (e.g. if you call `console.log` or `payload.logger.info` in your job code).
     *
     * @default false
     */
    silent?: RunJobsSilent;
};
type RunJobAccessArgs = {
    req: PayloadRequest;
};
type RunJobAccess = (args: RunJobAccessArgs) => MaybePromise<boolean>;
type QueueJobAccessArgs = {
    req: PayloadRequest;
};
type CancelJobAccessArgs = {
    req: PayloadRequest;
};
type CancelJobAccess = (args: CancelJobAccessArgs) => MaybePromise<boolean>;
type QueueJobAccess = (args: QueueJobAccessArgs) => MaybePromise<boolean>;
type SanitizedJobsConfig = {
    /**
     * If set to `true`, the job system is enabled and a payload-jobs collection exists.
     * This property is automatically set during sanitization.
     */
    enabled?: boolean;
    /**
     * If set to `true`, at least one task or workflow has scheduling enabled.
     * This property is automatically set during sanitization.
     */
    scheduling?: boolean;
    /**
     * If set to `true`, a payload-job-stats global exists.
     * This property is automatically set during sanitization.
     */
    stats?: boolean;
} & JobsConfig;
type JobsConfig = {
    /**
     * Specify access control to determine who can interact with jobs.
     */
    access?: {
        /**
         * By default, all logged-in users can cancel jobs.
         */
        cancel?: CancelJobAccess;
        /**
         * By default, all logged-in users can queue jobs.
         */
        queue?: QueueJobAccess;
        /**
         * By default, all logged-in users can run jobs.
         */
        run?: RunJobAccess;
    };
    /** Adds information about the parent job to the task log. This is useful for debugging and tracking the flow of tasks.
     *
     * In 4.0, this will default to `true`.
     *
     * @default false
     */
    addParentToTaskLog?: boolean;
    /**
     * Allows you to configure cron jobs that automatically run queued jobs
     * at specified intervals. Note that this does not _queue_ new jobs - only
     * _runs_ jobs that are already in the specified queue.
     *
     * @remark this property should not be used on serverless platforms like Vercel
     */
    autoRun?: ((payload: Payload) => MaybePromise<AutorunCronConfig[]>) | AutorunCronConfig[];
    /**
     * Determine whether or not to delete a job after it has successfully completed.
     */
    deleteJobOnComplete?: boolean;
    /**
     * Specify depth for retrieving jobs from the queue.
     * This should be as low as possible in order for job retrieval
     * to be as efficient as possible. Setting it to anything higher than
     * 0 will drastically affect performance, as less efficient database
     * queries will be used.
     *
     * @default 0
     * @deprecated - this will be removed in 4.0
     */
    depth?: number;
    /**
     * Enable concurrency controls for workflows and tasks.
     * When enabled, adds a `concurrencyKey` field to the jobs collection schema.
     * This allows workflows and tasks to use the `concurrency` option to prevent race conditions.
     *
     * **Important:** Enabling this may require a database migration depending on your database adapter,
     * as it adds a new indexed field to the jobs collection schema.
     *
     * @default false
     * @todo In 4.0, this will default to `true`.
     */
    enableConcurrencyControl?: boolean;
    /**
     * Override any settings on the default Jobs collection. Accepts the default collection and allows you to return
     * a new collection.
     */
    jobsCollectionOverrides?: (args: {
        defaultJobsCollection: CollectionConfig;
    }) => CollectionConfig;
    /**
     * Adjust the job processing order using a Payload sort string. This can be set globally or per queue.
     *
     * FIFO would equal `createdAt` and LIFO would equal `-createdAt`.
     *
     * @default all jobs for all queues will be executed in FIFO order.
     */
    processingOrder?: ((args: RunJobsArgs) => Promise<Sort> | Sort) | {
        default?: Sort;
        queues: {
            [queue: string]: Sort;
        };
    } | Sort;
    /**
     * By default, the job system uses direct database calls for optimal performance.
     * If you added custom hooks to your jobs collection, you can set this to true to
     * use the standard Payload API for all job operations. This is discouraged, as it will
     * drastically affect performance.
     *
     * @default false
     * @deprecated - this will be removed in 4.0
     */
    runHooks?: boolean;
    /**
     * A function that will be executed before Payload picks up jobs which are configured by the `jobs.autorun` function.
     * If this function returns true, jobs will be queried and picked up. If it returns false, jobs will not be run.
     * @default undefined - if this function is not defined, jobs will be run - as if () => true was passed.
     * @param payload
     * @returns boolean
     */
    shouldAutoRun?: (payload: Payload) => MaybePromise<boolean>;
    /**
     * Define all possible tasks here
     */
    tasks?: TaskConfig<any>[];
    /**
     * Define all the workflows here. Workflows orchestrate the flow of multiple tasks.
     */
    workflows?: WorkflowConfig<any>[];
};
type Queueable = {
    scheduleConfig: ScheduleConfig;
    taskConfig?: TaskConfig;
    waitUntil?: Date;
    workflowConfig?: WorkflowConfig;
};
type BeforeScheduleFn = (args: {
    defaultBeforeSchedule: BeforeScheduleFn;
    /**
     * payload-job-stats global data
     */
    jobStats: JobStats;
    queueable: Queueable;
    req: PayloadRequest;
}) => MaybePromise<{
    input?: object;
    shouldSchedule: boolean;
    waitUntil?: Date;
}>;
type AfterScheduleFn = (args: {
    defaultAfterSchedule: AfterScheduleFn;
    /**
     * payload-job-stats global data. If the global does not exist, it will be null.
     */
    jobStats: JobStats | null;
    queueable: Queueable;
    req: PayloadRequest;
} & ({
    error: Error;
    job?: never;
    status: 'error';
} | {
    error?: never;
    job: Job;
    status: 'success';
} | {
    error?: never;
    job?: never;
    /**
     * If the beforeSchedule hook returned `shouldSchedule: false`, this will be called with status `skipped`.
     */
    status: 'skipped';
})) => MaybePromise<void>;
type ScheduleConfig = {
    /**
     * The cron for scheduling the job.
     *
     * @example
     *     ┌───────────── (optional) second (0 - 59)
     *     │ ┌───────────── minute (0 - 59)
     *     │ │ ┌───────────── hour (0 - 23)
     *     │ │ │ ┌───────────── day of the month (1 - 31)
     *     │ │ │ │ ┌───────────── month (1 - 12)
     *     │ │ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
     *     │ │ │ │ │ │
     *     │ │ │ │ │ │
     *  - '* 0 * * * *' every hour at minute 0
     *  - '* 0 0 * * *' daily at midnight
     *  - '* 0 0 * * 0' weekly at midnight on Sundays
     *  - '* 0 0 1 * *' monthly at midnight on the 1st day of the month
     *  - '* 0/5 * * * *' every 5 minutes
     *  - '* * * * * *' every second
     */
    cron: string;
    hooks?: {
        /**
         * Functions that will be executed after the job has been successfully scheduled.
         *
         * @default By default, global update?? Unless global update should happen before
         */
        afterSchedule?: AfterScheduleFn;
        /**
         * Functions that will be executed before the job is scheduled.
         * You can use this to control whether or not the job should be scheduled, or what input
         * data should be passed to the job.
         *
         * @default By default, this has one function that returns { shouldSchedule: true } if the following conditions are met:
         * - There currently is no job of the same type in the specified queue that is currently running
         * - There currently is no job of the same type in the specified queue that is scheduled to run in the future
         * - There currently is no job of the same type in the specified queue that failed previously but can be retried
         */
        beforeSchedule?: BeforeScheduleFn;
    };
    /**
     * Queue to which the scheduled job will be added.
     */
    queue: string;
};

/**
 * Payload internal logger. Uses Pino.
 * This allows you to bring your own logger instance and let payload use it
 */
type PayloadLogger = Logger;
declare const defaultLoggerOptions: PinoPretty.PrettyStream;

/**
 * The string path pointing to the React component. If one of the generics is `never`, you effectively mark it as a server-only or client-only component.
 *
 * If it is `false` an empty component will be rendered.
 */
type PayloadComponent<TComponentServerProps extends never | object = Record<string, any>, TComponentClientProps extends never | object = Record<string, any>> = false | RawPayloadComponent<TComponentServerProps, TComponentClientProps> | string;
type RawPayloadComponent<TComponentServerProps extends never | object = Record<string, any>, TComponentClientProps extends never | object = Record<string, any>> = {
    clientProps?: object | TComponentClientProps;
    exportName?: string;
    path: string;
    serverProps?: object | TComponentServerProps;
};
type PayloadComponentProps<TPayloadComponent> = TPayloadComponent extends RawPayloadComponent<infer TComponentServerProps, infer TComponentClientProps> ? TComponentClientProps | TComponentServerProps : never;
type PayloadClientComponentProps<TPayloadComponent> = TPayloadComponent extends RawPayloadComponent<infer _, infer TComponentClientProps> ? TComponentClientProps : never;
type PayloadServerComponentProps<TPayloadComponent> = TPayloadComponent extends RawPayloadComponent<infer TComponentServerProps, infer _> ? TComponentServerProps : never;
type PayloadReactComponent<TPayloadComponent> = React$1.FC<PayloadComponentProps<TPayloadComponent>>;
type PayloadClientReactComponent<TPayloadComponent> = TPayloadComponent extends RawPayloadComponent<infer _, infer TComponentClientProps> ? TComponentClientProps extends never ? never : React$1.FC<TComponentClientProps> : never;
type PayloadServerReactComponent<TPayloadComponent> = TPayloadComponent extends RawPayloadComponent<infer TComponentServerProps, infer _> ? TComponentServerProps extends never ? never : React$1.FC<TComponentServerProps> : never;
type ResolvedComponent<TComponentServerProps extends never | object, TComponentClientProps extends never | object> = {
    clientProps?: TComponentClientProps;
    Component: React$1.FC<TComponentClientProps | TComponentServerProps>;
    serverProps?: TComponentServerProps;
};
type BinScriptConfig = {
    key: string;
    scriptPath: string;
};
type BinScript = (config: SanitizedConfig) => Promise<void> | void;
type Prettify<T> = {
    [K in keyof T]: T[K];
} & NonNullable<unknown>;
type Plugin = (config: Config) => Config | Promise<Config>;
type LivePreviewURLType = null | string | undefined;
type LivePreviewConfig = {
    /**
     Device breakpoints to use for the `iframe` of the Live Preview window.
     Options are displayed in the Live Preview toolbar.
     The `responsive` breakpoint is included by default.
     */
    breakpoints?: {
        height: number | string;
        label: string;
        name: string;
        width: number | string;
    }[];
    /**
     * The URL of the frontend application. This will be rendered within an `iframe` as its `src`.
     * Payload will send a `window.postMessage()` to this URL with the document data in real-time.
     * The frontend application is responsible for receiving the message and updating the UI accordingly.
     * @see https://payloadcms.com/docs/live-preview/frontend
     *
     * To conditionally render Live Preview, use a function that returns `undefined` or `null`.
     *
     * Note: this function may run often if autosave is enabled with a small interval.
     * For performance, avoid long-running tasks or expensive operations within this function,
     * or if you need to do something more complex, cache your function as needed.
     */
    url?: ((args: {
        collectionConfig?: SanitizedCollectionConfig;
        data: Record<string, any>;
        globalConfig?: SanitizedGlobalConfig;
        locale: Locale;
        /**
         * @deprecated
         * Use `req.payload` instead. This will be removed in the next major version.
         */
        payload: Payload;
        req: PayloadRequest;
    }) => LivePreviewURLType | Promise<LivePreviewURLType>) | LivePreviewURLType;
};
type RootLivePreviewConfig = {
    collections?: string[];
    globals?: string[];
} & LivePreviewConfig;
type OGImageConfig = {
    alt?: string;
    height?: number | string;
    type?: string;
    url: string;
    width?: number | string;
};
/**
 * @todo find a way to remove the deep clone here.
 * It can probably be removed after the `DeepRequired` from `Config` to `SanitizedConfig` is removed.
 * Same with `CollectionConfig` to `SanitizedCollectionConfig`.
 */
type DeepClone<T> = T extends object ? {
    [K in keyof T]: DeepClone<T[K]>;
} : T;
type MetaConfig = {
    /**
     * When `static`, a pre-made image will be used for all pages.
     * When `dynamic`, a unique image will be generated for each page based on page content and given overrides.
     * When `off`, no Open Graph images will be generated and the `/api/og` endpoint will be disabled. You can still provide custom images using the `openGraph.images` property.
     * @default 'dynamic'
     */
    defaultOGImageType?: 'dynamic' | 'off' | 'static';
    /**
     * String to append to the auto-generated <title> of admin pages
     * @example `" - Custom CMS"`
     */
    titleSuffix?: string;
} & DeepClone<Metadata>;
type ServerOnlyLivePreviewProperties = keyof Pick<RootLivePreviewConfig, 'url'>;
type GeneratePreviewURLOptions = {
    locale: string;
    req: PayloadRequest;
    token: null | string;
};
type GeneratePreviewURL = (doc: Record<string, unknown>, options: GeneratePreviewURLOptions) => null | Promise<null | string> | string;
type GraphQLInfo = {
    collections: {
        [slug: string]: Collection;
    };
    globals: Globals;
    Mutation: {
        fields: Record<string, any>;
        name: string;
    };
    Query: {
        fields: Record<string, any>;
        name: string;
    };
    types: {
        arrayTypes: Record<string, GraphQL.GraphQLType>;
        blockInputTypes: Record<string, GraphQL.GraphQLInputObjectType>;
        blockTypes: Record<string, GraphQL.GraphQLObjectType>;
        fallbackLocaleInputType?: GraphQL.GraphQLEnumType | GraphQL.GraphQLScalarType;
        groupTypes: Record<string, GraphQL.GraphQLObjectType>;
        localeInputType?: GraphQL.GraphQLEnumType | GraphQL.GraphQLScalarType;
        tabTypes: Record<string, GraphQL.GraphQLObjectType>;
    };
};
type GraphQLExtension = (graphQL: typeof GraphQL, context: {
    config: SanitizedConfig;
} & GraphQLInfo) => Record<string, unknown>;
type InitOptions = {
    /**
     * Sometimes, with the local API, you might need to pass a config file directly, for example, serverless on Vercel
     * The passed config should match the config file, and if it doesn't, there could be mismatches between the admin UI
     * and the backend functionality
     */
    config: Promise<SanitizedConfig> | SanitizedConfig;
    /**
     * If set to `true`, payload will initialize crons for things like autorunning jobs on initialization.
     *
     * @default false
     */
    cron?: boolean;
    /**
     * Disable connect to the database on init
     */
    disableDBConnect?: boolean;
    /**
     * Disable running of the `onInit` function
     */
    disableOnInit?: boolean;
    importMap?: ImportMap;
    /**
     * A function that is called immediately following startup that receives the Payload instance as it's only argument.
     */
    onInit?: (payload: Payload) => Promise<void> | void;
};
/**
 * This result is calculated on the server
 * and then sent to the client allowing the dashboard to show accessible data and actions.
 *
 * If the result is `true`, the user has access.
 * If the result is an object, it is interpreted as a MongoDB query.
 *
 * @example `{ createdBy: { equals: id } }`
 *
 * @example `{ tenant: { in: tenantIds } }`
 *
 * @see https://payloadcms.com/docs/access-control/overview
 */
type AccessResult = boolean | Where;
type AccessArgs<TData = any> = {
    /**
     * The relevant resource that is being accessed.
     *
     * `data` is null when a list is requested
     */
    data?: TData;
    /** ID of the resource being accessed */
    id?: DefaultDocumentIDType;
    /** If true, the request is for a static file */
    isReadingStaticFile?: boolean;
    /** The original request that requires an access check */
    req: PayloadRequest;
};
/**
 * Access function runs on the server
 * and is sent to the client allowing the dashboard to show accessible data and actions.
 *
 * @see https://payloadcms.com/docs/access-control/overview
 */
type Access<TData = any> = (args: AccessArgs<TData>) => AccessResult | Promise<AccessResult>;
/** Web Request/Response model, but the req has more payload specific properties added to it. */
type PayloadHandler = (req: PayloadRequest) => Promise<Response> | Response;
/**
 * Docs: https://payloadcms.com/docs/rest-api/overview#custom-endpoints
 */
type Endpoint = {
    /** Extension point to add your custom data. */
    custom?: Record<string, any>;
    /**
     * Middleware that will be called when the path/method matches
     *
     * Compatible with Web Request/Response Model
     */
    handler: PayloadHandler;
    /** HTTP method */
    method: 'connect' | 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put';
    /**
     * Pattern that should match the path of the incoming request
     *
     * Compatible with the Express router
     */
    path: string;
    /**
     * Please add "root" routes under the /api folder in the Payload Project.
     * https://nextjs.org/docs/app/api-reference/file-conventions/route
     *
     * @deprecated in 3.0
     */
    root?: never;
};
/**
 * @deprecated
 * This type will be renamed in v4.
 * Use `DocumentViewComponent` instead.
 */
type EditViewComponent = DocumentViewComponent;
type DocumentViewComponent = PayloadComponent<DocumentViewServerProps>;
/**
 * @deprecated
 * This type will be renamed in v4.
 * Use `DocumentViewConfig` instead.
 */
type EditViewConfig = DocumentViewConfig;
type BaseDocumentViewConfig = {
    actions?: CustomComponent[];
    meta?: MetaConfig;
    tab?: DocumentTabConfig;
};
type CustomDocumentViewConfig = ({
    Component: DocumentViewComponent;
    path: `/${string}`;
} & BaseDocumentViewConfig) | ({
    Component?: DocumentViewComponent;
    path?: never;
} & BaseDocumentViewConfig);
type DefaultDocumentViewConfig = {
    Component?: DocumentViewComponent;
} & BaseDocumentViewConfig;
type DocumentViewConfig = CustomDocumentViewConfig | DefaultDocumentViewConfig;
type Params = {
    [key: string]: string | string[] | undefined;
};
type ServerProps = {
    readonly documentSubViewType?: DocumentSubViewTypes;
    readonly i18n: I18nClient;
    readonly id?: number | string;
    readonly locale?: Locale;
    readonly params?: Params;
    readonly payload: Payload;
    readonly permissions?: SanitizedPermissions;
    readonly searchParams?: Params;
    readonly user?: TypedUser;
    readonly viewType?: ViewTypes;
    readonly visibleEntities?: VisibleEntities;
};
declare const serverProps: (keyof ServerProps)[];
type Timezone = {
    label: string;
    value: string;
};
type SupportedTimezonesFn = (args: {
    defaultTimezones: Timezone[];
}) => Timezone[];
type TimezonesConfig = {
    /**
     * The default timezone to use for the admin panel.
     */
    defaultTimezone?: string;
    /**
     * Provide your own list of supported timezones for the admin panel
     *
     * Values should be IANA timezone names, eg. `America/New_York`
     *
     * We use `@date-fns/tz` to handle timezones
     */
    supportedTimezones?: SupportedTimezonesFn | Timezone[];
};
type SanitizedTimezoneConfig = {
    supportedTimezones: Timezone[];
} & Omit<TimezonesConfig, 'supportedTimezones'>;
type CustomComponent<TAdditionalProps extends object = Record<string, any>> = PayloadComponent<ServerProps & TAdditionalProps, TAdditionalProps>;
type Locale = {
    /**
     * value of supported locale
     * @example "en"
     */
    code: string;
    /**
     * Code of another locale to use when reading documents with fallback, if not specified defaultLocale is used
     */
    fallbackLocale?: string | string[];
    /**
     * label of supported locale
     * @example "English"
     */
    label: Record<string, string> | string;
    /**
     * if true, defaults textAligmnent on text fields to RTL
     */
    rtl?: boolean;
};
type BaseLocalizationConfig = {
    /**
     * Locale for users that have not expressed their preference for a specific locale
     * @example `"en"`
     */
    defaultLocale: string;
    /**
     * Change the locale used by the default Publish button.
     * If set to `all`, all locales will be published.
     * If set to `active`, only the locale currently being edited will be published.
     * The non-default option will be available via the secondary button.
     * @default 'all'
     */
    defaultLocalePublishOption?: 'active' | 'all';
    /** Set to `true` to let missing values in localised fields fall back to the values in `defaultLocale`
     *
     * If false, then no requests will fallback unless a fallbackLocale is specified in the request.
     * @default true
     */
    fallback?: boolean;
    /**
     * Define a function to filter the locales made available in Payload admin UI
     * based on user.
     */
    filterAvailableLocales?: (args: {
        locales: Locale[];
        req: PayloadRequest;
    }) => Locale[] | Promise<Locale[]>;
};
type LocalizationConfigWithNoLabels = Prettify<{
    /**
     * List of supported locales
     * @example `["en", "es", "fr", "nl", "de", "jp"]`
     */
    locales: string[];
} & BaseLocalizationConfig>;
type LocalizationConfigWithLabels = Prettify<{
    /**
     * List of supported locales with labels
     * @example {
     *  label: 'English',
     *  value: 'en',
     *  rtl: false
     * }
     */
    locales: Locale[];
} & BaseLocalizationConfig>;
type SanitizedLocalizationConfig = Prettify<{
    /**
     * List of supported locales
     * @example `["en", "es", "fr", "nl", "de", "jp"]`
     */
    localeCodes: string[];
} & LocalizationConfigWithLabels>;
/**
 * @see https://payloadcms.com/docs/configuration/localization#localization
 */
type LocalizationConfig = Prettify<LocalizationConfigWithLabels | LocalizationConfigWithNoLabels>;
type LabelFunction<TTranslationKeys = DefaultTranslationKeys> = (args: {
    i18n: I18nClient;
    t: TFunction<TTranslationKeys>;
}) => string;
type StaticLabel = Record<string, string> | string;
type SharpDependency = (input?: ArrayBuffer | Buffer | Float32Array | Float64Array | Int8Array | Int16Array | Int32Array | string | Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array, options?: sharp.SharpOptions) => sharp.Sharp;
type CORSConfig = {
    headers?: string[];
    origins: '*' | string[];
};
type AdminFunction = {
    args?: object;
    path: string;
    type: 'function';
};
type AdminComponent = {
    clientProps?: object;
    path: string;
    serverProps?: object;
    type: 'component';
};
interface AdminDependencies {
    [key: string]: AdminComponent | AdminFunction;
}
type FetchAPIFileUploadOptions = {
    /**
     * Returns a HTTP 413 when the file is bigger than the size limit if `true`.
     * Otherwise, it will add a `truncated = true` to the resulting file structure.
     * @default false
     */
    abortOnLimit?: boolean | undefined;
    /**
     * Automatically creates the directory path specified in `.mv(filePathName)`
     * @default false
     */
    createParentPath?: boolean | undefined;
    /**
     * Turn on/off upload process logging. Can be useful for troubleshooting.
     * @default false
     */
    debug?: boolean | undefined;
    /**
     * User defined limit handler which will be invoked if the file is bigger than configured limits.
     * @default false
     */
    limitHandler?: ((args: {
        request: Request;
        size: number;
    }) => void) | boolean | undefined;
    /**
     * By default, `req.body` and `req.files` are flattened like this:
     * `{'name': 'John', 'hobbies[0]': 'Cinema', 'hobbies[1]': 'Bike'}
     *
     * When this option is enabled they are parsed in order to be nested like this:
     * `{'name': 'John', 'hobbies': ['Cinema', 'Bike']}`
     * @default false
     */
    parseNested?: boolean | undefined;
    /**
     * Preserves filename extension when using `safeFileNames` option.
     * If set to `true`, will default to an extension length of `3`.
     * If set to `number`, this will be the max allowable extension length.
     * If an extension is smaller than the extension length, it remains untouched. If the extension is longer,
     * it is shifted.
     * @default false
     *
     * @example
     * // true
     * app.use(fileUpload({ safeFileNames: true, preserveExtension: true }));
     * // myFileName.ext --> myFileName.ext
     *
     * @example
     * // max extension length 2, extension shifted
     * app.use(fileUpload({ safeFileNames: true, preserveExtension: 2 }));
     * // myFileName.ext --> myFileNamee.xt
     */
    preserveExtension?: boolean | number | undefined;
    /**
     * Response which will be send to client if file size limit exceeded when `abortOnLimit` set to `true`.
     * @default 'File size limit has been reached'
     */
    responseOnLimit?: string | undefined;
    /**
     * Strips characters from the upload's filename.
     * You can use custom regex to determine what to strip.
     * If set to `true`, non-alphanumeric characters _except_ dashes and underscores will be stripped.
     * This option is off by default.
     * @default false
     *
     * @example
     * // strip slashes from file names
     * app.use(fileUpload({ safeFileNames: /\\/g }))
     *
     * @example
     * app.use(fileUpload({ safeFileNames: true }))
     */
    safeFileNames?: boolean | RegExp | undefined;
    /**
     * Path to store temporary files.
     * Used along with the `useTempFiles` option. By default this module uses `'tmp'` folder
     * in the current working directory.
     * You can use trailing slash, but it is not necessary.
     * @default './tmp'
     */
    tempFileDir?: string | undefined;
    /**
     * This defines how long to wait for data before aborting. Set to `0` if you want to turn off timeout checks.
     * @default 60_000
     */
    uploadTimeout?: number | undefined;
    /**
     * Applies uri decoding to file names if set `true`.
     * @default false
     */
    uriDecodeFileNames?: boolean | undefined;
    /**
     * By default this module uploads files into RAM.
     * Setting this option to `true` turns on using temporary files instead of utilising RAM.
     * This avoids memory overflow issues when uploading large files or in case of uploading
     * lots of files at same time.
     * @default false
     */
    useTempFiles?: boolean | undefined;
} & Partial<BusboyConfig>;
type ErrorResult = {
    data?: any;
    errors: {
        data?: Record<string, unknown>;
        field?: string;
        message?: string;
        name?: string;
    }[];
    stack?: string;
};
type AfterErrorResult = {
    graphqlResult?: GraphQLFormattedError;
    response?: Partial<ErrorResult> & Record<string, unknown>;
    status?: number;
} | void;
type AfterErrorHookArgs = {
    /** The Collection that the hook is operating on. This will be undefined if the hook is executed from a non-collection endpoint or GraphQL. */
    collection?: SanitizedCollectionConfig;
    /** 	Custom context passed between hooks */
    context: RequestContext;
    /** The error that occurred. */
    error: Error;
    /** The GraphQL result object, available if the hook is executed within a GraphQL context. */
    graphqlResult?: GraphQLFormattedError;
    /** The Request object containing the currently authenticated user. */
    req: PayloadRequest;
    /** The formatted error result object, available if the hook is executed from a REST context. */
    result?: ErrorResult;
};
type ImportMapGenerators = Array<(props: {
    addToImportMap: AddToImportMap;
    baseDir: string;
    config: SanitizedConfig;
    importMap: InternalImportMap;
    imports: Imports;
}) => void>;
type AfterErrorHook$1 = (args: AfterErrorHookArgs) => AfterErrorResult | Promise<AfterErrorResult>;
type WidgetWidth = 'full' | 'large' | 'medium' | 'small' | 'x-large' | 'x-small';
type Widget = {
    ComponentPath: string;
    /**
     * Human-friendly label for the widget.
     * Supports i18n by passing an object with locale keys, or a function with `t` for translations.
     * If not provided, the label will be auto-generated from the slug.
     */
    label?: LabelFunction | StaticLabel;
    maxWidth?: WidgetWidth;
    minWidth?: WidgetWidth;
    slug: string;
};
/**
 * Client-side widget type with resolved label (no functions).
 */
type ClientWidget = {
    label?: StaticLabel;
    maxWidth?: WidgetWidth;
    minWidth?: WidgetWidth;
    slug: string;
};
type WidgetInstance = {
    widgetSlug: string;
    width?: WidgetWidth;
};
type DashboardConfig = {
    defaultLayout?: ((args: {
        req: PayloadRequest;
    }) => Array<WidgetInstance> | Promise<Array<WidgetInstance>>) | Array<WidgetInstance>;
    widgets: Array<Widget>;
};
type SanitizedDashboardConfig = {
    widgets: Array<Omit<Widget, 'ComponentPath'>>;
};
/**
 * This is the central configuration
 *
 * @see https://payloadcms.com/docs/configuration/overview
 */
type Config = {
    /** Configure admin dashboard */
    admin?: {
        /** Automatically log in as a user */
        autoLogin?: {
            /**
             * The email address of the user to login as
             */
            email?: string;
            /** The password of the user to login as. This is only needed if `prefillOnly` is set to true */
            password?: string;
            /**
             * If set to true, the login credentials will be prefilled but the user will still need to click the login button.
             *
             * @default false
             */
            prefillOnly?: boolean;
            /** The username of the user to login as */
            username?: string;
        } | false;
        /**
         * Automatically refresh user tokens for users logged into the dashboard
         *
         * @default false
         */
        autoRefresh?: boolean;
        /** Set account profile picture. Options: gravatar, default or a custom React component. */
        avatar?: 'default' | 'gravatar' | {
            Component: PayloadComponent;
        };
        /**
         * Add extra and/or replace built-in components with custom components
         *
         * @see https://payloadcms.com/docs/admin/custom-components/overview
         */
        components?: {
            /**
             * Add custom components to the top right of the Admin Panel
             */
            actions?: CustomComponent[];
            /**
             * Add custom components after the collection overview
             */
            afterDashboard?: CustomComponent[];
            /**
             * Add custom components after the email/password field
             */
            afterLogin?: CustomComponent[];
            /**
             * Add custom components after the navigation links
             */
            afterNavLinks?: CustomComponent[];
            /**
             * Add custom components before the collection overview
             */
            beforeDashboard?: CustomComponent[];
            /**
             * Add custom components before the email/password field
             */
            beforeLogin?: CustomComponent[];
            /**
             * Add custom components before the navigation links
             */
            beforeNavLinks?: CustomComponent[];
            /** Replace graphical components */
            graphics?: {
                /** Replace the icon in the navigation */
                Icon?: CustomComponent;
                /** Replace the logo on the login page */
                Logo?: CustomComponent;
            };
            /**
             * Add custom header to top of page globally
             */
            header?: CustomComponent[];
            /** Replace logout related components */
            logout?: {
                /** Replace the logout button  */
                Button?: CustomComponent;
            };
            /**
             * Replace the navigation with a custom component
             */
            Nav?: CustomComponent;
            /**
             * Wrap the admin dashboard in custom context providers
             */
            providers?: PayloadComponent<{
                children?: React$1.ReactNode;
            }, {
                children?: React$1.ReactNode;
            }>[];
            /**
             * Add custom menu items to the navigation menu accessible via the gear icon.
             * These components will be rendered in a popup menu above the logout button.
             */
            settingsMenu?: CustomComponent[];
            /**
             * Replace or modify top-level admin routes, or add new ones:
             * + `Account` - `/admin/account`
             * + `Dashboard` - `/admin`
             * + `:path` - `/admin/:path`
             */
            views?: {
                /** Add custom admin views */
                [key: string]: AdminViewConfig;
                /** Replace the account screen */
                account?: AdminViewConfig;
                /** Replace the admin homepage */
                dashboard?: AdminViewConfig;
            };
        };
        /** Extension point to add your custom data. Available in server and client. */
        custom?: Record<string, any>;
        /**
         * Customize the dashboard widgets
         * @experimental This prop is subject to change in future releases.
         */
        dashboard?: DashboardConfig;
        /** Global date format that will be used for all dates in the Admin panel. Any valid date-fns format pattern can be used. */
        dateFormat?: string;
        /**
         * Each entry in this map generates an entry in the importMap.
         */
        dependencies?: AdminDependencies;
        /**
         * @deprecated
         * This option is deprecated and will be removed in v4.
         * To disable the admin panel itself, delete your `/app/(payload)/admin` directory.
         * To disable all REST API and GraphQL endpoints, delete your `/app/(payload)/api` directory.
         * Note: If you've modified the default paths via `admin.routes`, delete those directories instead.
         */
        disable?: boolean;
        importMap?: {
            /**
             * Automatically generate component map during development
             * @default true
             */
            autoGenerate?: boolean;
            /**
             * The base directory for component paths starting with /.
             * @default process.cwd()
             **/
            baseDir?: string;
            /**
             * You can use generators to add custom components to the component import map.
             * This allows you to import custom components in the admin panel.
             */
            generators?: ImportMapGenerators;
            /**
             * If Payload cannot find the import map file location automatically,
             * you can manually provide it here.
             */
            importMapFile?: string;
        };
        /**
         * Live Preview options.
         *
         * @see https://payloadcms.com/docs/live-preview/overview
         */
        livePreview?: RootLivePreviewConfig;
        /** Base meta data to use for the Admin Panel. Included properties are titleSuffix, ogImage, and favicon. */
        meta?: MetaConfig;
        routes?: {
            /** The route for the account page.
             *
             * @default '/account'
             */
            account?: `/${string}`;
            /** The route for the browse by folder view.
             *
             * @default '/browse-by-folder'
             */
            browseByFolder?: `/${string}`;
            /** The route for the create first user page.
             *
             * @default '/create-first-user'
             */
            createFirstUser?: `/${string}`;
            /** The route for the forgot password page.
             *
             * @default '/forgot'
             */
            forgot?: `/${string}`;
            /** The route the user will be redirected to after being inactive for too long.
             *
             * @default '/logout-inactivity'
             */
            inactivity?: `/${string}`;
            /** The route for the login page.
             *
             * @default '/login'
             */
            login?: `/${string}`;
            /** The route for the logout page.
             *
             * @default '/logout'
             */
            logout?: `/${string}`;
            /** The route for the reset password page.
             *
             * @default '/reset'
             */
            reset?: `/${string}`;
            /** The route for the unauthorized page.
             *
             * @default '/unauthorized'
             */
            unauthorized?: `/${string}`;
        };
        /**
         * Suppresses React hydration mismatch warnings during the hydration of the root <html> tag.
         * Useful in scenarios where the server-rendered HTML might intentionally differ from the client-rendered DOM.
         * @default false
         */
        suppressHydrationWarning?: boolean;
        /**
         * Restrict the Admin Panel theme to use only one of your choice
         *
         * @default 'all' // The theme can be configured by users
         */
        theme?: 'all' | 'dark' | 'light';
        /**
         * Configure timezone related settings for the admin panel.
         */
        timezones?: TimezonesConfig;
        /**
         * Configure toast message behavior and appearance in the admin panel.
         * Currently using [Sonner](https://sonner.emilkowal.ski) for toast notifications.
         *
         * @experimental This property is experimental and may change in future releases. Use at your own risk.
         */
        toast?: {
            /**
             * Time in milliseconds until the toast automatically closes.
             * @default 4000
             */
            duration?: number;
            /**
             * If `true`, will expand the message stack so that all messages are shown simultaneously without user interaction.
             * Otherwise only the latest notification can be read until the user hovers the stack.
             * @default false
             */
            expand?: boolean;
            /**
             * The maximum number of toasts that can be visible on the screen at once.
             * @default 5
             */
            limit?: number;
            /**
             * The position of the toast on the screen.
             * @default 'bottom-right'
             */
            position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
        };
        /** The slug of a Collection that you want to be used to log in to the Admin dashboard. */
        user?: string;
    };
    /**
     * Configure authentication-related Payload-wide settings.
     */
    auth?: {
        /**
         * Define which JWT identification methods you'd like to support for Payload's local auth strategy, as well as the order that they're retrieved in.
         * Defaults to ['JWT', 'Bearer', 'cookie]
         */
        jwtOrder: ('Bearer' | 'cookie' | 'JWT')[];
    };
    /** Custom Payload bin scripts can be injected via the config. */
    bin?: BinScriptConfig[];
    blocks?: Block[];
    /**
     * Pass additional options to the parser used to process `multipart/form-data` requests.
     * For example, a PATCH request containing HTML form data.
     * For example, you may want to increase the `limits` imposed by the parser.
     * Currently using @link {https://www.npmjs.com/package/busboy|busboy} under the hood.
     *
     * @experimental This property is experimental and may change in future releases. Use at your own risk.
     */
    bodyParser?: Partial<BusboyConfig>;
    /**
     * Manage the datamodel of your application
     *
     * @see https://payloadcms.com/docs/configuration/collections#collection-configs
     */
    collections?: CollectionConfig[];
    /**
     * Compatibility flags for prior Payload versions
     */
    compatibility?: {
        /**
         * By default, Payload will remove the `localized: true` property
         * from fields if a parent field is localized. Set this property
         * to `true` only if you have an existing Payload database from pre-3.0
         * that you would like to maintain without migrating. This is only
         * relevant for MongoDB databases.
         *
         * @todo Remove in v4
         */
        allowLocalizedWithinLocalized: true;
    };
    /**
     * Prefix a string to all cookies that Payload sets.
     *
     * @default "payload"
     */
    cookiePrefix?: string;
    /** Either a whitelist array of URLS to allow CORS requests from, or a wildcard string ('*') to accept incoming requests from any domain. */
    cors?: '*' | CORSConfig | string[];
    /** A whitelist array of URLs to allow Payload cookies to be accepted from as a form of CSRF protection. */
    csrf?: string[];
    /** Extension point to add your custom data. Server only. */
    custom?: Record<string, any>;
    /** Pass in a database adapter for use on this project. */
    db: DatabaseAdapterResult;
    /** Enable to expose more detailed error information. */
    debug?: boolean;
    /**
     * If a user does not specify `depth` while requesting a resource, this depth will be used.
     *
     * @see https://payloadcms.com/docs/getting-started/concepts#depth
     *
     * @default 2
     */
    defaultDepth?: number;
    /**
     * The maximum allowed depth to be permitted application-wide. This setting helps prevent against malicious queries.
     *
     * @default 40000
     */
    defaultMaxTextLength?: number;
    /** Default richtext editor to use for richText fields */
    editor?: RichTextAdapterProvider<any, any, any>;
    /**
     * Email Adapter
     *
     * @see https://payloadcms.com/docs/email/overview
     */
    email?: EmailAdapter | Promise<EmailAdapter>;
    /** Custom REST endpoints */
    endpoints?: Endpoint[];
    /**
     * Options for folder view within the admin panel
     *
     * @experimental This feature may change in minor versions until it is fully stable
     */
    folders?: false | RootFoldersConfiguration;
    /**
     * @see https://payloadcms.com/docs/configuration/globals#global-configs
     */
    globals?: GlobalConfig[];
    /**
     * Manage the GraphQL API
     *
     * You can add your own GraphQL queries and mutations to Payload, making use of all the types that Payload has defined for you.
     *
     * @see https://payloadcms.com/docs/graphql/overview
     */
    graphQL?: {
        disable?: boolean;
        /**
         * Disable introspection queries in production.
         *
         * @default true
         */
        disableIntrospectionInProduction?: boolean;
        /**
         * Disable the GraphQL Playground in production.
         *
         * @default true
         */
        disablePlaygroundInProduction?: boolean;
        maxComplexity?: number;
        /**
         * Function that returns an object containing keys to custom GraphQL mutations
         *
         * @see https://payloadcms.com/docs/graphql/extending
         */
        mutations?: GraphQLExtension;
        /**
         * Function that returns an object containing keys to custom GraphQL queries
         *
         * @see https://payloadcms.com/docs/graphql/extending
         */
        queries?: GraphQLExtension;
        /**
         * Filepath to write the generated schema to
         */
        schemaOutputFile?: string;
        /**
         * Function that returns an array of validation rules to apply to the GraphQL schema
         *
         * @see https://payloadcms.com/docs/graphql/overview#custom-validation-rules
         */
        validationRules?: (args: GraphQL.ExecutionArgs) => GraphQL.ValidationRule[];
    };
    /**
     * Tap into Payload-wide hooks.
     *
     * @see https://payloadcms.com/docs/hooks/overview
     */
    hooks?: {
        afterError?: AfterErrorHook$1[];
    };
    /** i18n config settings */
    i18n?: I18nOptions<{} | DefaultTranslationsObject>;
    /** Automatically index all sortable top-level fields in the database to improve sort performance and add database compatibility for Azure Cosmos and similar. */
    indexSortableFields?: boolean;
    /**
     * @experimental There may be frequent breaking changes to this API
     */
    jobs?: JobsConfig;
    /**
     * Pass in a KV adapter for use on this project.
     * @default `DatabaseKVAdapter` from:
     * ```ts
     * import { createDatabaseKVAdapter } from 'payload'
     * createDatabaseKVAdapter()
     * ```
     */
    kv?: KVAdapterResult;
    /**
     * Translate your content to different languages/locales.
     *
     * @default false // disable localization
     */
    localization?: false | LocalizationConfig;
    /**
     * Logger options, logger options with a destination stream, or an instantiated logger instance.
     *
     * See Pino Docs for options: https://getpino.io/#/docs/api?id=options
     *
     * ```ts
     * // Logger options only
     * logger: {
     *   level: 'info',
     * }
     *
     * // Logger options with destination stream
     * logger: {
     *  options: {
     *   level: 'info',
     *  },
     *  destination: process.stdout
     * },
     *
     * // Logger instance
     * logger: pino({ name: 'my-logger' })
     *
     * ```
     */
    logger?: 'sync' | {
        destination?: DestinationStream;
        options: LoggerOptions;
    } | PayloadLogger;
    /**
     * Override the log level of errors for Payload's error handler or disable logging with `false`.
     * Levels can be any of the following: 'trace', 'debug', 'info', 'warn', 'error', 'fatal' or false.
     *
     * Default levels:
     * {
    `*   APIError: 'error',
    `*   AuthenticationError: 'error',
    `*   ErrorDeletingFile: 'error',
    `*   FileRetrievalError: 'error',
    `*   FileUploadError: 'error',
    `*   Forbidden: 'info',
    `*   Locked: 'info',
    `*   LockedAuth: 'error',
    `*   MissingFile: 'info',
    `*   NotFound: 'info',
    `*   QueryError: 'error',
    `*   ValidationError: 'info',
     * }
     */
    loggingLevels?: Partial<Record<ErrorName, false | Level>>;
    /**
     * The maximum allowed depth to be permitted application-wide. This setting helps prevent against malicious queries.
     *
     * @see https://payloadcms.com/docs/getting-started/concepts#depth
     *
     * @default 10
     */
    maxDepth?: number;
    /** A function that is called immediately following startup that receives the Payload instance as its only argument. */
    onInit?: (payload: Payload) => Promise<void> | void;
    /**
     * An array of Payload plugins.
     *
     * @see https://payloadcms.com/docs/plugins/overview
     */
    plugins?: Plugin[];
    /**
     * Allow you to save and share filters, columns, and sort orders for your collections.
     * @see https://payloadcms.com/docs/query-presets/overview
     */
    queryPresets?: {
        access: {
            create?: Access<QueryPreset>;
            delete?: Access<QueryPreset>;
            read?: Access<QueryPreset>;
            update?: Access<QueryPreset>;
        };
        constraints: {
            create?: QueryPresetConstraints;
            delete?: QueryPresetConstraints;
            read?: QueryPresetConstraints;
            update?: QueryPresetConstraints;
        };
        filterConstraints?: SelectField['filterOptions'];
        labels?: CollectionConfig['labels'];
    };
    /**
     * Control the routing structure that Payload binds itself to.
     * @link https://payloadcms.com/docs/admin/overview#root-level-routes
     */
    routes?: {
        /**
         * The route for the admin panel.
         * @example "/my-admin" or "/"
         * @default "/admin"
         * @link https://payloadcms.com/docs/admin/overview#root-level-routes
         */
        admin?: string;
        /**
         * The base route for all REST API endpoints.
         * @default "/api"
         * @link https://payloadcms.com/docs/admin/overview#root-level-routes
         */
        api?: string;
        /**
         * The base route for all GraphQL endpoints.
         * @default "/graphql"
         * @link https://payloadcms.com/docs/admin/overview#root-level-routes
         */
        graphQL?: string;
        /**
         * The route for the GraphQL Playground.
         * @default "/graphql-playground"
         * @link https://payloadcms.com/docs/admin/overview#root-level-routes
         */
        graphQLPlayground?: string;
    };
    /** Secure string that Payload will use for any encryption workflows */
    secret: string;
    /**
     * Define the absolute URL of your app including the protocol, for example `https://example.org`.
     * No paths allowed, only protocol, domain and (optionally) port.
     *
     * @see https://payloadcms.com/docs/configuration/overview#options
     */
    serverURL?: string;
    /**
     * Pass in a local copy of Sharp if you'd like to use it.
     *
     */
    sharp?: SharpDependency;
    /** Send anonymous telemetry data about general usage. */
    telemetry?: boolean;
    /** Control how typescript interfaces are generated from your collections. */
    typescript?: {
        /**
         * Automatically generate types during development
         * @default true
         */
        autoGenerate?: boolean;
        /** Disable declare block in generated types file */
        declare?: {
            /**
             * @internal internal use only to allow for multiple declarations within a monorepo and suppress the "Duplicate identifier GeneratedTypes" error
             *
             * Adds a @ts-ignore flag above the GeneratedTypes interface declaration
             *
             * @default false
             */
            ignoreTSError?: boolean;
        } | false;
        /** Filename to write the generated types to */
        outputFile?: string;
        /**
         * Allows you to modify the base JSON schema that is generated during generate:types. This JSON schema will be used
         * to generate the TypeScript interfaces.
         */
        schema?: Array<(args: {
            collectionIDFieldTypes: {
                [key: string]: 'number' | 'string';
            };
            config: SanitizedConfig;
            i18n: I18n;
            jsonSchema: JSONSchema4;
        }) => JSONSchema4>;
        /**
         * Enable strict type safety for draft mode queries.
         * When enabled, find operations with draft: true will type required fields as optional.
         * @default false
         * @todo Remove in v4. Strict draft types will become the default behavior.
         */
        strictDraftTypes?: boolean;
    };
    /**
     * Customize the handling of incoming file uploads for collections that have uploads enabled.
     */
    upload?: FetchAPIFileUploadOptions;
};
/**
 * @todo remove the `DeepRequired` in v4.
 * We don't actually guarantee that all properties are set when sanitizing configs.
 */
type SanitizedConfig = {
    admin: {
        timezones: SanitizedTimezoneConfig;
    } & DeepRequired<Config['admin']>;
    blocks?: FlattenedBlock[];
    collections: SanitizedCollectionConfig[];
    /** Default richtext editor to use for richText fields */
    editor?: RichTextAdapter<any, any, any>;
    endpoints: Endpoint[];
    globals: SanitizedGlobalConfig[];
    i18n: Required<I18nOptions>;
    jobs: SanitizedJobsConfig;
    localization: false | SanitizedLocalizationConfig;
    paths: {
        config: string;
        configDir: string;
        rawConfig: string;
    };
    upload: {
        /**
         * Deduped list of adapters used in the project
         */
        adapters: string[];
    } & FetchAPIFileUploadOptions;
} & Omit<DeepRequired<Config>, 'admin' | 'blocks' | 'collections' | 'editor' | 'endpoint' | 'globals' | 'i18n' | 'jobs' | 'localization' | 'upload'>;
type EditConfig = EditConfigWithoutRoot | EditConfigWithRoot;
/**
 * Replace or modify _all_ nested document views and routes, including the document header, controls, and tabs. This cannot be used in conjunction with other nested views.
 * + `root` - `/admin/collections/:collection/:id/**\/*`
 * @link https://payloadcms.com/docs/custom-components/document-views#document-root
 */
type EditConfigWithRoot = {
    api?: never;
    default?: never;
    livePreview?: never;
    root: DefaultDocumentViewConfig;
    version?: never;
    versions?: never;
};
type KnownEditKeys = 'api' | 'default' | 'livePreview' | 'root' | 'version' | 'versions';
/**
 * Replace or modify individual nested routes, or add new ones:
 * + `default` - `/admin/collections/:collection/:id`
 * + `api` - `/admin/collections/:collection/:id/api`
 * + `livePreview` - `/admin/collections/:collection/:id/preview`
 * + `references` - `/admin/collections/:collection/:id/references`
 * + `relationships` - `/admin/collections/:collection/:id/relationships`
 * + `versions` - `/admin/collections/:collection/:id/versions`
 * + `version` - `/admin/collections/:collection/:id/versions/:version`
 * + `customView` - `/admin/collections/:collection/:id/:path`
 *
 * To override the entire Edit View including all nested views, use the `root` key.
 *
 * @link https://payloadcms.com/docs/custom-components/document-views
 */
type EditConfigWithoutRoot = {
    [K in Exclude<string, KnownEditKeys>]: CustomDocumentViewConfig;
} & {
    api?: DefaultDocumentViewConfig;
    default?: DefaultDocumentViewConfig;
    livePreview?: DefaultDocumentViewConfig;
    root?: never;
    version?: DefaultDocumentViewConfig;
    versions?: DefaultDocumentViewConfig;
};
type EntityDescriptionComponent = CustomComponent;
type EntityDescriptionFunction = ({ t }: {
    t: TFunction;
}) => string;
type EntityDescription = EntityDescriptionFunction | Record<string, string> | string;

type ImportIdentifier = string;
type ImportSpecifier = string;
type ImportPath = string;
/**
 * Import Map before being written to the file. Only contains all paths
 */
type InternalImportMap = {
    [path: UserImportPath]: ImportIdentifier;
};
/**
 * Imports of the import map.
 */
type Imports = {
    [identifier: ImportIdentifier]: {
        path: ImportPath;
        specifier: ImportSpecifier;
    };
};
/**
 * Import Map after being imported from the actual import map. Contains all the actual imported components
 */
type ImportMap = {
    [path: UserImportPath]: any;
};
type AddToImportMap = (payloadComponent?: PayloadComponent | PayloadComponent[]) => void;
declare function generateImportMap(config: SanitizedConfig, options?: {
    force?: boolean; /**
     * If true, will not throw an error if the import map file path cannot be resolved
    Instead, it will return silently.
     */
    ignoreResolveError?: boolean;
    log: boolean;
}): Promise<void>;

type ClientTab = ({
    fields: ClientField[];
    passesCondition?: boolean;
    readonly path?: string;
} & Omit<NamedTab, 'fields'>) | ({
    fields: ClientField[];
    passesCondition?: boolean;
} & Omit<UnnamedTab, 'fields'>);
type TabsFieldBaseClientProps = FieldPaths;
type TabsFieldClientWithoutType = MarkOptional<TabsFieldClient, 'type'>;
type TabsFieldClientProps = ClientFieldBase<TabsFieldClientWithoutType> & TabsFieldBaseClientProps;
type TabsFieldServerProps = ServerFieldBase<TabsField, TabsFieldClientWithoutType>;
type TabsFieldServerComponent = FieldServerComponent<TabsField, TabsFieldClientWithoutType>;
type TabsFieldClientComponent = FieldClientComponent<TabsFieldClientWithoutType, TabsFieldBaseClientProps>;
type TabsFieldLabelServerComponent = FieldLabelServerComponent<TabsField, TabsFieldClientWithoutType>;
type TabsFieldLabelClientComponent = FieldLabelClientComponent<TabsFieldClientWithoutType>;
type TabsFieldDescriptionServerComponent = FieldDescriptionServerComponent<TabsField, TabsFieldClientWithoutType>;
type TabsFieldDescriptionClientComponent = FieldDescriptionClientComponent<TabsFieldClientWithoutType>;
type TabsFieldErrorServerComponent = FieldErrorServerComponent<TabsField, TabsFieldClientWithoutType>;
type TabsFieldErrorClientComponent = FieldErrorClientComponent<TabsFieldClientWithoutType>;
type TabsFieldDiffServerComponent = FieldDiffServerComponent<TabsField, TabsFieldClient>;
type TabsFieldDiffClientComponent = FieldDiffClientComponent<TabsFieldClient>;

type Data = {
    [key: string]: any;
};
type Row = {
    addedByServer?: FieldState['addedByServer'];
    blockType?: string;
    collapsed?: boolean;
    customComponents?: {
        RowLabel?: React.ReactNode;
    };
    id: string;
    isLoading?: boolean;
    lastRenderedPath?: string;
};
type FilterOptionsResult = {
    [relation: string]: boolean | Where;
};
type FieldState = {
    /**
     * This is used to determine if the field was added by the server.
     * This ensures the field is not ignored by the client when merging form state.
     * This can happen because the current local state is treated as the source of truth.
     * See `mergeServerFormState` for more details.
     */
    addedByServer?: boolean;
    /**
     * If the field is a `blocks` field, this will contain the slugs of blocks that are allowed, based on the result of `field.filterOptions`.
     * If this is undefined, all blocks are allowed.
     * If this is an empty array, no blocks are allowed.
     */
    blocksFilterOptions?: string[];
    customComponents?: {
        /**
         * This is used by UI fields, as they can have arbitrary components defined if used
         * as a vessel to bring in custom components.
         */
        [key: string]: React.ReactNode | React.ReactNode[] | undefined;
        AfterInput?: React.ReactNode;
        BeforeInput?: React.ReactNode;
        Description?: React.ReactNode;
        Error?: React.ReactNode;
        Field?: React.ReactNode;
        Label?: React.ReactNode;
    };
    disableFormData?: boolean;
    errorMessage?: string;
    errorPaths?: string[];
    /**
     * The fieldSchema may be part of the form state if `includeSchema: true` is passed to buildFormState.
     * This will never be in the form state of the client.
     */
    fieldSchema?: Field | TabAsField;
    filterOptions?: FilterOptionsResult;
    initialValue?: unknown;
    /**
     * Every time a field is changed locally, this flag is set to true. Prevents form state from server from overwriting local changes.
     * After merging server form state, this flag is reset.
     *
     * @experimental This property is experimental and may change in the future. Use at your own risk.
     */
    isModified?: boolean;
    /**
     * The path of the field when its custom components were last rendered.
     * This is used to denote if a field has been rendered, and if so,
     * what path it was rendered under last.
     *
     * If this path is undefined, or, if it is different
     * from the current path of a given field, the field's components will be re-rendered.
     */
    lastRenderedPath?: string;
    passesCondition?: boolean;
    rows?: Row[];
    /**
     * The result of running `field.filterOptions` on select fields.
     */
    selectFilterOptions?: Option[];
    valid?: boolean;
    validate?: Validate;
    value?: unknown;
};
type FieldStateWithoutComponents = Omit<FieldState, 'customComponents'>;
type FormState = {
    [path: string]: FieldState;
};
type FormStateWithoutComponents = {
    [path: string]: FieldStateWithoutComponents;
};
type BuildFormStateArgs = {
    data?: Data;
    docPermissions: SanitizedDocumentPermissions | undefined;
    docPreferences: DocumentPreferences;
    /**
     * In case `formState` is not the top-level, document form state, this can be passed to
     * provide the top-level form state.
     */
    documentFormState?: FormState;
    fallbackLocale?: false | TypedLocale;
    formState?: FormState;
    id?: number | string;
    initialBlockData?: Data;
    initialBlockFormState?: FormState;
    language?: keyof SupportedLanguages;
    locale?: string;
    /**
     * If true, will not render RSCs and instead return a simple string in their place.
     * This is useful for environments that lack RSC support, such as Jest.
     * Form state can still be built, but any server components will be omitted.
     * @default false
     */
    mockRSCs?: boolean;
    operation?: 'create' | 'update';
    readOnly?: boolean;
    /**
     * If true, will render field components within their state object.
     * Performance optimization: Setting to `false` ensures that only fields that have changed paths will re-render, e.g. new array rows, etc.
     * For example, you only need to render ALL fields on initial render, not on every onChange.
     */
    renderAllFields?: boolean;
    req: PayloadRequest;
    /**
     * If true, will return a fresh URL for live preview based on the current form state.
     * Note: this will run on every form state event, so if your `livePreview.url` function is long running or expensive,
     * ensure it caches itself as needed.
     */
    returnLivePreviewURL?: boolean;
    returnLockStatus?: boolean;
    /**
     * If true, will return a fresh URL for preview based on the current form state.
     * Note: this will run on every form state event, so if your `preview` function is long running or expensive,
     * ensure it caches itself as needed.
     */
    returnPreviewURL?: boolean;
    schemaPath: string;
    select?: SelectType;
    /**
     * When true, sets `user: true` when calling `getClientConfig`.
     * This will retrieve the client config in its entirety, even when unauthenticated.
     * For example, the create-first-user view needs the entire config, but there is no user yet.
     *
     * @experimental This property is experimental and may change in the future. Use at your own risk.
     */
    skipClientConfigAuth?: boolean;
    skipValidation?: boolean;
    updateLastEdited?: boolean;
} & ({
    collectionSlug: string;
    globalSlug?: string;
} | {
    collectionSlug?: string;
    globalSlug: string;
});

type RowData = Record<string, any>;
type DefaultCellComponentProps<TField extends ClientField = ClientField, TCellData = undefined> = {
    readonly cellData: TCellData extends undefined ? TField extends RelationshipFieldClient ? number | Record<string, any> | string : TField extends NumberFieldClient ? TField['hasMany'] extends true ? number[] : number : TField extends TextFieldClient ? TField['hasMany'] extends true ? string[] : string : TField extends CodeFieldClient | EmailFieldClient | JSONFieldClient | RadioFieldClient | TextareaFieldClient ? string : TField extends BlocksFieldClient ? {
        [key: string]: any;
        blockType: string;
    }[] : TField extends CheckboxFieldClient ? boolean : TField extends DateFieldClient ? Date | number | string : TField extends GroupFieldClient ? Record<string, any> : TField extends UploadFieldClient ? File | string : TField extends ArrayFieldClient ? Record<string, unknown>[] : TField extends SelectFieldClient ? TField['hasMany'] extends true ? string[] : string : TField extends PointFieldClient ? {
        x: number;
        y: number;
    } : any : TCellData;
    className?: string;
    collectionSlug: SanitizedCollectionConfig['slug'];
    columnIndex?: number;
    customCellProps?: Record<string, any>;
    field: TField;
    link?: boolean;
    linkURL?: string;
    onClick?: (args: {
        cellData: unknown;
        collectionSlug: SanitizedCollectionConfig['slug'];
        rowData: RowData;
    }) => void;
    rowData: RowData;
    viewType?: ViewTypes;
};
type DefaultServerCellComponentProps<TField extends ClientField = ClientField, TCellData = any> = {
    collectionConfig: SanitizedCollectionConfig;
    field: Field;
    i18n: I18nClient;
    payload: Payload;
} & Omit<DefaultCellComponentProps<TField, TCellData>, 'field'>;

type SharedProps = {
    displayFormat?: string;
    overrides?: DatePickerProps;
    pickerAppearance?: 'dayAndTime' | 'dayOnly' | 'default' | 'monthOnly' | 'timeOnly';
};
type TimePickerProps = {
    maxTime?: Date;
    minTime?: Date;
    timeFormat?: string;
    timeIntervals?: number;
};
type DayPickerProps = {
    maxDate?: Date;
    minDate?: Date;
    monthsToShow?: 1 | 2;
};
type MonthPickerProps = {
    maxDate?: Date;
    minDate?: Date;
};
type ConditionalDateProps = ({
    pickerAppearance: 'dayOnly';
} & DayPickerProps & SharedProps) | ({
    pickerAppearance: 'monthOnly';
} & MonthPickerProps & SharedProps) | ({
    pickerAppearance: 'timeOnly';
} & SharedProps & TimePickerProps) | ({
    pickerAppearance?: 'dayAndTime';
} & DayPickerProps & SharedProps & TimePickerProps) | ({
    pickerAppearance?: 'default';
} & SharedProps);

type EditMenuItemsClientProps = {};
type EditMenuItemsServerPropsOnly = {} & ServerProps;
type EditMenuItemsServerProps = EditMenuItemsClientProps & EditMenuItemsServerPropsOnly;

type NavPreferences = {
    groups: NavGroupPreferences;
    open: boolean;
};
type NavGroupPreferences = {
    [key: string]: {
        open: boolean;
    };
};

type PreviewButtonClientProps = {};
type PreviewButtonServerPropsOnly = {} & ServerProps;
type PreviewButtonServerProps = PreviewButtonClientProps & PreviewButtonServerPropsOnly;

type PublishButtonClientProps = {
    label?: string;
};
type PublishButtonServerPropsOnly = {} & ServerProps;
type PublishButtonServerProps = PublishButtonClientProps & PublishButtonServerPropsOnly;

type SaveButtonClientProps = {
    label?: string;
};
type SaveButtonServerPropsOnly = {} & ServerProps;
type SaveButtonServerProps = SaveButtonClientProps & SaveButtonServerPropsOnly;

type SaveDraftButtonClientProps = {};
type SaveDraftButtonServerPropsOnly = {} & ServerProps;
type SaveDraftButtonServerProps = SaveDraftButtonClientProps & SaveDraftButtonServerPropsOnly;

type CustomStatus = CustomComponent;

type Column = {
    readonly accessor: string;
    readonly active: boolean;
    readonly CustomLabel?: React.ReactNode;
    readonly field: ClientField;
    readonly Heading: React.ReactNode;
    readonly renderedCells: React.ReactNode[];
};

type CustomUpload = CustomComponent;

type WithServerSidePropsComponentProps = {
    [key: string]: any;
    Component: React$1.ComponentType<any>;
    serverOnlyProps: ServerProps;
};
type WithServerSidePropsComponent = React$1.FC<WithServerSidePropsComponentProps>;

type ArrayFieldClientWithoutType = MarkOptional<ArrayFieldClient, 'type'>;
type ArrayFieldBaseClientProps = {
    readonly validate?: ArrayFieldValidation;
} & FieldPaths;
type ArrayFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type ArrayFieldClientProps = ArrayFieldBaseClientProps & ClientFieldBase<ArrayFieldClientWithoutType>;
type ArrayFieldServerProps = ArrayFieldBaseServerProps & ServerFieldBase<ArrayField, ArrayFieldClientWithoutType>;
type ArrayFieldServerComponent = FieldServerComponent<ArrayField, ArrayFieldClientWithoutType, ArrayFieldBaseServerProps>;
type ArrayFieldClientComponent = FieldClientComponent<ArrayFieldClientWithoutType, ArrayFieldBaseClientProps>;
type ArrayFieldLabelServerComponent = FieldLabelServerComponent<ArrayField, ArrayFieldClientWithoutType>;
type ArrayFieldLabelClientComponent = FieldLabelClientComponent<ArrayFieldClientWithoutType>;
type ArrayFieldDescriptionServerComponent = FieldDescriptionServerComponent<ArrayField, ArrayFieldClientWithoutType>;
type ArrayFieldDescriptionClientComponent = FieldDescriptionClientComponent<ArrayFieldClientWithoutType>;
type ArrayFieldErrorServerComponent = FieldErrorServerComponent<ArrayField, ArrayFieldClientWithoutType>;
type ArrayFieldErrorClientComponent = FieldErrorClientComponent<ArrayFieldClientWithoutType>;
type ArrayFieldDiffServerComponent = FieldDiffServerComponent<ArrayField, ArrayFieldClient>;
type ArrayFieldDiffClientComponent = FieldDiffClientComponent<ArrayFieldClient>;

type BlocksFieldClientWithoutType = MarkOptional<BlocksFieldClient, 'type'>;
type BlocksFieldBaseClientProps = {
    readonly validate?: BlocksFieldValidation;
} & FieldPaths;
type BlocksFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type BlocksFieldClientProps = BlocksFieldBaseClientProps & ClientFieldBase<BlocksFieldClientWithoutType>;
type BlocksFieldServerProps = BlocksFieldBaseServerProps & ServerFieldBase<BlocksField, BlocksFieldClientWithoutType>;
type BlocksFieldServerComponent = FieldServerComponent<BlocksField, BlocksFieldClientWithoutType, BlocksFieldBaseServerProps>;
type BlocksFieldClientComponent = FieldClientComponent<BlocksFieldClientWithoutType, BlocksFieldBaseClientProps>;
type BlocksFieldLabelServerComponent = FieldLabelServerComponent<BlocksField, BlocksFieldClientWithoutType>;
type BlocksFieldLabelClientComponent = FieldLabelClientComponent<BlocksFieldClientWithoutType>;
type BlockRowLabelBase = {
    blockType: string;
    rowLabel: string;
    rowNumber: number;
};
type BlockRowLabelClientComponent = React$1.ComponentType<BlockRowLabelBase & ClientFieldBase<BlocksFieldClientWithoutType>>;
type BlockRowLabelServerComponent = React$1.ComponentType<BlockRowLabelBase & ServerFieldBase<BlocksField, BlocksFieldClientWithoutType>>;
type BlocksFieldDescriptionServerComponent = FieldDescriptionServerComponent<BlocksField, BlocksFieldClientWithoutType>;
type BlocksFieldDescriptionClientComponent = FieldDescriptionClientComponent<BlocksFieldClientWithoutType>;
type BlocksFieldErrorServerComponent = FieldErrorServerComponent<BlocksField, BlocksFieldClientWithoutType>;
type BlocksFieldErrorClientComponent = FieldErrorClientComponent<BlocksFieldClientWithoutType>;
type BlocksFieldDiffServerComponent = FieldDiffServerComponent<BlocksField, BlocksFieldClient>;
type BlocksFieldDiffClientComponent = FieldDiffClientComponent<BlocksFieldClient>;

type CheckboxFieldClientWithoutType = MarkOptional<CheckboxFieldClient, 'type'>;
type CheckboxFieldBaseClientProps = {
    readonly checked?: boolean;
    readonly disableFormData?: boolean;
    readonly id?: string;
    readonly onChange?: (value: boolean) => void;
    readonly partialChecked?: boolean;
    readonly path: string;
    readonly validate?: CheckboxFieldValidation;
};
type CheckboxFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type CheckboxFieldClientProps = CheckboxFieldBaseClientProps & ClientFieldBase<CheckboxFieldClientWithoutType>;
type CheckboxFieldServerProps = CheckboxFieldBaseServerProps & ServerFieldBase<CheckboxField, CheckboxFieldClientWithoutType>;
type CheckboxFieldServerComponent = FieldServerComponent<CheckboxField, CheckboxFieldClientWithoutType, CheckboxFieldBaseServerProps>;
type CheckboxFieldClientComponent = FieldClientComponent<CheckboxFieldClientWithoutType, CheckboxFieldBaseClientProps>;
type CheckboxFieldLabelServerComponent = FieldLabelServerComponent<CheckboxField, CheckboxFieldClientWithoutType>;
type CheckboxFieldLabelClientComponent = FieldLabelClientComponent<CheckboxFieldClientWithoutType>;
type CheckboxFieldDescriptionServerComponent = FieldDescriptionServerComponent<CheckboxField, CheckboxFieldClientWithoutType>;
type CheckboxFieldDescriptionClientComponent = FieldDescriptionClientComponent<CheckboxFieldClientWithoutType>;
type CheckboxFieldErrorServerComponent = FieldErrorServerComponent<CheckboxField, CheckboxFieldClientWithoutType>;
type CheckboxFieldErrorClientComponent = FieldErrorClientComponent<CheckboxFieldClientWithoutType>;
type CheckboxFieldDiffServerComponent = FieldDiffServerComponent<CheckboxField, CheckboxFieldClient>;
type CheckboxFieldDiffClientComponent = FieldDiffClientComponent<CheckboxFieldClient>;

type CodeFieldClientWithoutType = MarkOptional<CodeFieldClient, 'type'>;
type CodeFieldBaseClientProps = {
    readonly autoComplete?: string;
    readonly onMount?: EditorProps['onMount'];
    readonly path: string;
    readonly validate?: CodeFieldValidation;
};
type CodeFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type CodeFieldClientProps = ClientFieldBase<CodeFieldClientWithoutType> & CodeFieldBaseClientProps;
type CodeFieldServerProps = CodeFieldBaseServerProps & ServerFieldBase<CodeField, CodeFieldClientWithoutType>;
type CodeFieldServerComponent = FieldServerComponent<CodeField, CodeFieldClientWithoutType, CodeFieldBaseServerProps>;
type CodeFieldClientComponent = FieldClientComponent<CodeFieldClientWithoutType, CodeFieldBaseClientProps>;
type CodeFieldLabelServerComponent = FieldLabelServerComponent<CodeField, CodeFieldClientWithoutType>;
type CodeFieldLabelClientComponent = FieldLabelClientComponent<CodeFieldClientWithoutType>;
type CodeFieldDescriptionServerComponent = FieldDescriptionServerComponent<CodeField, CodeFieldClientWithoutType>;
type CodeFieldDescriptionClientComponent = FieldDescriptionClientComponent<CodeFieldClientWithoutType>;
type CodeFieldErrorServerComponent = FieldErrorServerComponent<CodeField, CodeFieldClientWithoutType>;
type CodeFieldErrorClientComponent = FieldErrorClientComponent<CodeFieldClientWithoutType>;
type CodeFieldDiffServerComponent = FieldDiffServerComponent<CodeField, CodeFieldClient>;
type CodeFieldDiffClientComponent = FieldDiffClientComponent<CodeFieldClient>;

type CollapsibleFieldBaseClientProps = FieldPaths;
type CollapsibleFieldClientWithoutType = MarkOptional<CollapsibleFieldClient, 'type'>;
type CollapsibleFieldClientProps = ClientFieldBase<CollapsibleFieldClientWithoutType> & CollapsibleFieldBaseClientProps;
type CollapsibleFieldServerProps = ServerFieldBase<CollapsibleField, CollapsibleFieldClientWithoutType>;
type CollapsibleFieldServerComponent = FieldServerComponent<CollapsibleField, CollapsibleFieldClientWithoutType>;
type CollapsibleFieldClientComponent = FieldClientComponent<CollapsibleFieldClientWithoutType, CollapsibleFieldBaseClientProps>;
type CollapsibleFieldLabelServerComponent = FieldLabelServerComponent<CollapsibleField, CollapsibleFieldClientWithoutType>;
type CollapsibleFieldLabelClientComponent = FieldLabelClientComponent<CollapsibleFieldClientWithoutType>;
type CollapsibleFieldDescriptionServerComponent = FieldDescriptionServerComponent<CollapsibleField, CollapsibleFieldClientWithoutType>;
type CollapsibleFieldDescriptionClientComponent = FieldDescriptionClientComponent<CollapsibleFieldClientWithoutType>;
type CollapsibleFieldErrorServerComponent = FieldErrorServerComponent<CollapsibleField, CollapsibleFieldClientWithoutType>;
type CollapsibleFieldErrorClientComponent = FieldErrorClientComponent<CollapsibleFieldClientWithoutType>;
type CollapsibleFieldDiffServerComponent = FieldDiffServerComponent<CollapsibleField, CollapsibleFieldClient>;
type CollapsibleFieldDiffClientComponent = FieldDiffClientComponent<CollapsibleFieldClient>;

type DateFieldClientWithoutType = MarkOptional<DateFieldClient, 'type'>;
type DateFieldBaseClientProps = {
    readonly path: string;
    readonly validate?: DateFieldValidation;
};
type DateFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type DateFieldClientProps = ClientFieldBase<DateFieldClientWithoutType> & DateFieldBaseClientProps;
type DateFieldServerProps = DateFieldBaseServerProps & ServerFieldBase<DateField, DateFieldClientWithoutType>;
type DateFieldServerComponent = FieldServerComponent<DateField, DateFieldClientWithoutType, DateFieldBaseServerProps>;
type DateFieldClientComponent = FieldClientComponent<DateFieldClientWithoutType, DateFieldBaseClientProps>;
type DateFieldLabelServerComponent = FieldLabelServerComponent<DateField, DateFieldClientWithoutType>;
type DateFieldLabelClientComponent = FieldLabelClientComponent<DateFieldClientWithoutType>;
type DateFieldDescriptionServerComponent = FieldDescriptionServerComponent<DateField, DateFieldClientWithoutType>;
type DateFieldDescriptionClientComponent = FieldDescriptionClientComponent<DateFieldClientWithoutType>;
type DateFieldErrorServerComponent = FieldErrorServerComponent<DateField, DateFieldClientWithoutType>;
type DateFieldErrorClientComponent = FieldErrorClientComponent<DateFieldClientWithoutType>;
type DateFieldDiffServerComponent = FieldDiffServerComponent<DateField, DateFieldClient>;
type DateFieldDiffClientComponent = FieldDiffClientComponent<DateFieldClient>;

type EmailFieldClientWithoutType = MarkOptional<EmailFieldClient, 'type'>;
type EmailFieldBaseClientProps = {
    readonly path: string;
    readonly validate?: EmailFieldValidation;
};
type EmailFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type EmailFieldClientProps = ClientFieldBase<EmailFieldClientWithoutType> & EmailFieldBaseClientProps;
type EmailFieldServerProps = EmailFieldBaseServerProps & ServerFieldBase<EmailField, EmailFieldClientWithoutType>;
type EmailFieldServerComponent = FieldServerComponent<EmailField, EmailFieldClientWithoutType, EmailFieldBaseServerProps>;
type EmailFieldClientComponent = FieldClientComponent<EmailFieldClientWithoutType, EmailFieldBaseClientProps>;
type EmailFieldLabelServerComponent = FieldLabelServerComponent<EmailField, EmailFieldClientWithoutType>;
type EmailFieldLabelClientComponent = FieldLabelClientComponent<EmailFieldClientWithoutType>;
type EmailFieldDescriptionServerComponent = FieldDescriptionServerComponent<EmailField, EmailFieldClientWithoutType>;
type EmailFieldDescriptionClientComponent = FieldDescriptionClientComponent<EmailFieldClientWithoutType>;
type EmailFieldErrorServerComponent = FieldErrorServerComponent<EmailField, EmailFieldClientWithoutType>;
type EmailFieldErrorClientComponent = FieldErrorClientComponent<EmailFieldClientWithoutType>;
type EmailFieldDiffServerComponent = FieldDiffServerComponent<EmailField, EmailFieldClient>;
type EmailFieldDiffClientComponent = FieldDiffClientComponent<EmailFieldClient>;

type GroupFieldClientWithoutType = MarkOptional<GroupFieldClient, 'type'>;
type GroupFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type GroupFieldBaseClientProps = FieldPaths;
type GroupFieldClientProps = ClientFieldBase<GroupFieldClientWithoutType> & GroupFieldBaseClientProps;
type GroupFieldServerProps = GroupFieldBaseServerProps & ServerFieldBase<GroupField, GroupFieldClientWithoutType>;
type GroupFieldServerComponent = FieldServerComponent<GroupField, GroupFieldClientWithoutType, GroupFieldBaseServerProps>;
type GroupFieldClientComponent = FieldClientComponent<GroupFieldClientWithoutType, GroupFieldBaseClientProps>;
type GroupFieldLabelServerComponent = FieldLabelServerComponent<GroupField, GroupFieldClientWithoutType>;
type GroupFieldLabelClientComponent = FieldLabelClientComponent<GroupFieldClientWithoutType>;
type GroupFieldDescriptionServerComponent = FieldDescriptionServerComponent<GroupField, GroupFieldClientWithoutType>;
type GroupFieldDescriptionClientComponent = FieldDescriptionClientComponent<GroupFieldClientWithoutType>;
type GroupFieldErrorServerComponent = FieldErrorServerComponent<GroupField, GroupFieldClientWithoutType>;
type GroupFieldErrorClientComponent = FieldErrorClientComponent<GroupFieldClientWithoutType>;
type GroupFieldDiffServerComponent = FieldDiffServerComponent<GroupField, GroupFieldClient>;
type GroupFieldDiffClientComponent = FieldDiffClientComponent<GroupFieldClient>;

type HiddenFieldBaseClientProps = {
    readonly disableModifyingForm?: false;
    readonly field?: never;
    readonly path: string;
    readonly value?: unknown;
};
type HiddenFieldProps = HiddenFieldBaseClientProps & Pick<ClientFieldBase, 'forceRender' | 'schemaPath'>;

type JSONFieldClientWithoutType = MarkOptional<JSONFieldClient, 'type'>;
type JSONFieldBaseClientProps = {
    readonly path: string;
    readonly validate?: JSONFieldValidation;
};
type JSONFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type JSONFieldClientProps = ClientFieldBase<JSONFieldClientWithoutType> & JSONFieldBaseClientProps;
type JSONFieldServerProps = JSONFieldBaseServerProps & ServerFieldBase<JSONField, JSONFieldClientWithoutType>;
type JSONFieldServerComponent = FieldServerComponent<JSONField, JSONFieldClientWithoutType, JSONFieldBaseServerProps>;
type JSONFieldClientComponent = FieldClientComponent<JSONFieldClientWithoutType, JSONFieldBaseClientProps>;
type JSONFieldLabelServerComponent = FieldLabelServerComponent<JSONField, JSONFieldClientWithoutType>;
type JSONFieldLabelClientComponent = FieldLabelClientComponent<JSONFieldClientWithoutType>;
type JSONFieldDescriptionServerComponent = FieldDescriptionServerComponent<JSONField, JSONFieldClientWithoutType>;
type JSONFieldDescriptionClientComponent = FieldDescriptionClientComponent<JSONFieldClientWithoutType>;
type JSONFieldErrorServerComponent = FieldErrorServerComponent<JSONField, JSONFieldClientWithoutType>;
type JSONFieldErrorClientComponent = FieldErrorClientComponent<JSONFieldClientWithoutType>;
type JSONFieldDiffServerComponent = FieldDiffServerComponent<JSONField, JSONFieldClient>;
type JSONFieldDiffClientComponent = FieldDiffClientComponent<JSONFieldClient>;

type NumberFieldClientWithoutType = MarkOptional<NumberFieldClient, 'type'>;
type NumberFieldBaseClientProps = {
    readonly onChange?: (e: number) => void;
    readonly path: string;
    readonly validate?: NumberFieldValidation;
};
type NumberFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type NumberFieldClientProps = ClientFieldBase<NumberFieldClientWithoutType> & NumberFieldBaseClientProps;
type NumberFieldServerProps = NumberFieldBaseServerProps & ServerFieldBase<NumberField, NumberFieldClientWithoutType>;
type NumberFieldServerComponent = FieldServerComponent<NumberField, NumberFieldClientWithoutType, NumberFieldBaseServerProps>;
type NumberFieldClientComponent = FieldClientComponent<NumberFieldClientWithoutType, NumberFieldBaseClientProps>;
type NumberFieldLabelServerComponent = FieldLabelServerComponent<NumberField, NumberFieldClientWithoutType>;
type NumberFieldLabelClientComponent = FieldLabelClientComponent<NumberFieldClientWithoutType>;
type NumberFieldDescriptionServerComponent = FieldDescriptionServerComponent<NumberField, NumberFieldClientWithoutType>;
type NumberFieldDescriptionClientComponent = FieldDescriptionClientComponent<NumberFieldClientWithoutType>;
type NumberFieldErrorServerComponent = FieldErrorServerComponent<NumberField, NumberFieldClientWithoutType>;
type NumberFieldErrorClientComponent = FieldErrorClientComponent<NumberFieldClientWithoutType>;
type NumberFieldDiffServerComponent = FieldDiffServerComponent<NumberField, NumberFieldClient>;
type NumberFieldDiffClientComponent = FieldDiffClientComponent<NumberFieldClient>;

type PointFieldClientWithoutType = MarkOptional<PointFieldClient, 'type'>;
type PointFieldBaseClientProps = {
    readonly path: string;
    readonly validate?: PointFieldValidation;
};
type PointFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type PointFieldClientProps = ClientFieldBase<PointFieldClientWithoutType> & PointFieldBaseClientProps;
type PointFieldServerProps = PointFieldBaseServerProps & ServerFieldBase<PointField, PointFieldClientWithoutType>;
type PointFieldServerComponent = FieldServerComponent<PointField, PointFieldClientWithoutType, PointFieldBaseServerProps>;
type PointFieldClientComponent = FieldClientComponent<PointFieldClientWithoutType, PointFieldBaseClientProps>;
type PointFieldLabelServerComponent = FieldLabelServerComponent<PointField, PointFieldClientWithoutType>;
type PointFieldLabelClientComponent = FieldLabelClientComponent<PointFieldClientWithoutType>;
type PointFieldDescriptionServerComponent = FieldDescriptionServerComponent<PointField, PointFieldClientWithoutType>;
type PointFieldDescriptionClientComponent = FieldDescriptionClientComponent<PointFieldClientWithoutType>;
type PointFieldErrorServerComponent = FieldErrorServerComponent<PointField, PointFieldClientWithoutType>;
type PointFieldErrorClientComponent = FieldErrorClientComponent<PointFieldClientWithoutType>;
type PointFieldDiffServerComponent = FieldDiffServerComponent<PointField, PointFieldClient>;
type PointFieldDiffClientComponent = FieldDiffClientComponent<PointFieldClient>;

type RadioFieldClientWithoutType = MarkOptional<RadioFieldClient, 'type'>;
type RadioFieldBaseClientProps = {
    /**
     * Threaded through to the setValue function from the form context when the value changes
     */
    readonly disableModifyingForm?: boolean;
    readonly onChange?: OnChange;
    readonly path: string;
    readonly validate?: RadioFieldValidation;
    readonly value?: string;
};
type RadioFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type RadioFieldClientProps = ClientFieldBase<RadioFieldClientWithoutType> & RadioFieldBaseClientProps;
type RadioFieldServerProps = RadioFieldBaseServerProps & ServerFieldBase<RadioField, RadioFieldClientWithoutType>;
type RadioFieldServerComponent = FieldServerComponent<RadioField, RadioFieldClientWithoutType, RadioFieldBaseServerProps>;
type RadioFieldClientComponent = FieldClientComponent<RadioFieldClientWithoutType, RadioFieldBaseClientProps>;
type OnChange<T = string> = (value: T) => void;
type RadioFieldLabelServerComponent = FieldLabelServerComponent<RadioField, RadioFieldClientWithoutType>;
type RadioFieldLabelClientComponent = FieldLabelClientComponent<RadioFieldClientWithoutType>;
type RadioFieldDescriptionServerComponent = FieldDescriptionServerComponent<RadioField, RadioFieldClientWithoutType>;
type RadioFieldDescriptionClientComponent = FieldDescriptionClientComponent<RadioFieldClientWithoutType>;
type RadioFieldErrorServerComponent = FieldErrorServerComponent<RadioField, RadioFieldClientWithoutType>;
type RadioFieldErrorClientComponent = FieldErrorClientComponent<RadioFieldClientWithoutType>;
type RadioFieldDiffServerComponent = FieldDiffServerComponent<RadioField, RadioFieldClient>;
type RadioFieldDiffClientComponent = FieldDiffClientComponent<RadioFieldClient>;

type RelationshipFieldClientWithoutType = MarkOptional<RelationshipFieldClient, 'type'>;
type RelationshipFieldBaseClientProps = {
    readonly path: string;
    readonly validate?: RelationshipFieldValidation;
};
type RelationshipFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type RelationshipFieldClientProps = ClientFieldBase<RelationshipFieldClientWithoutType> & RelationshipFieldBaseClientProps;
type RelationshipFieldServerProps = RelationshipFieldBaseServerProps & ServerFieldBase<RelationshipField, RelationshipFieldClientWithoutType>;
type RelationshipFieldServerComponent = FieldServerComponent<RelationshipField, RelationshipFieldClientWithoutType, RelationshipFieldBaseServerProps>;
type RelationshipFieldClientComponent = FieldClientComponent<RelationshipFieldClientWithoutType, RelationshipFieldBaseClientProps>;
type RelationshipFieldLabelServerComponent = FieldLabelServerComponent<RelationshipField, RelationshipFieldClientWithoutType>;
type RelationshipFieldLabelClientComponent = FieldLabelClientComponent<RelationshipFieldClientWithoutType>;
type RelationshipFieldDescriptionServerComponent = FieldDescriptionServerComponent<RelationshipField, RelationshipFieldClientWithoutType>;
type RelationshipFieldDescriptionClientComponent = FieldDescriptionClientComponent<RelationshipFieldClientWithoutType>;
type RelationshipFieldErrorServerComponent = FieldErrorServerComponent<RelationshipField, RelationshipFieldClientWithoutType>;
type RelationshipFieldErrorClientComponent = FieldErrorClientComponent<RelationshipFieldClientWithoutType>;
type RelationshipFieldDiffServerComponent = FieldDiffServerComponent<RelationshipField, RelationshipFieldClient>;
type RelationshipFieldDiffClientComponent = FieldDiffClientComponent<RelationshipFieldClient>;

type RowFieldClientWithoutType = MarkOptional<RowFieldClient, 'type'>;
type RowFieldBaseClientProps = Omit<FieldPaths, 'path'> & Pick<ClientComponentProps, 'forceRender'>;
type RowFieldClientProps = Omit<ClientFieldBase<RowFieldClientWithoutType>, 'path'> & RowFieldBaseClientProps;
type RowFieldServerProps = ServerFieldBase<RowField, RowFieldClientWithoutType>;
type RowFieldServerComponent = FieldServerComponent<RowField, RowFieldClientWithoutType>;
type RowFieldClientComponent = FieldClientComponent<RowFieldClientWithoutType, RowFieldBaseClientProps>;
type RowFieldLabelServerComponent = FieldLabelServerComponent<RowField, RowFieldClientWithoutType>;
type RowFieldLabelClientComponent = FieldLabelClientComponent<RowFieldClientWithoutType>;
type RowFieldDescriptionServerComponent = FieldDescriptionServerComponent<RowField, RowFieldClientWithoutType>;
type RowFieldDescriptionClientComponent = FieldDescriptionClientComponent<RowFieldClientWithoutType>;
type RowFieldErrorServerComponent = FieldErrorServerComponent<RowField, RowFieldClientWithoutType>;
type RowFieldErrorClientComponent = FieldErrorClientComponent<RowFieldClientWithoutType>;
type RowFieldDiffServerComponent = FieldDiffServerComponent<RowField, RowFieldClient>;
type RowFieldDiffClientComponent = FieldDiffClientComponent<RowFieldClient>;

type SelectFieldClientWithoutType = MarkOptional<SelectFieldClient, 'type'>;
type SelectFieldBaseClientProps = {
    readonly onChange?: (e: string | string[]) => void;
    readonly path: string;
    readonly validate?: SelectFieldValidation;
    readonly value?: string | string[];
};
type SelectFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type SelectFieldClientProps = ClientFieldBase<SelectFieldClientWithoutType> & SelectFieldBaseClientProps;
type SelectFieldServerProps = SelectFieldBaseServerProps & ServerFieldBase<SelectField, SelectFieldClientWithoutType>;
type SelectFieldServerComponent = FieldServerComponent<SelectField, SelectFieldClientWithoutType, SelectFieldBaseServerProps>;
type SelectFieldClientComponent = FieldClientComponent<SelectFieldClientWithoutType, SelectFieldBaseClientProps>;
type SelectFieldLabelServerComponent = FieldLabelServerComponent<SelectField, SelectFieldClientWithoutType>;
type SelectFieldLabelClientComponent = FieldLabelClientComponent<SelectFieldClientWithoutType>;
type SelectFieldDescriptionServerComponent = FieldDescriptionServerComponent<SelectField, SelectFieldClientWithoutType>;
type SelectFieldDescriptionClientComponent = FieldDescriptionClientComponent<SelectFieldClientWithoutType>;
type SelectFieldErrorServerComponent = FieldErrorServerComponent<SelectField, SelectFieldClientWithoutType>;
type SelectFieldErrorClientComponent = FieldErrorClientComponent<SelectFieldClientWithoutType>;
type SelectFieldDiffServerComponent = FieldDiffServerComponent<SelectField, SelectFieldClient>;
type SelectFieldDiffClientComponent = FieldDiffClientComponent<SelectFieldClient>;

type TextFieldClientWithoutType = MarkOptional<TextFieldClient, 'type'>;
type TextFieldBaseClientProps = {
    readonly inputRef?: React$1.RefObject<HTMLInputElement>;
    readonly onKeyDown?: React$1.KeyboardEventHandler<HTMLInputElement>;
    readonly path: string;
    readonly validate?: TextFieldValidation;
};
type TextFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type TextFieldClientProps = ClientFieldBase<TextFieldClientWithoutType> & TextFieldBaseClientProps;
type TextFieldServerProps = ServerFieldBase<TextField, TextFieldClientWithoutType> & TextFieldBaseServerProps;
type TextFieldServerComponent = FieldServerComponent<TextField, TextFieldClientWithoutType, TextFieldBaseServerProps>;
type TextFieldClientComponent = FieldClientComponent<TextFieldClientWithoutType, TextFieldBaseClientProps>;
type TextFieldLabelServerComponent = FieldLabelServerComponent<TextField, TextFieldClientWithoutType>;
type TextFieldLabelClientComponent = FieldLabelClientComponent<TextFieldClientWithoutType>;
type TextFieldDescriptionServerComponent = FieldDescriptionServerComponent<TextField, TextFieldClientWithoutType>;
type TextFieldDescriptionClientComponent = FieldDescriptionClientComponent<TextFieldClientWithoutType>;
type TextFieldErrorServerComponent = FieldErrorServerComponent<TextField, TextFieldClientWithoutType>;
type TextFieldErrorClientComponent = FieldErrorClientComponent<TextFieldClientWithoutType>;
type TextFieldDiffServerComponent = FieldDiffServerComponent<TextField, TextFieldClient>;
type TextFieldDiffClientComponent = FieldDiffClientComponent<TextFieldClient>;

type TextareaFieldClientWithoutType = MarkOptional<TextareaFieldClient, 'type'>;
type TextareaFieldBaseClientProps = {
    readonly inputRef?: React$1.Ref<HTMLInputElement>;
    readonly onKeyDown?: React$1.KeyboardEventHandler<HTMLInputElement>;
    readonly path: string;
    readonly validate?: TextareaFieldValidation;
};
type TextareaFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type TextareaFieldClientProps = ClientFieldBase<TextareaFieldClientWithoutType> & TextareaFieldBaseClientProps;
type TextareaFieldServerProps = ServerFieldBase<TextareaField, TextareaFieldClientWithoutType> & TextareaFieldBaseServerProps;
type TextareaFieldServerComponent = FieldServerComponent<TextareaField, TextareaFieldClientWithoutType, TextareaFieldBaseServerProps>;
type TextareaFieldClientComponent = FieldClientComponent<TextareaFieldClientWithoutType, TextareaFieldBaseClientProps>;
type TextareaFieldLabelServerComponent = FieldLabelServerComponent<TextareaField, TextareaFieldClientWithoutType>;
type TextareaFieldLabelClientComponent = FieldLabelClientComponent<TextareaFieldClientWithoutType>;
type TextareaFieldDescriptionServerComponent = FieldDescriptionServerComponent<TextareaField, TextareaFieldClientWithoutType>;
type TextareaFieldDescriptionClientComponent = FieldDescriptionClientComponent<TextareaFieldClientWithoutType>;
type TextareaFieldErrorServerComponent = FieldErrorServerComponent<TextareaField, TextareaFieldClientWithoutType>;
type TextareaFieldErrorClientComponent = FieldErrorClientComponent<TextareaFieldClientWithoutType>;
type TextareaFieldDiffServerComponent = FieldDiffServerComponent<TextareaField, TextareaFieldClient>;
type TextareaFieldDiffClientComponent = FieldDiffClientComponent<TextareaFieldClient>;

type UIFieldClientWithoutType = MarkOptional<UIFieldClient, 'type'>;
type UIFieldBaseClientProps = {
    readonly path: string;
};
type UIFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type UIFieldClientProps = ClientFieldBase<UIFieldClientWithoutType> & UIFieldBaseClientProps;
type UIFieldServerProps = ServerFieldBase<UIField, UIFieldClientWithoutType> & UIFieldBaseServerProps;
type UIFieldClientComponent = FieldClientComponent<UIFieldClientWithoutType, UIFieldBaseClientProps>;
type UIFieldServerComponent = FieldServerComponent<UIField, UIFieldClientWithoutType, UIFieldBaseServerProps>;
type UIFieldDiffServerComponent = FieldDiffServerComponent<UIField, UIFieldClient>;
type UIFieldDiffClientComponent = FieldDiffClientComponent<UIFieldClient>;

type UploadFieldClientWithoutType = MarkOptional<UploadFieldClient, 'type'>;
type UploadFieldBaseClientProps = {
    readonly path: string;
    readonly validate?: UploadFieldValidation;
};
type UploadFieldBaseServerProps = Pick<FieldPaths, 'path'>;
type UploadFieldClientProps = ClientFieldBase<UploadFieldClientWithoutType> & UploadFieldBaseClientProps;
type UploadFieldServerProps = ServerFieldBase<UploadField, UploadFieldClientWithoutType> & UploadFieldBaseServerProps;
type UploadFieldServerComponent = FieldServerComponent<UploadField, UploadFieldClientWithoutType, UploadFieldBaseServerProps>;
type UploadFieldClientComponent = FieldClientComponent<UploadFieldClientWithoutType, UploadFieldBaseClientProps>;
type UploadFieldLabelServerComponent = FieldLabelServerComponent<UploadField, UploadFieldClientWithoutType>;
type UploadFieldLabelClientComponent = FieldLabelClientComponent<UploadFieldClientWithoutType>;
type UploadFieldDescriptionServerComponent = FieldDescriptionServerComponent<UploadField, UploadFieldClientWithoutType>;
type UploadFieldDescriptionClientComponent = FieldDescriptionClientComponent<UploadFieldClientWithoutType>;
type UploadFieldErrorServerComponent = FieldErrorServerComponent<UploadField, UploadFieldClientWithoutType>;
type UploadFieldErrorClientComponent = FieldErrorClientComponent<UploadFieldClientWithoutType>;
type UploadFieldDiffServerComponent = FieldDiffServerComponent<UploadField, UploadFieldClient>;
type UploadFieldDiffClientComponent = FieldDiffClientComponent<UploadFieldClient>;

type DescriptionFunction = (args: {
    i18n: I18nClient;
    t: TFunction;
}) => string;
type FieldDescriptionClientComponent<TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = React.ComponentType<FieldDescriptionClientProps<TFieldClient>>;
type FieldDescriptionServerComponent<TFieldServer extends Field = Field, TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = React.ComponentType<FieldDescriptionServerProps<TFieldServer, TFieldClient>>;
type StaticDescription = Record<string, string> | string;
type Description = DescriptionFunction | StaticDescription;
type GenericDescriptionProps = {
    readonly className?: string;
    readonly description?: StaticDescription;
    readonly marginPlacement?: 'bottom' | 'top';
    readonly path: string;
};
type FieldDescriptionServerProps<TFieldServer extends Field = Field, TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = {
    clientField: TFieldClient;
    readonly field: TFieldServer;
} & GenericDescriptionProps & ServerComponentProps;
type FieldDescriptionClientProps<TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = {
    field: TFieldClient;
} & GenericDescriptionProps;

type VersionTab = {
    fields: VersionField[];
    name?: string;
} & Pick<Tab, 'label'>;
type BaseVersionField = {
    CustomComponent?: React.ReactNode;
    fields: VersionField[];
    path: string;
    rows?: VersionField[][];
    schemaPath: string;
    tabs?: VersionTab[];
    type: FieldTypes;
};
type VersionField = {
    field?: BaseVersionField;
    fieldByLocale?: Record<string, BaseVersionField>;
};
/**
 * Taken from react-diff-viewer-continued
 *
 * @deprecated remove in 4.0 - react-diff-viewer-continued is no longer a dependency
 */
declare enum DiffMethod {
    CHARS = "diffChars",
    CSS = "diffCss",
    JSON = "diffJson",
    LINES = "diffLines",
    SENTENCES = "diffSentences",
    TRIMMED_LINES = "diffTrimmedLines",
    WORDS = "diffWords",
    WORDS_WITH_SPACE = "diffWordsWithSpace"
}
type FieldDiffClientProps<TClientField extends ClientFieldWithOptionalType = ClientField> = {
    baseVersionField: BaseVersionField;
    /**
     * Field value from the version being compared from
     */
    comparisonValue: unknown;
    /**
     * @deprecated remove in 4.0. react-diff-viewer-continued is no longer a dependency
     */
    diffMethod: any;
    field: TClientField;
    /**
     * Permissions at this level of the field. If this field is unnamed, this will be `SanitizedFieldsPermissions` - if it is named, it will be `SanitizedFieldPermissions`
     */
    fieldPermissions: SanitizedFieldPermissions | SanitizedFieldsPermissions;
    /**
     * If this field is localized, this will be the locale of the field
     */
    locale?: string;
    nestingLevel?: number;
    parentIsLocalized: boolean;
    /**
     * Field value from the version being compared to
     *
     */
    versionValue: unknown;
};
type FieldDiffServerProps<TField extends Field = Field, TClientField extends ClientFieldWithOptionalType = ClientField> = {
    clientField: TClientField;
    field: TField;
    i18n: I18nClient;
    req: PayloadRequest;
    selectedLocales: string[];
} & Omit<FieldDiffClientProps, 'field'>;
type FieldDiffClientComponent<TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = React.ComponentType<FieldDiffClientProps<TFieldClient>>;
type FieldDiffServerComponent<TFieldServer extends Field = Field, TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = React.ComponentType<FieldDiffServerProps<TFieldServer, TFieldClient>>;

type GenericLabelProps = {
    readonly as?: 'h3' | 'label' | 'span';
    readonly hideLocale?: boolean;
    readonly htmlFor?: string;
    readonly label?: StaticLabel;
    readonly localized?: boolean;
    readonly path?: string;
    readonly required?: boolean;
    readonly unstyled?: boolean;
};
type FieldLabelClientProps<TFieldClient extends Partial<ClientFieldWithOptionalType> = Partial<ClientFieldWithOptionalType>> = {
    field?: TFieldClient;
} & GenericLabelProps;
type FieldLabelServerProps<TFieldServer extends Field, TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = {
    clientField: TFieldClient;
    readonly field: TFieldServer;
} & GenericLabelProps & ServerComponentProps;
type SanitizedLabelProps<TFieldClient extends ClientFieldWithOptionalType> = Omit<FieldLabelClientProps<TFieldClient>, 'label' | 'required'>;
type FieldLabelClientComponent<TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = React.ComponentType<FieldLabelClientProps<TFieldClient>>;
type FieldLabelServerComponent<TFieldServer extends Field = Field, TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = React.ComponentType<FieldLabelServerProps<TFieldServer, TFieldClient>>;

type RowLabelComponent = CustomComponent;
type RowLabel = Record<string, string> | string;

type Slugify<T extends TypeWithID = any> = (args: {
    data: T;
    req: PayloadRequest;
    valueToSlugify?: any;
}) => Promise<string | undefined> | string | undefined;
type SlugFieldArgs = {
    /**
     * Override for the `generateSlug` checkbox field name.
     * @default 'generateSlug'
     */
    checkboxName?: string;
    /**
     * @deprecated use `useAsSlug` instead.
     */
    fieldToUse?: string;
    /**
     * Enable localization for the slug field.
     */
    localized?: TextField['localized'];
    /**
     * Override for the `slug` field name.
     * @default 'slug'
     */
    name?: string;
    /**
     * A function used to override the slug field(s) at a granular level.
     * Passes the row field to you to manipulate beyond the exposed options.
     * @example
     * ```ts
     * slugField({
     *   overrides: (field) => {
     *     field.fields[1].label = 'Custom Slug Label'
     *     return field
     *   }
     * })
     * ```
     */
    overrides?: (field: RowField) => RowField;
    position?: FieldAdmin['position'];
    /**
     * Whether or not the `slug` field is required.
     * @default true
     */
    required?: TextField['required'];
    /**
     * Provide your own slugify function to override the default.
     */
    slugify?: Slugify;
    /**
     * The name of the top-level field to generate the slug from, when applicable.
     * @default 'title'
     */
    useAsSlug?: string;
};
type SlugField = (args?: SlugFieldArgs) => RowField;
type SlugFieldClientPropsOnly = Pick<SlugFieldArgs, 'useAsSlug'>;
/**
 * These are the props that the `SlugField` client component accepts.
 * The `SlugField` server component is responsible for passing down the `slugify` function.
 */
type SlugFieldClientProps = SlugFieldClientPropsOnly & TextFieldClientProps;
/**
 * A slug is a unique, indexed, URL-friendly string that identifies a particular document, often used to construct the URL of a webpage.
 * The `slug` field auto-generates its value based on another field, e.g. "My Title" → "my-title".
 *
 * The slug should continue to be generated through:
 * 1. The `create` operation, unless the user has modified the slug manually
 * 2. The `update` operation, if:
 *   a. Autosave is _not_ enabled and there is no slug
 *   b. Autosave _is_ enabled, the doc is unpublished, and the user has not modified the slug manually
 *
 * The slug should stabilize after all above criteria have been met, because the URL is typically derived from the slug.
 * This is to protect modifying potentially live URLs, breaking links, etc. without explicit intent.
 *
 * @experimental This field is experimental and may change or be removed in the future. Use at your own risk.
 */
declare const slugField: SlugField;

type ColumnsFromURL = string[];

type DefaultServerFunctionArgs = {
    importMap: ImportMap;
    req: PayloadRequest;
};
type ServerFunctionArgs = {
    args: Record<string, unknown>;
    name: string;
};
type ServerFunctionClientArgs = {
    args: Record<string, unknown>;
    name: string;
};
type ServerFunctionClient = (args: ServerFunctionClientArgs) => Promise<unknown> | unknown;
type ServerFunction<TArgs extends object = Record<string, unknown>, TReturnType = Promise<unknown> | unknown> = (args: DefaultServerFunctionArgs & TArgs) => TReturnType;
type ServerFunctionConfig = {
    fn: ServerFunction;
    name: string;
};
type ServerFunctionHandler = (args: {
    config: Promise<SanitizedConfig> | SanitizedConfig;
    importMap: ImportMap;
    /**
     * A map of server function names to their implementations. These are
     * registered alongside the base server functions and can be called
     * using the useServerFunctions() hook.
     *
     * @example
     * const { serverFunction } = useServerFunctions()
     *
     * const callServerFunction = useCallback(() => {
     *
     *  async function call() {
     *   const result = (await serverFunction({
     *    name: 'record-key',
     *    args: {
     *     // Your args
     *    },
     *   }))
     *
     *   // Do someting with the result
     *  }
     *
     *  void call()
     * }, [serverFunction])
     */
    serverFunctions?: Record<string, ServerFunction<any, any>>;
} & ServerFunctionClientArgs) => Promise<unknown>;
type ListQuery = {
    columns?: ColumnsFromURL;
    groupBy?: string;
    limit?: number;
    page?: number;
    preset?: number | string;
    queryByGroup?: Record<string, ListQuery>;
    search?: string;
    sort?: Sort;
    where?: Where;
} & Record<string, unknown>;
type BuildTableStateArgs = {
    /**
     * If an array is provided, the table will be built to support polymorphic collections.
     */
    collectionSlug: string | string[];
    columns?: ColumnPreference[];
    data?: PaginatedDocs;
    /**
     * @deprecated Use `data` instead
     */
    docs?: PaginatedDocs['docs'];
    enableRowSelections?: boolean;
    orderableFieldName: string;
    parent?: {
        collectionSlug: CollectionSlug;
        id: number | string;
        joinPath: string;
    };
    query?: ListQuery;
    renderRowTypes?: boolean;
    req: PayloadRequest;
    tableAppearance?: 'condensed' | 'default';
};
type BuildCollectionFolderViewResult = {
    View: React.ReactNode;
};
type GetFolderResultsComponentAndDataArgs = {
    /**
     * If true and no folderID is provided, only folders will be returned.
     * If false, the results will include documents from the active collections.
     */
    browseByFolder: boolean;
    /**
     * Used to filter document types to include in the results/display.
     *
     * i.e. ['folders', 'posts'] will only include folders and posts in the results.
     *
     * collectionsToQuery?
     */
    collectionsToDisplay: CollectionSlug[];
    /**
     * Used to determine how the results should be displayed.
     */
    displayAs: 'grid' | 'list';
    /**
     * Used to filter folders by the collections they are assigned to.
     *
     * i.e. ['posts'] will only include folders that are assigned to the posts collections.
     */
    folderAssignedCollections: CollectionSlug[];
    /**
     * The ID of the folder to filter results by.
     */
    folderID: number | string | undefined;
    req: PayloadRequest;
    /**
     * The sort order for the results.
     */
    sort: FolderSortKeys;
};
type SlugifyServerFunctionArgs = {
    collectionSlug?: CollectionSlug;
    globalSlug?: GlobalSlug;
    path?: FieldPaths['path'];
} & Omit<Parameters<Slugify>[0], 'req'>;

declare enum EntityType {
    collection = "collections",
    global = "globals"
}
type WidgetServerProps = {
    req: PayloadRequest;
    widgetData?: Record<string, unknown>;
    widgetSlug: string;
};

type FolderListViewSlots = {
    AfterFolderList?: React.ReactNode;
    AfterFolderListTable?: React.ReactNode;
    BeforeFolderList?: React.ReactNode;
    BeforeFolderListTable?: React.ReactNode;
    Description?: React.ReactNode;
    listMenuItems?: React.ReactNode[];
};
type FolderListViewServerPropsOnly = {
    collectionConfig: SanitizedCollectionConfig;
    documents: FolderOrDocument[];
    subfolders: FolderOrDocument[];
} & ServerProps;
type FolderListViewServerProps = FolderListViewClientProps & FolderListViewServerPropsOnly;
type FolderListViewClientProps = {
    activeCollectionFolderSlugs?: SanitizedCollectionConfig['slug'][];
    allCollectionFolderSlugs: SanitizedCollectionConfig['slug'][];
    allowCreateCollectionSlugs: SanitizedCollectionConfig['slug'][];
    baseFolderPath: `/${string}`;
    beforeActions?: React.ReactNode[];
    breadcrumbs: FolderBreadcrumb[];
    collectionSlug?: SanitizedCollectionConfig['slug'];
    disableBulkDelete?: boolean;
    disableBulkEdit?: boolean;
    documents: FolderOrDocument[];
    enableRowSelections?: boolean;
    folderAssignedCollections?: SanitizedCollectionConfig['slug'][];
    folderFieldName: string;
    folderID: null | number | string;
    FolderResultsComponent: React.ReactNode;
    search?: string;
    sort?: FolderSortKeys;
    subfolders: FolderOrDocument[];
    viewPreference: 'grid' | 'list';
} & FolderListViewSlots;
type FolderListViewSlotSharedClientProps = {
    collectionSlug: SanitizedCollectionConfig['slug'];
    hasCreatePermission: boolean;
    newDocumentURL: string;
};
type BeforeFolderListClientProps = FolderListViewSlotSharedClientProps;
type BeforeFolderListServerPropsOnly = {} & FolderListViewServerPropsOnly;
type BeforeFolderListServerProps = BeforeFolderListClientProps & BeforeFolderListServerPropsOnly;
type BeforeFolderListTableClientProps = FolderListViewSlotSharedClientProps;
type BeforeFolderListTableServerPropsOnly = {} & FolderListViewServerPropsOnly;
type BeforeFolderListTableServerProps = BeforeFolderListTableClientProps & BeforeFolderListTableServerPropsOnly;
type AfterFolderListClientProps = FolderListViewSlotSharedClientProps;
type AfterFolderListServerPropsOnly = {} & FolderListViewServerPropsOnly;
type AfterFolderListServerProps = AfterFolderListClientProps & AfterFolderListServerPropsOnly;
type AfterFolderListTableClientProps = FolderListViewSlotSharedClientProps;
type AfterFolderListTableServerPropsOnly = {} & FolderListViewServerPropsOnly;
type AfterFolderListTableServerProps = AfterFolderListTableClientProps & AfterFolderListTableServerPropsOnly;

type ListViewSlots = {
    AfterList?: React.ReactNode;
    AfterListTable?: React.ReactNode;
    BeforeList?: React.ReactNode;
    BeforeListTable?: React.ReactNode;
    Description?: React.ReactNode;
    listMenuItems?: React.ReactNode[];
    Table: React.ReactNode | React.ReactNode[];
};
/**
 * The `ListViewServerPropsOnly` approach is needed to ensure type strictness when injecting component props
 * There is no way to do something like `Omit<ListViewServerProps, keyof ListViewClientProps>`
 * This is because `ListViewClientProps` is a union which is impossible to exclude from
 * Exporting explicitly defined `ListViewServerPropsOnly`, etc. allows for the strictest typing
 */
type ListViewServerPropsOnly = {
    collectionConfig: SanitizedCollectionConfig;
    data: Data;
    limit: number;
    listPreferences: CollectionPreferences;
    listSearchableFields: CollectionAdminOptions['listSearchableFields'];
} & ServerProps;
type ListViewServerProps = ListViewClientProps & ListViewServerPropsOnly;
type ListViewClientProps = {
    beforeActions?: React.ReactNode[];
    collectionSlug: SanitizedCollectionConfig['slug'];
    columnState: Column[];
    disableBulkDelete?: boolean;
    disableBulkEdit?: boolean;
    disableQueryPresets?: boolean;
    enableRowSelections?: boolean;
    hasCreatePermission: boolean;
    hasDeletePermission?: boolean;
    /**
     * @deprecated
     */
    listPreferences?: CollectionPreferences;
    newDocumentURL: string;
    /**
     * @deprecated
     */
    preferenceKey?: string;
    queryPreset?: QueryPreset;
    queryPresetPermissions?: SanitizedCollectionPermission;
    renderedFilters?: Map<string, React.ReactNode>;
    resolvedFilterOptions?: Map<string, ResolvedFilterOptions>;
    viewType: ViewTypes;
} & ListViewSlots;
type ListViewSlotSharedClientProps = {
    collectionSlug: SanitizedCollectionConfig['slug'];
    hasCreatePermission: boolean;
    hasDeletePermission?: boolean;
    newDocumentURL: string;
};
type BeforeListClientProps = ListViewSlotSharedClientProps;
type BeforeListServerPropsOnly = {} & ListViewServerPropsOnly;
type BeforeListServerProps = BeforeListClientProps & BeforeListServerPropsOnly;
type BeforeListTableClientProps = ListViewSlotSharedClientProps;
type BeforeListTableServerPropsOnly = {} & ListViewServerPropsOnly;
type BeforeListTableServerProps = BeforeListTableClientProps & BeforeListTableServerPropsOnly;
type AfterListClientProps = ListViewSlotSharedClientProps;
type AfterListServerPropsOnly = {} & ListViewServerPropsOnly;
type AfterListServerProps = AfterListClientProps & AfterListServerPropsOnly;
type AfterListTableClientProps = ListViewSlotSharedClientProps;
type AfterListTableServerPropsOnly = {} & ListViewServerPropsOnly;
type AfterListTableServerProps = AfterListTableClientProps & AfterListTableServerPropsOnly;

type MappedServerComponent<TComponentClientProps extends JsonObject = JsonObject> = {
    Component?: React$1.ComponentType<TComponentClientProps>;
    props?: Partial<any>;
    RenderedComponent: React$1.ReactNode;
    type: 'server';
};
type MappedClientComponent<TComponentClientProps extends JsonObject = JsonObject> = {
    Component?: React$1.ComponentType<TComponentClientProps>;
    props?: Partial<TComponentClientProps>;
    RenderedComponent?: React$1.ReactNode;
    type: 'client';
};
type MappedEmptyComponent = {
    type: 'empty';
};
declare enum Action {
    RenderConfig = "render-config"
}
type RenderEntityConfigArgs = {
    collectionSlug?: string;
    data?: Data;
    globalSlug?: string;
};
type RenderRootConfigArgs = {};
type RenderFieldConfigArgs = {
    collectionSlug?: string;
    formState?: FormState;
    globalSlug?: string;
    schemaPath: string;
};
type RenderConfigArgs = {
    action: Action.RenderConfig;
    config: Promise<SanitizedConfig> | SanitizedConfig;
    i18n: I18nClient;
    importMap: ImportMap;
    languageCode: AcceptedLanguages;
    serverProps?: any;
} & (RenderEntityConfigArgs | RenderFieldConfigArgs | RenderRootConfigArgs);
type PayloadServerAction = (args: {
    [key: string]: any;
    action: Action;
    i18n: I18nClient;
} | RenderConfigArgs) => Promise<string>;
type RenderedField = {
    Field: React$1.ReactNode;
    indexPath?: string;
    initialSchemaPath?: string;
    /**
     * @deprecated
     * This is a legacy property that will be removed in v4.
     * Please use `fieldIsSidebar(field)` from `payload` instead.
     * Or check `field.admin.position === 'sidebar'` directly.
     */
    isSidebar: boolean;
    path: string;
    schemaPath: string;
    type: FieldTypes;
};
type FieldRow = {
    RowLabel?: React$1.ReactNode;
};
type DocumentSlots = {
    BeforeDocumentControls?: React$1.ReactNode;
    Description?: React$1.ReactNode;
    EditMenuItems?: React$1.ReactNode;
    LivePreview?: React$1.ReactNode;
    PreviewButton?: React$1.ReactNode;
    PublishButton?: React$1.ReactNode;
    SaveButton?: React$1.ReactNode;
    SaveDraftButton?: React$1.ReactNode;
    Status?: React$1.ReactNode;
    Upload?: React$1.ReactNode;
    UploadControls?: React$1.ReactNode;
};

type SchemaPath = {} & string;
type FieldSchemaMap = Map<SchemaPath, {
    fields: Field[];
} | Block | Field | Tab>;
type ClientFieldSchemaMap = Map<SchemaPath, {
    fields: ClientField[];
} | ClientBlock | ClientField | ClientTab>;
type DocumentEvent = {
    doc?: TypeWithID;
    drawerSlug?: string;
    entitySlug: string;
    id?: number | string;
    operation: 'create' | 'update';
    updatedAt: string;
};

type MeOperationResult = {
    collection?: string;
    exp?: number;
    /** @deprecated
     * use:
     * ```ts
     * user._strategy
     * ```
     */
    strategy?: string;
    token?: string;
    user?: ClientUser;
};
type Arguments$q = {
    collection: Collection;
    currentToken?: string;
    depth?: number;
    draft?: boolean;
    joins?: JoinQuery;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
};
declare const meOperation: (args: Arguments$q) => Promise<MeOperationResult>;

type Result$4 = {
    exp: number;
    refreshedToken: string;
    setCookie?: boolean;
    /** @deprecated
     * use:
     * ```ts
     * user._strategy
     * ```
     */
    strategy?: string;
    user: Document;
};
type Arguments$p = {
    collection: Collection;
    req: PayloadRequest;
};
declare const refreshOperation: (incomingArgs: Arguments$p) => Promise<Result$4>;

type WithMetadata = ((options: {
    metadata: Metadata$1;
    req: PayloadRequest;
}) => Promise<boolean>) | boolean;

type FileSize = {
    filename: null | string;
    filesize: null | number;
    height: null | number;
    mimeType: null | string;
    url?: null | string;
    width: null | number;
};
/**
 * FileSizeImproved is a more precise type, and will replace FileSize in Payload v4.
 * This type is for internal use only as it will be deprecated in the future.
 * @internal
 */
type FileSizeImproved = {
    url: null | string;
} & FileSize;
type FileSizes = {
    [size: string]: FileSize;
};
type FileData = {
    filename: string;
    filesize: number;
    focalX?: number;
    focalY?: number;
    height: number;
    mimeType: string;
    sizes: FileSizes;
    tempFilePath?: string;
    url?: string;
    width: number;
};
type ProbedImageSize = {
    height: number;
    width: number;
};
/**
 * Params sent to the sharp `toFormat()` function
 * @link https://sharp.pixelplumbing.com/api-output#toformat
 */
type ImageUploadFormatOptions = {
    format: Parameters<Sharp['toFormat']>[0];
    options?: Parameters<Sharp['toFormat']>[1];
};
/**
 * Params sent to the sharp trim() function
 * @link https://sharp.pixelplumbing.com/api-resize#trim
 */
type ImageUploadTrimOptions = Parameters<Sharp['trim']>[0];
type GenerateImageName = (args: {
    extension: string;
    height: number;
    originalName: string;
    sizeName: string;
    width: number;
}) => string;
type ImageSize = {
    /**
     * Admin UI options that control how this image size appears in list views.
     *
     * NOTE: In Payload v4, these options (`disableGroupBy`, `disableListColumn` and `disableListFilter`)
     * should default to `true` so image size subfields are hidden from list columns
     * and filters by default, reducing noise in the admin UI.
     */
    admin?: {
        /**
         * If set to true, this image size will not be available
         * as a selectable groupBy option in the collection list view.
         * @default false
         */
        disableGroupBy?: boolean;
        /**
         * If set to true, this image size will not be available
         * as a selectable column in the collection list view.
         * @default false
         */
        disableListColumn?: boolean;
        /**
         * If set to true, this image size will not be available
         * as a filter option in the collection list view.
         * @default false
         */
        disableListFilter?: boolean;
    };
    /**
     * @deprecated prefer position
     */
    crop?: string;
    formatOptions?: ImageUploadFormatOptions;
    /**
     * Generate a custom name for the file of this image size.
     */
    generateImageName?: GenerateImageName;
    name: string;
    trimOptions?: ImageUploadTrimOptions;
    /**
     * When an uploaded image is smaller than the defined image size, we have 3 options:
     *
     * `undefined | false | true`
     *
     * 1. `undefined` [default]: uploading images with smaller width AND height than the image size will return null
     * 2. `false`: always enlarge images to the image size
     * 3. `true`: if the image is smaller than the image size, return the original image
     */
    withoutEnlargement?: ResizeOptions['withoutEnlargement'];
} & Omit<ResizeOptions, 'withoutEnlargement'>;
type GetAdminThumbnail = (args: {
    doc: Record<string, unknown>;
}) => false | null | string;
type AllowList = Array<{
    hostname: string;
    pathname?: string;
    port?: string;
    protocol?: 'http' | 'https';
    search?: string;
}>;
type FileAllowList = Array<{
    extensions: string[];
    mimeType: string;
}>;
type Admin = {
    components?: {
        /**
         * The Controls component to extend the upload controls in the admin panel.
         */
        controls?: PayloadComponent[];
    };
};
type UploadConfig = {
    /**
     * The adapter name to use for uploads. Used for storage adapter telemetry.
     * @default undefined
     */
    adapter?: string;
    /**
     * The admin configuration for the upload field.
     */
    admin?: Admin;
    /**
     * Represents an admin thumbnail, which can be either a React component or a string.
     * - If a string, it should be one of the image size names.
     * - A function that generates a fully qualified URL for the thumbnail, receives the doc as the only argument.
     **/
    adminThumbnail?: GetAdminThumbnail | string;
    /**
     * Allow restricted file types known to be problematic.
     * - If set to `true`, it will allow all file types.
     * - If set to `false`, it will not allow file types and extensions known to be problematic.
     * - This setting is overriden by the `mimeTypes` option.
     * @default false
     */
    allowRestrictedFileTypes?: boolean;
    /**
     * Enables bulk upload of files from the list view.
     * @default true
     */
    bulkUpload?: boolean;
    /**
     * Appends a cache tag to the image URL when fetching the thumbnail in the admin panel. It may be desirable to disable this when hosting via CDNs with strict parameters.
     *
     * @default true
     */
    cacheTags?: boolean;
    /**
     * Sharp constructor options to be passed to the uploaded file.
     * @link https://sharp.pixelplumbing.com/api-constructor/#sharp
     */
    constructorOptions?: SharpOptions;
    /**
     * Enables cropping of images.
     * @default true
     */
    crop?: boolean;
    /**
     * Disable the ability to save files to disk.
     * @default false
     */
    disableLocalStorage?: boolean;
    /**
     * Enable displaying preview of the uploaded file in Upload fields related to this Collection.
     * Can be locally overridden by `displayPreview` option in Upload field.
     * @default false
     */
    displayPreview?: boolean;
    /**
     *
     * Accepts existing headers and returns the headers after filtering or modifying.
     * If using this option, you should handle the removal of any sensitive cookies
     * (like payload-prefixed cookies) to prevent leaking session information to external
     * services. By default, Payload automatically filters out payload-prefixed cookies
     * when this option is NOT defined.
     *
     * Useful for adding custom headers to fetch from external providers.
     * @default undefined
     */
    externalFileHeaderFilter?: (headers: Record<string, string>) => Record<string, string>;
    /**
     * Field slugs to use for a compound index instead of the default filename index.
     */
    filenameCompoundIndex?: string[];
    /**
     * Require files to be uploaded when creating a document.
     * @default true
     */
    filesRequiredOnCreate?: boolean;
    /**
     * Enables focal point positioning for image manipulation.
     * @default false
     */
    focalPoint?: boolean;
    /**
     * Format options for the uploaded file. Formatting image sizes needs to be done within each formatOptions individually.
     */
    formatOptions?: ImageUploadFormatOptions;
    /**
     * Custom handlers to run when a file is fetched.
     *
     * - If a handler returns a Response, the response will be sent to the client and no further handlers will be run.
     * - If a handler returns null, the next handler will be run.
     * - If no handlers return a response the file will be returned by default.
     *
     * @link https://sharp.pixelplumbing.com/api-output/#toformat
     * @default undefined
     */
    handlers?: ((req: PayloadRequest, args: {
        doc: TypeWithID;
        headers?: Headers;
        params: {
            clientUploadContext?: unknown;
            collection: string;
            filename: string;
        };
    }) => Promise<Response> | Promise<void> | Response | void)[];
    /**
     * Set to `true` to prevent the admin UI from showing file inputs during document creation, useful for programmatic file generation.
     */
    hideFileInputOnCreate?: boolean;
    /**
     * Set to `true` to prevent the admin UI having a way to remove an existing file while editing.
     */
    hideRemoveFile?: boolean;
    imageSizes?: ImageSize[];
    /**
     * Restrict mimeTypes in the file picker. Array of valid mime types or mimetype wildcards
     * @example ['image/*', 'application/pdf']
     * @default undefined
     */
    mimeTypes?: string[];
    /**
     * Ability to modify the response headers fetching a file.
     * @default undefined
     */
    modifyResponseHeaders?: ({ headers }: {
        headers: Headers;
    }) => Headers | void;
    /**
     * Controls the behavior of pasting/uploading files from URLs.
     * If set to `false`, fetching from remote URLs is disabled.
     * If an `allowList` is provided, server-side fetching will be enabled for specified URLs.
     *
     * @default true (client-side fetching enabled)
     */
    pasteURL?: {
        allowList: AllowList;
    } | false;
    /**
     * Sharp resize options for the original image.
     * @link https://sharp.pixelplumbing.com/api-resize#resize
     * @default undefined
     */
    resizeOptions?: ResizeOptions;
    /**
     *  Skip safe fetch when using server-side fetching for external files from these URLs.
     *  @default false
     */
    skipSafeFetch?: AllowList | boolean;
    /**
     * The directory to serve static files from. Defaults to collection slug.
     * @default undefined
     */
    staticDir?: string;
    trimOptions?: ImageUploadTrimOptions;
    /**
     * Optionally append metadata to the image during processing.
     *
     * Can be a boolean or a function.
     *
     * If true, metadata will be appended to the image.
     * If false, no metadata will be appended.
     * If a function, it will receive an object containing the metadata and should return a boolean indicating whether to append the metadata.
     * @default false
     */
    withMetadata?: WithMetadata;
};
type checkFileRestrictionsParams = {
    collection: CollectionConfig;
    file: File$1;
    req: PayloadRequest;
};
type SanitizedUploadConfig = {
    staticDir: UploadConfig['staticDir'];
} & UploadConfig;
type File$1 = {
    /**
     * The buffer of the file.
     */
    data: Buffer;
    /**
     * The mimetype of the file.
     */
    mimetype: string;
    /**
     * The name of the file.
     */
    name: string;
    /**
     * The size of the file in bytes.
     */
    size: number;
};
type FileToSave = {
    /**
     * The buffer of the file.
     */
    buffer: Buffer;
    /**
     * The path to save the file.
     */
    path: string;
};
type Crop = {
    height: number;
    unit: '%' | 'px';
    width: number;
    x: number;
    y: number;
};
type FocalPoint = {
    x: number;
    y: number;
};
type UploadEdits = {
    crop?: Crop;
    focalPoint?: FocalPoint;
    heightInPixels?: number;
    widthInPixels?: number;
};

type Arguments$o<TSlug extends CollectionSlug> = {
    collection: Collection;
    data: {
        [key: string]: unknown;
    } & AuthOperationsFromCollectionSlug<TSlug>['forgotPassword'];
    disableEmail?: boolean;
    expiration?: number;
    req: PayloadRequest;
};
type Result$3 = string;
declare const forgotPasswordOperation: <TSlug extends CollectionSlug>(incomingArgs: Arguments$o<TSlug>) => Promise<null | string>;

type Result$2 = {
    exp?: number;
    token?: string;
    user?: TypedUser;
};
type Arguments$n<TSlug extends CollectionSlug> = {
    collection: Collection;
    data: AuthOperationsFromCollectionSlug<TSlug>['login'];
    depth?: number;
    overrideAccess?: boolean;
    req: PayloadRequest;
    showHiddenFields?: boolean;
};
type CheckLoginPermissionArgs = {
    loggingInWithUsername?: boolean;
    req: PayloadRequest;
    user: any;
};
/**
 * Throws an error if the user is locked or does not exist.
 * This does not check the login attempts, only the lock status. Whoever increments login attempts
 * is responsible for locking the user properly, not whoever checks the login permission.
 */
declare const checkLoginPermission: ({ loggingInWithUsername, req, user, }: CheckLoginPermissionArgs) => void;
declare const loginOperation: <TSlug extends CollectionSlug>(incomingArgs: Arguments$n<TSlug>) => Promise<{
    user: DataFromCollectionSlug<TSlug>;
} & Result$2>;

type Result$1 = {
    token?: string;
    user: Record<string, unknown>;
};
type Arguments$m = {
    collection: Collection;
    data: {
        password: string;
        token: string;
    };
    depth?: number;
    overrideAccess?: boolean;
    req: PayloadRequest;
};
declare const resetPasswordOperation: <TSlug extends CollectionSlug>(args: Arguments$m) => Promise<Result$1>;

type Arguments$l<TSlug extends CollectionSlug> = {
    collection: Collection;
    data: AuthOperationsFromCollectionSlug<TSlug>['unlock'];
    overrideAccess?: boolean;
    req: PayloadRequest;
};
declare const unlockOperation: <TSlug extends CollectionSlug>(args: Arguments$l<TSlug>) => Promise<boolean>;

type Arguments$k = {
    collection: Collection;
    disableErrors?: boolean;
    overrideAccess?: boolean;
    req?: PayloadRequest;
    trash?: boolean;
    where?: Where;
};
declare const countOperation: <TSlug extends CollectionSlug>(incomingArgs: Arguments$k) => Promise<{
    totalDocs: number;
}>;

type Arguments$j = {
    collection: Collection;
    disableErrors?: boolean;
    overrideAccess?: boolean;
    req?: PayloadRequest;
    where?: Where;
};
declare const countVersionsOperation: <TSlug extends CollectionSlug>(incomingArgs: Arguments$j) => Promise<{
    totalDocs: number;
}>;

type Arguments$i<TSlug extends CollectionSlug> = {
    autosave?: boolean;
    collection: Collection;
    data: RequiredDataFromCollectionSlug<TSlug>;
    depth?: number;
    disableTransaction?: boolean;
    disableVerificationEmail?: boolean;
    draft?: boolean;
    duplicateFromID?: DataFromCollectionSlug<TSlug>['id'];
    overrideAccess?: boolean;
    overwriteExistingFiles?: boolean;
    populate?: PopulateType;
    publishSpecificLocale?: string;
    req: PayloadRequest;
    select?: SelectType;
    selectedLocales?: string[];
    showHiddenFields?: boolean;
};
declare const createOperation: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(incomingArgs: Arguments$i<TSlug>) => Promise<TransformCollectionWithSelect<TSlug, TSelect>>;

type Arguments$h = {
    collection: Collection;
    depth?: number;
    disableTransaction?: boolean;
    overrideAccess?: boolean;
    overrideLock?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    trash?: boolean;
    where: Where;
};
declare const deleteOperation: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(incomingArgs: Arguments$h) => Promise<BulkOperationResult<TSlug, TSelect>>;

type Arguments$g = {
    collection: Collection;
    depth?: number;
    disableTransaction?: boolean;
    id: number | string;
    overrideAccess?: boolean;
    overrideLock?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    trash?: boolean;
};
declare const deleteByIDOperation: <TSlug extends CollectionSlug, TSelect extends SelectType>(incomingArgs: Arguments$g) => Promise<TransformCollectionWithSelect<TSlug, TSelect>>;

type Arguments$f = {
    collection: Collection;
    currentDepth?: number;
    depth?: number;
    disableErrors?: boolean;
    draft?: boolean;
    includeLockStatus?: boolean;
    joins?: JoinQuery;
    limit?: number;
    overrideAccess?: boolean;
    page?: number;
    pagination?: boolean;
    populate?: PopulateType;
    req?: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    sort?: Sort;
    trash?: boolean;
    where?: Where;
};
declare const findOperation: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(incomingArgs: Arguments$f) => Promise<PaginatedDocs<TransformCollectionWithSelect<TSlug, TSelect>>>;

type AfterReadArgs<T extends JsonObject> = {
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    currentDepth?: number;
    depth: number;
    doc: T;
    draft: boolean;
    fallbackLocale: TypedFallbackLocale;
    findMany?: boolean;
    /**
     * Controls whether locales should be flattened into the requested locale.
     * E.g.: { [locale]: fields } -> fields
     *
     * @default true
     */
    flattenLocales?: boolean;
    global: null | SanitizedGlobalConfig;
    locale: string;
    overrideAccess: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields: boolean;
};

type FindByIDArgs = {
    collection: Collection;
    currentDepth?: number;
    /**
     * You may pass the document data directly which will skip the `db.findOne` database query.
     * This is useful if you want to use this endpoint solely for running hooks and populating data.
     */
    data?: Record<string, unknown>;
    depth?: number;
    disableErrors?: boolean;
    draft?: boolean;
    id: number | string;
    includeLockStatus?: boolean;
    joins?: JoinQuery;
    overrideAccess?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    trash?: boolean;
} & Pick<AfterReadArgs<JsonObject>, 'flattenLocales'>;
declare const findByIDOperation: <TSlug extends CollectionSlug, TDisableErrors extends boolean, TSelect extends SelectFromCollectionSlug<TSlug>>(incomingArgs: FindByIDArgs) => Promise<ApplyDisableErrors<TransformCollectionWithSelect<TSlug, TSelect>, TDisableErrors>>;

type Arguments$e = {
    collection: Collection;
    depth?: number;
    disableErrors?: boolean;
    field: string;
    limit?: number;
    locale?: string;
    overrideAccess?: boolean;
    page?: number;
    populate?: PopulateType;
    req?: PayloadRequest;
    showHiddenFields?: boolean;
    sort?: Sort;
    trash?: boolean;
    where?: Where;
};
declare const findDistinctOperation: (incomingArgs: Arguments$e) => Promise<PaginatedDistinctDocs<Record<string, unknown>>>;

type Arguments$d = {
    collection: Collection;
    currentDepth?: number;
    depth?: number;
    disableErrors?: boolean;
    id: number | string;
    overrideAccess?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    trash?: boolean;
};
declare const findVersionByIDOperation$1: <TData extends TypeWithID = any>(args: Arguments$d) => Promise<TypeWithVersion<TData>>;

type Arguments$c = {
    collection: Collection;
    depth?: number;
    limit?: number;
    overrideAccess?: boolean;
    page?: number;
    pagination?: boolean;
    populate?: PopulateType;
    req?: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    sort?: Sort;
    trash?: boolean;
    where?: Where;
};
declare const findVersionsOperation$1: <TData extends TypeWithVersion<TData>>(args: Arguments$c) => Promise<PaginatedDocs<TData>>;

type Arguments$b<TSlug extends CollectionSlug> = {
    autosave?: boolean;
    collection: Collection;
    data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>;
    depth?: number;
    disableTransaction?: boolean;
    disableVerificationEmail?: boolean;
    draft?: boolean;
    limit?: number;
    overrideAccess?: boolean;
    overrideLock?: boolean;
    overwriteExistingFiles?: boolean;
    populate?: PopulateType;
    publishSpecificLocale?: string;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    /**
     * Sort the documents, can be a string or an array of strings
     * @example '-createdAt' // Sort DESC by createdAt
     * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
     */
    sort?: Sort;
    trash?: boolean;
    where: Where;
};
declare const updateOperation$1: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(incomingArgs: Arguments$b<TSlug>) => Promise<BulkOperationResult<TSlug, TSelect>>;

type Arguments$a<TSlug extends CollectionSlug> = {
    autosave?: boolean;
    collection: Collection;
    data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>;
    depth?: number;
    disableTransaction?: boolean;
    disableVerificationEmail?: boolean;
    draft?: boolean;
    id: number | string;
    overrideAccess?: boolean;
    overrideLock?: boolean;
    overwriteExistingFiles?: boolean;
    populate?: PopulateType;
    publishSpecificLocale?: string;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    trash?: boolean;
};
declare const updateByIDOperation: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug> = SelectType>(incomingArgs: Arguments$a<TSlug>) => Promise<TransformCollectionWithSelect<TSlug, TSelect>>;

type OperationMap<TOperationGeneric extends CollectionSlug> = {
    count: typeof countOperation<TOperationGeneric>;
    countVersions: typeof countVersionsOperation<TOperationGeneric>;
    create: typeof createOperation<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>;
    delete: typeof deleteOperation<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>;
    deleteByID: typeof deleteByIDOperation<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>;
    find: typeof findOperation<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>;
    findByID: typeof findByIDOperation<TOperationGeneric, boolean, SelectFromCollectionSlug<TOperationGeneric>>;
    findDistinct: typeof findDistinctOperation;
    findVersionByID: typeof findVersionByIDOperation$1;
    findVersions: typeof findVersionsOperation$1;
    forgotPassword: typeof forgotPasswordOperation;
    login: typeof loginOperation<TOperationGeneric>;
    refresh: typeof refreshOperation;
    resetPassword: typeof resetPasswordOperation<TOperationGeneric>;
    restoreVersion: typeof restoreVersionOperation$1;
    unlock: typeof unlockOperation<TOperationGeneric>;
    update: typeof updateOperation$1<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>;
    updateByID: typeof updateByIDOperation<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>;
};
type AfterOperationArg<TOperationGeneric extends CollectionSlug> = {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    req: PayloadRequest;
} & ({
    args: Parameters<OperationMap<TOperationGeneric>['count']>[0];
    operation: 'count';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['count']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['countVersions']>[0];
    operation: 'countVersions';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['countVersions']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['create']>[0];
    operation: 'create';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['create']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['delete']>[0];
    operation: 'delete';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['delete']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['deleteByID']>[0];
    operation: 'deleteByID';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['deleteByID']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['find']>[0];
    /**
     * @deprecated Use 'find' or 'findByID' operation instead
     *
     * TODO: v4 - remove this union option
     */
    operation: 'read';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['find']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['find']>[0];
    operation: 'find';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['find']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findByID']>[0];
    operation: 'findByID';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['findByID']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findDistinct']>[0];
    operation: 'findDistinct';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['findDistinct']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findVersionByID']>[0];
    operation: 'findVersionByID';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['findVersionByID']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findVersions']>[0];
    operation: 'findVersions';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['findVersions']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['forgotPassword']>[0];
    operation: 'forgotPassword';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['forgotPassword']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['login']>[0];
    operation: 'login';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['login']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['refresh']>[0];
    operation: 'refresh';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['refresh']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['resetPassword']>[0];
    operation: 'resetPassword';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['resetPassword']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['restoreVersion']>[0];
    operation: 'restoreVersion';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['restoreVersion']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['unlock']>[0];
    operation: 'unlock';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['unlock']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['update']>[0];
    operation: 'update';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['update']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['updateByID']>[0];
    operation: 'updateByID';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['updateByID']>>;
});
type BeforeOperationArg<TOperationGeneric extends CollectionSlug> = {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    req: PayloadRequest;
} & ({
    args: Parameters<OperationMap<TOperationGeneric>['find']>[0] | Parameters<OperationMap<TOperationGeneric>['findByID']>[0];
    /**
     * @deprecated Use 'find' or 'findByID' operation instead
     *
     * TODO: v4 - remove this union option
     */
    operation: 'read';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['count']>[0];
    operation: 'count';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['countVersions']>[0];
    operation: 'countVersions';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['create']>[0];
    operation: 'create';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['delete']>[0];
    operation: 'delete';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['deleteByID']>[0];
    operation: 'deleteByID';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['find']>[0];
    operation: 'find';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findByID']>[0];
    operation: 'findByID';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findDistinct']>[0];
    /**
     * @deprecated Use 'findDistinct' operation instead
     *
     * TODO: v4 - remove this union option
     */
    operation: 'readDistinct';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findDistinct']>[0];
    operation: 'findDistinct';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findVersionByID']>[0];
    operation: 'findVersionByID';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findVersions']>[0];
    operation: 'findVersions';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['forgotPassword']>[0];
    operation: 'forgotPassword';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['login']>[0];
    operation: 'login';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['refresh']>[0];
    operation: 'refresh';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['resetPassword']>[0];
    operation: 'resetPassword';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['restoreVersion']>[0];
    operation: 'restoreVersion';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['unlock']>[0];
    operation: 'unlock';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['update']>[0];
    operation: 'update';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['updateByID']>[0];
    operation: 'updateByID';
});

type DataFromCollectionSlug<TSlug extends CollectionSlug> = TypedCollection[TSlug];
type SelectFromCollectionSlug<TSlug extends CollectionSlug> = TypedCollectionSelect[TSlug];
type AuthOperationsFromCollectionSlug<TSlug extends CollectionSlug> = TypedAuthOperations[TSlug];
type RequiredDataFromCollection<TData extends JsonObject> = MarkOptional<TData, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>;
type RequiredDataFromCollectionSlug<TSlug extends CollectionSlug> = RequiredDataFromCollection<DataFromCollectionSlug<TSlug>>;
/**
 * Helper type for draft data INPUT (e.g., create operations) - makes all fields optional except system fields
 * When creating a draft, required fields don't need to be provided as validation is skipped
 * The id field is optional since it's auto-generated
 */
type DraftDataFromCollection<TData extends JsonObject> = Partial<Omit<TData, 'createdAt' | 'deletedAt' | 'id' | 'sizes' | 'updatedAt'>> & Partial<Pick<TData, 'createdAt' | 'deletedAt' | 'id' | 'sizes' | 'updatedAt'>>;
type DraftDataFromCollectionSlug<TSlug extends CollectionSlug> = DraftDataFromCollection<DataFromCollectionSlug<TSlug>>;
/**
 * Helper type for draft data OUTPUT (e.g., query results) - makes user fields optional but keeps id required
 * When querying drafts, required fields may be null/undefined as validation is skipped, but system fields like id are always present
 */
type QueryDraftDataFromCollection<TData extends JsonObject> = Partial<Omit<TData, 'createdAt' | 'deletedAt' | 'id' | 'sizes' | 'updatedAt'>> & Partial<Pick<TData, 'createdAt' | 'deletedAt' | 'sizes' | 'updatedAt'>> & Pick<TData, 'id'>;
type QueryDraftDataFromCollectionSlug<TSlug extends CollectionSlug> = QueryDraftDataFromCollection<DataFromCollectionSlug<TSlug>>;
type HookOperationType = 'autosave' | 'count' | 'countVersions' | 'create' | 'delete' | 'forgotPassword' | 'login' | 'read' | 'readDistinct' | 'refresh' | 'resetPassword' | 'restoreVersion' | 'update';
type CreateOrUpdateOperation = Extract<HookOperationType, 'create' | 'update'>;
type BeforeOperationHook<TOperationGeneric extends CollectionSlug = string> = (arg: BeforeOperationArg<TOperationGeneric>) => Parameters<OperationMap<TOperationGeneric>[keyof OperationMap<TOperationGeneric>]>[0] | Promise<Parameters<OperationMap<TOperationGeneric>[keyof OperationMap<TOperationGeneric>]>[0]> | Promise<void> | void;
type BeforeValidateHook<T extends TypeWithID = any> = (args: {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    data?: Partial<T>;
    /**
     * Hook operation being performed
     */
    operation: CreateOrUpdateOperation;
    /**
     * Original document before change
     *
     * `undefined` on 'create' operation
     */
    originalDoc?: T;
    req: PayloadRequest;
}) => any;
type BeforeChangeHook<T extends TypeWithID = any> = (args: {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    data: Partial<T>;
    /**
     * Hook operation being performed
     */
    operation: CreateOrUpdateOperation;
    /**
     * Original document before change
     *
     * `undefined` on 'create' operation
     */
    originalDoc?: T;
    req: PayloadRequest;
}) => any;
type AfterChangeHook<T extends TypeWithID = any> = (args: {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    data: Partial<T>;
    doc: T;
    /**
     * Hook operation being performed
     */
    operation: CreateOrUpdateOperation;
    previousDoc: T;
    req: PayloadRequest;
}) => any;
type BeforeReadHook<T extends TypeWithID = any> = (args: {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    doc: T;
    query: {
        [key: string]: any;
    };
    req: PayloadRequest;
}) => any;
type AfterReadHook<T extends TypeWithID = any> = (args: {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    doc: T;
    findMany?: boolean;
    query?: {
        [key: string]: any;
    };
    req: PayloadRequest;
}) => any;
type BeforeDeleteHook = (args: {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    id: number | string;
    req: PayloadRequest;
}) => any;
type AfterDeleteHook<T extends TypeWithID = any> = (args: {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    doc: T;
    id: number | string;
    req: PayloadRequest;
}) => any;
type AfterOperationHook<TOperationGeneric extends CollectionSlug = string> = (arg: AfterOperationArg<TOperationGeneric>) => Awaited<ReturnType<OperationMap<TOperationGeneric>[keyof OperationMap<TOperationGeneric>]>> | Promise<Awaited<ReturnType<OperationMap<TOperationGeneric>[keyof OperationMap<TOperationGeneric>]>>>;
type BeforeLoginHook<T extends TypeWithID = any> = (args: {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    req: PayloadRequest;
    user: T;
}) => any;
type AfterLoginHook<T extends TypeWithID = any> = (args: {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    req: PayloadRequest;
    token: string;
    user: T;
}) => any;
type AfterLogoutHook<T extends TypeWithID = any> = (args: {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    req: PayloadRequest;
}) => any;
type AfterMeHook<T extends TypeWithID = any> = (args: {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    req: PayloadRequest;
    response: unknown;
}) => any;
type RefreshHook<T extends TypeWithID = any> = (args: {
    args: Arguments$p;
    user: T;
}) => Promise<Result$4 | void> | (Result$4 | void);
type MeHook<T extends TypeWithID = any> = (args: {
    args: Arguments$q;
    user: T;
}) => ({
    exp: number;
    user: T;
} | void) | Promise<{
    exp: number;
    user: T;
} | void>;
type AfterRefreshHook<T extends TypeWithID = any> = (args: {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    exp: number;
    req: PayloadRequest;
    token: string;
}) => any;
type AfterErrorHook = (args: {
    collection: SanitizedCollectionConfig;
} & AfterErrorHookArgs) => AfterErrorResult | Promise<AfterErrorResult>;
type AfterForgotPasswordHook = (args: {
    args?: any;
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
}) => any;
type BaseFilter = (args: {
    limit: number;
    locale?: TypedLocale;
    page: number;
    req: PayloadRequest;
    sort: string;
}) => null | Promise<null | Where> | Where;
/**
 * @deprecated Use `BaseFilter` instead.
 */
type BaseListFilter = BaseFilter;
type CollectionAdminOptions = {
    /**
     * Defines a default base filter which will be applied in the following parts of the admin panel:
     * - List View
     * - Relationship fields for internal links within the Lexical editor
     *
     * This is especially useful for plugins like multi-tenant. For example,
     * a user may have access to multiple tenants, but should only see content
     * related to the currently active or selected tenant in those places.
     */
    baseFilter?: BaseFilter;
    /**
     * @deprecated Use `baseFilter` instead. If both are defined,
     * `baseFilter` will take precedence. This property remains only
     * for backward compatibility and may be removed in a future version.
     *
     * Originally, `baseListFilter` was intended to filter only the List View
     * in the admin panel. However, base filtering is often required in other areas
     * such as internal link relationships in the Lexical editor.
     */
    baseListFilter?: BaseListFilter;
    /**
     * Custom admin components
     */
    components?: {
        afterList?: CustomComponent[];
        afterListTable?: CustomComponent[];
        beforeList?: CustomComponent[];
        beforeListTable?: CustomComponent[];
        Description?: EntityDescriptionComponent;
        /**
         * Components within the edit view
         */
        edit?: {
            /**
             * Inject custom components before the document controls
             */
            beforeDocumentControls?: CustomComponent[];
            /**
             * Inject custom components within the 3-dot menu dropdown
             */
            editMenuItems?: CustomComponent[];
            /**
             * Replaces the "Preview" button
             */
            PreviewButton?: CustomComponent;
            /**
             * Replaces the "Publish" button
             * + drafts must be enabled
             */
            PublishButton?: CustomComponent;
            /**
             * Replaces the "Save" button
             * + drafts must be disabled
             */
            SaveButton?: CustomComponent;
            /**
             * Replaces the "Save Draft" button
             * + drafts must be enabled
             * + autosave must be disabled
             */
            SaveDraftButton?: CustomComponent;
            /**
             * Replaces the "Status" section
             */
            Status?: CustomStatus;
            /**
             * Replaces the "Upload" section
             * + upload must be enabled
             */
            Upload?: CustomUpload;
        };
        listMenuItems?: CustomComponent[];
        views?: {
            /**
             * Replace, modify, or add new "document" views.
             * @link https://payloadcms.com/docs/custom-components/document-views
             */
            edit?: EditConfig;
            /**
             * Replace or modify the "list" view.
             * @link https://payloadcms.com/docs/custom-components/list-view
             */
            list?: {
                actions?: CustomComponent[];
                Component?: PayloadComponent;
            };
        };
    };
    /** Extension point to add your custom data. Available in server and client. */
    custom?: CollectionAdminCustom;
    /**
     * Default columns to show in list view
     */
    defaultColumns?: string[];
    /**
     * Custom description for collection. This will also be used as JSDoc for the generated types
     */
    description?: EntityDescription;
    /**
     * Disable the Copy To Locale button in the edit document view
     * @default false
     */
    disableCopyToLocale?: boolean;
    /**
     * Performance opt-in. If true, will use the [Select API](https://payloadcms.com/docs/queries/select) when
     * loading the list view to query only the active columns, as opposed to the entire documents.
     * If your cells require specific fields that may be unselected, such as within hooks, etc.,
     * use `forceSelect` in conjunction with this property.
     *
     * @experimental This is an experimental feature and may change in the future. Use at your own risk.
     */
    enableListViewSelectAPI?: boolean;
    enableRichTextLink?: boolean;
    enableRichTextRelationship?: boolean;
    /**
     * Function to format the URL for document links in the list view.
     * Return null to disable linking for that document.
     * Return a string to customize the link destination.
     * If not provided, uses the default admin edit URL.
     */
    formatDocURL?: (args: {
        collectionSlug: string;
        /**
         * The default URL that would normally be used for this document link.
         * You can return this as-is, modify it, or completely replace it.
         */
        defaultURL: string;
        doc: Record<string, unknown>;
        req: PayloadRequest;
        /**
         * The current view context where the link is being generated.
         * Most relevant values for document linking are 'list' and 'trash'.
         */
        viewType?: ViewTypes;
    }) => null | string;
    /**
     * Specify a navigational group for collections in the admin sidebar.
     * - Provide a string to place the entity in a custom group.
     * - Provide a record to define localized group names.
     * - Set to `false` to exclude the entity from the sidebar / dashboard without disabling its routes.
     */
    group?: false | Record<string, string> | string;
    /**
     * @description Enable grouping by a field in the list view.
     * Uses `payload.findDistinct` under the hood to populate the group-by options.
     *
     * @experimental This option is currently in beta and may change in future releases. Use at your own risk.
     */
    groupBy?: boolean;
    /**
     * Exclude the collection from the admin nav and routes
     */
    hidden?: ((args: {
        user: ClientUser;
    }) => boolean) | boolean;
    /**
     * Hide the API URL within the Edit view
     */
    hideAPIURL?: boolean;
    /**
     * Additional fields to be searched via the full text search
     */
    listSearchableFields?: string[];
    /**
     * Live Preview options.
     *
     * @see https://payloadcms.com/docs/live-preview/overview
     */
    livePreview?: LivePreviewConfig;
    meta?: MetaConfig;
    pagination?: {
        defaultLimit?: number;
        limits?: number[];
    };
    /**
     * Function to generate custom preview URL
     */
    preview?: GeneratePreviewURL;
    /**
     * Field to use as title in Edit View and first column in List view
     */
    useAsTitle?: string;
};
/** Manage all aspects of a data collection */
type CollectionConfig<TSlug extends CollectionSlug = any> = {
    /**
     * Do not set this property manually. This is set to true during sanitization, to avoid
     * sanitizing the same collection multiple times.
     */
    _sanitized?: boolean;
    /**
     * Access control
     */
    access?: {
        admin?: ({ req }: {
            req: PayloadRequest;
        }) => boolean | Promise<boolean>;
        create?: Access;
        delete?: Access;
        read?: Access;
        readVersions?: Access;
        unlock?: Access;
        update?: Access;
    };
    /**
     * Collection admin options
     */
    admin?: CollectionAdminOptions;
    /**
     * Collection login options
     *
     * Use `true` to enable with default options
     */
    auth?: boolean | IncomingAuthType;
    /**
     * Configuration for bulk operations
     */
    /** Extension point to add your custom data. Server only. */
    custom?: CollectionCustom;
    /**
     * Used to override the default naming of the database table or collection with your using a function or string
     * @WARNING: If you change this property with existing data, you will need to handle the renaming of the table in your database or by using migrations
     */
    dbName?: DBIdentifierName;
    defaultPopulate?: IsAny$1<SelectFromCollectionSlug<TSlug>> extends true ? SelectType : SelectFromCollectionSlug<TSlug>;
    /**
     * Default field to sort by in collection list view
     */
    defaultSort?: Sort;
    /**
     * Disable the bulk edit operation for the collection in the admin panel and the API
     */
    disableBulkEdit?: boolean;
    /**
     * When true, do not show the "Duplicate" button while editing documents within this collection and prevent `duplicate` from all APIs
     */
    disableDuplicate?: boolean;
    /**
     * Opt-in to enable query presets for this collection.
     * @see https://payloadcms.com/docs/query-presets/overview
     */
    enableQueryPresets?: boolean;
    /**
     * Custom rest api endpoints, set false to disable all rest endpoints for this collection.
     */
    endpoints?: false | Omit<Endpoint, 'root'>[];
    fields: Field[];
    /**
     * Enables folders for this collection
     */
    folders?: boolean | CollectionFoldersConfiguration;
    /**
     * Specify which fields should be selected always, regardless of the `select` query which can be useful that the field exists for access control / hooks
     */
    forceSelect?: IsAny$1<SelectFromCollectionSlug<TSlug>> extends true ? SelectIncludeType : SelectFromCollectionSlug<TSlug>;
    /**
     * GraphQL configuration
     */
    graphQL?: {
        disableMutations?: true;
        disableQueries?: true;
        pluralName?: string;
        singularName?: string;
    } | false;
    /**
     * Hooks to modify Payload functionality
     */
    hooks?: {
        afterChange?: AfterChangeHook[];
        afterDelete?: AfterDeleteHook[];
        afterError?: AfterErrorHook[];
        afterForgotPassword?: AfterForgotPasswordHook[];
        afterLogin?: AfterLoginHook[];
        afterLogout?: AfterLogoutHook[];
        afterMe?: AfterMeHook[];
        afterOperation?: AfterOperationHook<TSlug>[];
        afterRead?: AfterReadHook[];
        afterRefresh?: AfterRefreshHook[];
        beforeChange?: BeforeChangeHook[];
        beforeDelete?: BeforeDeleteHook[];
        beforeLogin?: BeforeLoginHook[];
        beforeOperation?: BeforeOperationHook<TSlug>[];
        beforeRead?: BeforeReadHook[];
        beforeValidate?: BeforeValidateHook[];
        /**
        /**
         * Use the `me` hook to control the `me` operation.
         * Here, you can optionally instruct the me operation to return early,
         * and skip its default logic.
         */
        me?: MeHook[];
        /**
         * Use the `refresh` hook to control the refresh operation.
         * Here, you can optionally instruct the refresh operation to return early,
         * and skip its default logic.
         */
        refresh?: RefreshHook[];
    };
    /**
     * Define compound indexes for this collection.
     * This can be used to either speed up querying/sorting by 2 or more fields at the same time or
     * to ensure uniqueness between several fields.
     * Specify field paths
     * @example
     * [{ unique: true, fields: ['title', 'group.name'] }]
     * @default []
     */
    indexes?: CompoundIndex[];
    /**
     * Label configuration
     */
    labels?: {
        plural?: LabelFunction | StaticLabel;
        singular?: LabelFunction | StaticLabel;
    };
    /**
     * Enables / Disables the ability to lock documents while editing
     * @default true
     */
    lockDocuments?: {
        duration: number;
    } | false;
    /**
     * If true, enables custom ordering for the collection, and documents in the listView can be reordered via drag and drop.
     * New documents are inserted at the end of the list according to this parameter.
     *
     * Under the hood, a field with {@link https://observablehq.com/@dgreensp/implementing-fractional-indexing|fractional indexing} is used to optimize inserts and reorderings.
     *
     * @default false
     *
     * @experimental There may be frequent breaking changes to this API
     */
    orderable?: boolean;
    slug: string;
    /**
     * Add `createdAt`, `deletedAt` and `updatedAt` fields
     *
     * @default true
     */
    timestamps?: boolean;
    /**
     * Enables trash support for this collection.
     *
     * When enabled, documents will include a `deletedAt` timestamp field.
     * This allows documents to be marked as deleted without being permanently removed.
     * The `deletedAt` field will be set to the current date and time when a document is trashed.
     *
     * @experimental This is a beta feature and its behavior may be refined in future releases.
     * @default false
     */
    trash?: boolean;
    /**
     * Options used in typescript generation
     */
    typescript?: {
        /**
         * Typescript generation name given to the interface type
         */
        interface?: string;
    };
    /**
     * Customize the handling of incoming file uploads
     *
     * @default false // disable uploads
     */
    upload?: boolean | UploadConfig;
    /**
     * Enable versioning. Set it to true to enable default versions settings,
     * or customize versions options by setting the property equal to an object
     * containing the version options.
     *
     * @default false // disable versioning
     */
    versions?: boolean | IncomingCollectionVersions;
};
type SanitizedJoin = {
    /**
     * The field configuration defining the join
     */
    field: JoinField;
    getForeignPath?(args: {
        locale?: TypedLocale;
    }): string;
    /**
     * The path of the join field in dot notation
     */
    joinPath: string;
    /**
     * `parentIsLocalized` is true if any parent field of the
     * field configuration defining the join is localized
     */
    parentIsLocalized: boolean;
    targetField: RelationshipField | UploadField;
};
type SanitizedJoins = {
    [collectionSlug: string]: SanitizedJoin[];
};
/**
 * @todo remove the `DeepRequired` in v4.
 * We don't actually guarantee that all properties are set when sanitizing configs.
 */
interface SanitizedCollectionConfig extends Omit<DeepRequired<CollectionConfig>, 'admin' | 'auth' | 'endpoints' | 'fields' | 'folders' | 'slug' | 'upload' | 'versions'> {
    admin: CollectionAdminOptions;
    auth: Auth;
    endpoints: Endpoint[] | false;
    fields: Field[];
    /**
     * Fields in the database schema structure
     * Rows / collapsible / tabs w/o name `fields` merged to top, UIs are excluded
     */
    flattenedFields: FlattenedField$1[];
    /**
     * Object of collections to join 'Join Fields object keyed by collection
     */
    folders: CollectionFoldersConfiguration | false;
    joins: SanitizedJoins;
    /**
     * List of all polymorphic join fields
     */
    polymorphicJoins: SanitizedJoin[];
    sanitizedIndexes: SanitizedCompoundIndex[];
    slug: CollectionSlug;
    upload: SanitizedUploadConfig;
    versions?: SanitizedCollectionVersions;
}
type Collection = {
    config: SanitizedCollectionConfig;
    customIDType?: 'number' | 'text';
    graphQL?: {
        countType: GraphQLObjectType;
        JWT: GraphQLObjectType;
        mutationInputType: GraphQLNonNull<any>;
        paginatedType: GraphQLObjectType;
        type: GraphQLObjectType;
        updateMutationInputType: GraphQLNonNull<any>;
        versionType: GraphQLObjectType;
        whereInputType: GraphQLInputObjectType;
    };
};
type BulkOperationResult<TSlug extends CollectionSlug, TSelect extends SelectType> = {
    docs: TransformCollectionWithSelect<TSlug, TSelect>[];
    errors: {
        id: DataFromCollectionSlug<TSlug>['id'];
        isPublic: boolean;
        message: string;
    }[];
};
type AuthCollection = {
    config: SanitizedCollectionConfig;
};
type TypeWithID = {
    id: number | string;
};
type TypeWithTimestamps = {
    [key: string]: unknown;
    createdAt: string;
    deletedAt?: null | string;
    id: number | string;
    updatedAt: string;
};
type CompoundIndex = {
    fields: string[];
    unique?: boolean;
};
type SanitizedCompoundIndex = {
    fields: {
        field: FlattenedField$1;
        localizedPath: string;
        path: string;
        pathHasLocalized: boolean;
    }[];
    unique: boolean;
};

declare const validOperators: readonly ["equals", "contains", "not_equals", "in", "all", "not_in", "exists", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "like", "not_like", "within", "intersects", "near"];
type Operator = (typeof validOperators)[number];

type CustomPayloadRequestProperties = {
    context: RequestContext;
    /** The locale that should be used for a field when it is not translated to the requested locale */
    fallbackLocale?: TypedFallbackLocale;
    i18n: I18n;
    /**
     * The requested locale if specified
     * Only available for localized collections
     *
     * Suppressing warning below as it is a valid use case - won't be an issue if generated types exist
     */
    locale?: 'all' | TypedLocale;
    /**
     * The payload object
     */
    payload: typeof initialized;
    /**
     * The context in which the request is being made
     */
    payloadAPI: 'GraphQL' | 'local' | 'REST';
    /** Optimized document loader */
    payloadDataLoader: {
        /**
         * Wraps `payload.find` with a cache to deduplicate requests
         * @experimental This is may be replaced by a more robust cache strategy in future versions
         * By calling this method with the same arguments many times in one request, it will only be handled one time
         * const result = await req.payloadDataLoader.find({
         *  collection,
         *  req,
         *  where: findWhere,
         * })
         */
        find: Payload['find'];
    } & DataLoader<string, TypeWithID>;
    /** Resized versions of the image that was uploaded during this request */
    payloadUploadSizes?: Record<string, Buffer>;
    /** Query params on the request */
    query: Record<string, unknown>;
    /** Any response headers that are required to be set when a response is sent */
    responseHeaders?: Headers;
    /** The route parameters
     * @example
     * /:collection/:id -> /posts/123
     * { collection: 'posts', id: '123' }
     */
    routeParams?: Record<string, unknown>;
    /** Translate function - duplicate of i18n.t */
    t: TFunction;
    /**
     * Identifier for the database transaction for interactions in a single, all-or-nothing operation.
     * Can also be used to ensure consistency when multiple operations try to create a transaction concurrently on the same request.
     */
    transactionID?: number | Promise<number | string> | string;
    /**
     * Used to ensure consistency when multiple operations try to create a transaction concurrently on the same request
     * @deprecated This is not used anywhere, instead `transactionID` is used for the above. Will be removed in next major version.
     */
    transactionIDPromise?: Promise<void>;
    /** The signed-in user */
    user: null | TypedUser;
} & Pick<URL, 'hash' | 'host' | 'href' | 'origin' | 'pathname' | 'port' | 'protocol' | 'search' | 'searchParams'>;
type PayloadRequestData = {
    /**
     * Data from the request body
     *
     * Within Payload operations, i.e. hooks, data will be there
     * BUT in custom endpoints it will not be, you will need to
     * use either:
     *  1. `const data = await req.json()`
     *
     *  2. import { addDataAndFileToRequest } from 'payload'
     *    `await addDataAndFileToRequest(req)`
     *
     * You should not expect this object to be the document data. It is the request data.
     * */
    data?: JsonObject;
    /** The file on the request, same rules apply as the `data` property */
    file?: {
        /**
         * Context of the file when it was uploaded via client side.
         */
        clientUploadContext?: unknown;
        data: Buffer;
        mimetype: string;
        name: string;
        size: number;
        tempFilePath?: string;
    };
};
interface PayloadRequest extends CustomPayloadRequestProperties, Partial<Request>, PayloadRequestData {
    headers: Request['headers'];
}

type JsonValue = JsonArray | JsonObject | unknown;
type JsonArray = Array<JsonValue>;
interface JsonObject {
    [key: string]: any;
}
type WhereField = {
    [key in Operator]?: JsonValue;
};
type Where = {
    [key: string]: Where[] | WhereField;
    and?: Where[];
    or?: Where[];
};
type Sort = Array<string> | string;
type SerializableValue = boolean | number | object | string;
type DefaultValue = ((args: {
    locale?: TypedLocale;
    req: PayloadRequest;
    user: PayloadRequest['user'];
}) => SerializableValue) | SerializableValue;
/**
 * Applies pagination for join fields for including collection relationships
 */
type JoinQuery<TSlug extends CollectionSlug = string> = TypedCollectionJoins[TSlug] extends Record<string, string> ? false | Partial<{
    [K in keyof TypedCollectionJoins[TSlug]]: {
        count?: boolean;
        limit?: number;
        page?: number;
        sort?: string;
        where?: Where;
    } | false;
}> : never;
type Document = any;
type Operation = 'create' | 'delete' | 'read' | 'update';
type VersionOperations = 'readVersions';
type AuthOperations = 'unlock';
type AllOperations = AuthOperations | Operation | VersionOperations;
declare function docHasTimestamps(doc: any): doc is TypeWithTimestamps;
type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
type IsAny<T> = IfAny<T, true, false>;
type ReplaceAny<T, DefaultType> = IsAny<T> extends true ? DefaultType : T;
type SelectIncludeType = {
    [k: string]: SelectIncludeType | true;
};
type SelectExcludeType = {
    [k: string]: false | SelectExcludeType;
};
type SelectMode = 'exclude' | 'include';
type SelectType = SelectExcludeType | SelectIncludeType;
type ApplyDisableErrors<T, DisableErrors = false> = false extends DisableErrors ? T : null | T;
type TransformDataWithSelect<Data extends Record<string, any>, Select extends SelectType> = Select extends never ? Data : string extends keyof Select ? Data : string extends keyof Omit<Data, 'id'> ? Select extends SelectIncludeType ? {
    [K in Data extends TypeWithID ? 'id' | keyof Select : keyof Select]: K extends 'id' ? number | string : unknown;
} : Data : Select extends SelectIncludeType ? {
    [K in keyof Data as K extends keyof Select ? Select[K] extends object | true ? K : never : K extends 'id' ? K : never]: Data[K];
} : {
    [K in keyof Data as K extends keyof Select ? Select[K] extends object | undefined ? K : never : K]: Data[K];
};
type TransformCollectionWithSelect<TSlug extends CollectionSlug, TSelect extends SelectType> = TSelect extends SelectType ? TransformDataWithSelect<DataFromCollectionSlug<TSlug>, TSelect> : DataFromCollectionSlug<TSlug>;
type DraftTransformCollectionWithSelect<TSlug extends CollectionSlug, TSelect extends SelectType> = TSelect extends SelectType ? TransformDataWithSelect<QueryDraftDataFromCollectionSlug<TSlug>, TSelect> : QueryDraftDataFromCollectionSlug<TSlug>;
type TransformGlobalWithSelect<TSlug extends GlobalSlug, TSelect extends SelectType> = TSelect extends SelectType ? TransformDataWithSelect<DataFromGlobalSlug<TSlug>, TSelect> : DataFromGlobalSlug<TSlug>;
type PopulateType = Partial<TypedCollectionSelect>;
type ResolvedFilterOptions = {
    [collection: string]: Where;
};
type PickPreserveOptional<T, K extends keyof T> = Partial<Pick<T, Extract<K, OptionalKeys<T>>>> & Pick<T, Extract<K, RequiredKeys<T>>>;
type MaybePromise<T> = Promise<T> | T;

type JobRunStatus = 'error' | 'error-reached-max-retries' | 'success';
type RunJobResult = {
    status: JobRunStatus;
};

type RunJobsArgs = {
    /**
     * If you want to run jobs from all queues, set this to true.
     * If you set this to true, the `queue` property will be ignored.
     *
     * @default false
     */
    allQueues?: boolean;
    /**
     * ID of the job to run
     */
    id?: number | string;
    /**
     * The maximum number of jobs to run in this invocation
     *
     * @default 10
     */
    limit?: number;
    overrideAccess?: boolean;
    /**
     * Adjust the job processing order
     *
     * FIFO would equal `createdAt` and LIFO would equal `-createdAt`.
     *
     * @default all jobs for all queues will be executed in FIFO order.
     */
    processingOrder?: Sort;
    /**
     * If you want to run jobs from a specific queue, set this to the queue name.
     *
     * @default jobs from the `default` queue will be executed.
     */
    queue?: string;
    req: PayloadRequest;
    /**
     * By default, jobs are run in parallel.
     * If you want to run them in sequence, set this to true.
     */
    sequential?: boolean;
    /**
     * If set to true, the job system will not log any output to the console (for both info and error logs).
     * Can be an option for more granular control over logging.
     *
     * This will not automatically affect user-configured logs (e.g. if you call `console.log` or `payload.logger.info` in your job code).
     *
     * @default false
     */
    silent?: RunJobsSilent;
    where?: Where;
};
type RunJobsResult = {
    jobStatus?: Record<string, RunJobResult>;
    /**
     * If this is true, there for sure are no jobs remaining, regardless of the limit
     */
    noJobsRemaining?: boolean;
    /**
     * Out of the jobs that were queried & processed (within the set limit), how many are remaining and retryable?
     */
    remainingJobsFromQueried: number;
};
declare const runJobs: (args: RunJobsArgs) => Promise<RunJobsResult>;

type AuthArgs = {
    /**
     * Specify if it's possible for auth strategies to set headers within this operation.
     */
    canSetHeaders?: boolean;
    headers: Request['headers'];
    req?: Omit<PayloadRequest, 'user'>;
};
type AuthResult = {
    permissions: SanitizedPermissions;
    responseHeaders?: Headers;
    user: null | TypedUser;
};

type Options$i<T extends CollectionSlug> = {
    collection: T;
    context?: RequestContext;
    data: {
        email: string;
    };
    disableEmail?: boolean;
    expiration?: number;
    req?: Partial<PayloadRequest>;
};

type Options$h<TSlug extends CollectionSlug> = {
    collection: TSlug;
    context?: RequestContext;
    data: AuthOperationsFromCollectionSlug<TSlug>['login'];
    depth?: number;
    fallbackLocale?: string;
    locale?: string;
    overrideAccess?: boolean;
    req?: Partial<PayloadRequest>;
    showHiddenFields?: boolean;
    trash?: boolean;
};

type Options$g<T extends CollectionSlug> = {
    collection: T;
    context?: RequestContext;
    data: {
        password: string;
        token: string;
    };
    overrideAccess: boolean;
    req?: Partial<PayloadRequest>;
};

type Options$f<TSlug extends CollectionSlug> = {
    collection: TSlug;
    context?: RequestContext;
    data: AuthOperationsFromCollectionSlug<TSlug>['unlock'];
    overrideAccess: boolean;
    req?: Partial<PayloadRequest>;
};

type Options$e<T extends CollectionSlug> = {
    collection: T;
    context?: RequestContext;
    req?: Partial<PayloadRequest>;
    token: string;
};

type Options$d<TSlug extends CollectionSlug> = {
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * When set to `true`, errors will not be thrown.
     */
    disableErrors?: boolean;
    /**
     *  Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * When set to `true`, the query will include both normal and trashed documents.
     * To query only trashed documents, pass `trash: true` and combine with a `where` clause filtering by `deletedAt`.
     * By default (`false`), the query will only include normal documents and exclude those with a `deletedAt` field.
     *
     * This argument has no effect unless `trash` is enabled on the collection.
     * @default false
     */
    trash?: boolean;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
    /**
     * A filter [query](https://payloadcms.com/docs/queries/overview)
     */
    where?: Where;
};

type BaseOptions$2<TSlug extends CollectionSlug, TSelect extends SelectType> = {
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * When set to `true`, a [database transactions](https://payloadcms.com/docs/database/transactions) will not be initialized.
     * @default false
     */
    disableTransaction?: boolean;
    /**
     * If creating verification-enabled auth doc,
     * you can disable the email that is auto-sent
     */
    disableVerificationEmail?: boolean;
    /**
     * If you want to create a document that is a duplicate of another document
     */
    duplicateFromID?: DataFromCollectionSlug<TSlug>['id'];
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale;
    /**
     * A `File` object when creating a collection with `upload: true`.
     */
    file?: File$1;
    /**
     * A file path when creating a collection with `upload: true`.
     */
    filePath?: string;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * If you are uploading a file and would like to replace
     * the existing file instead of generating a new filename,
     * you can set the following property to `true`
     */
    overwriteExistingFiles?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: TSelect;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
};
type Options$c<TSlug extends CollectionSlug, TSelect extends SelectType> = ({
    /**
     * The data for the document to create.
     */
    data: RequiredDataFromCollectionSlug<TSlug>;
    /**
     * Create a **draft** document. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
     */
    draft?: false;
} & BaseOptions$2<TSlug, TSelect>) | ({
    /**
     * The data for the document to create.
     * When creating a draft, required fields are optional as validation is skipped by default.
     */
    data: DraftDataFromCollectionSlug<TSlug>;
    /**
     * Create a **draft** document. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
     */
    draft: true;
} & BaseOptions$2<TSlug, TSelect>);

type BaseOptions$1<TSlug extends CollectionSlug, TSelect extends SelectType> = {
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * When set to `true`, a [database transactions](https://payloadcms.com/docs/database/transactions) will not be initialized.
     * @default false
     */
    disableTransaction?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * By default, document locks are ignored (`true`). Set to `false` to enforce locks and prevent operations when a document is locked by another user. [More details](https://payloadcms.com/docs/admin/locked-documents).
     * @default true
     */
    overrideLock?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: TSelect;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * When set to `true`, the operation will permanently delete both normal and trashed documents.
     * By default (`false`), only normal (non-trashed) documents will be permanently deleted.
     *
     * This argument has no effect unless `trash` is enabled on the collection.
     * @default false
     */
    trash?: boolean;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
};
type ByIDOptions$1<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>> = {
    /**
     * The ID of the document to delete.
     */
    id: number | string;
    /**
     * A filter [query](https://payloadcms.com/docs/queries/overview)
     */
    where?: never;
} & BaseOptions$1<TSlug, TSelect>;
type ManyOptions$1<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>> = {
    /**
     * The ID of the document to delete.
     */
    id?: never;
    /**
     * A filter [query](https://payloadcms.com/docs/queries/overview)
     */
    where: Where;
} & BaseOptions$1<TSlug, TSelect>;

type Options$b<TSlug extends CollectionSlug, TSelect extends SelectType> = {
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * Override the data for the document to duplicate.
     */
    data?: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * When set to `true`, a [database transactions](https://payloadcms.com/docs/database/transactions) will not be initialized.
     * @default false
     */
    disableTransaction?: boolean;
    /**
     * Create a **draft** document. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
     */
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale;
    /**
     * The ID of the document to duplicate from.
     */
    id: number | string;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: TSelect;
    /**
     * Specifies which locales to include when duplicating localized fields. Non-localized data is always duplicated.
     * By default, all locales are duplicated.
     */
    selectedLocales?: string[];
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
};

type Options$a<TSlug extends CollectionSlug, TSelect extends SelectType> = {
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * The current population depth, used internally for relationships population.
     * @internal
     */
    currentDepth?: number;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * When set to `true`, errors will not be thrown.
     */
    disableErrors?: boolean;
    /**
     * Whether the documents should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
     */
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: TypedFallbackLocale;
    /**
     * Include info about the lock status to the result into all documents with fields: `_isLocked` and `_userEditing`
     */
    includeLockStatus?: boolean;
    /**
     * The [Join Field Query](https://payloadcms.com/docs/fields/join#query-options).
     * Pass `false` to disable all join fields from the result.
     */
    joins?: JoinQuery<TSlug>;
    /**
     * The maximum related documents to be returned.
     * Defaults unless `defaultLimit` is specified for the collection config
     * @default 10
     */
    limit?: number;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: 'all' | TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * Get a specific page number
     * @default 1
     */
    page?: number;
    /**
     * Set to `false` to return all documents and avoid querying for document counts which introduces some overhead.
     * You can also combine that property with a specified `limit` to limit documents but avoid the count query.
     */
    pagination?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: TSelect;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * Sort the documents, can be a string or an array of strings
     * @example '-createdAt' // Sort DESC by createdAt
     * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
     */
    sort?: Sort;
    /**
     * When set to `true`, the query will include both normal and trashed documents.
     * To query only trashed documents, pass `trash: true` and combine with a `where` clause filtering by `deletedAt`.
     * By default (`false`), the query will only include normal documents and exclude those with a `deletedAt` field.
     *
     * This argument has no effect unless `trash` is enabled on the collection.
     * @default false
     */
    trash?: boolean;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
    /**
     * A filter [query](https://payloadcms.com/docs/queries/overview)
     */
    where?: Where;
};

type Options$9<TSlug extends CollectionSlug, TDisableErrors extends boolean, TSelect extends SelectType> = {
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * The current population depth, used internally for relationships population.
     * @internal
     */
    currentDepth?: number;
    /**
     * You may pass the document data directly which will skip the `db.findOne` database query.
     * This is useful if you want to use this endpoint solely for running hooks and populating data.
     */
    data?: Record<string, unknown>;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * When set to `true`, errors will not be thrown.
     * `null` will be returned instead, if the document on this ID was not found.
     */
    disableErrors?: TDisableErrors;
    /**
     * Whether the document should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
     */
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: TypedFallbackLocale;
    /**
     * The ID of the document to find.
     */
    id: number | string;
    /**
     * Include info about the lock status to the result with fields: `_isLocked` and `_userEditing`
     */
    includeLockStatus?: boolean;
    /**
     * The [Join Field Query](https://payloadcms.com/docs/fields/join#query-options).
     * Pass `false` to disable all join fields from the result.
     */
    joins?: JoinQuery<TSlug>;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: 'all' | TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: TSelect;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * When set to `true`, the operation will return a document by ID, even if it is trashed (soft-deleted).
     * By default (`false`), the operation will exclude trashed documents.
     * To fetch a trashed document, set `trash: true`.
     *
     * This argument has no effect unless `trash` is enabled on the collection.
     * @default false
     */
    trash?: boolean;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
} & Pick<FindByIDArgs, 'flattenLocales'>;

type Options$8<TSlug extends CollectionSlug, TField extends keyof DataFromCollectionSlug<TSlug>> = {
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * When set to `true`, errors will not be thrown.
     */
    disableErrors?: boolean;
    /**
     * The field to get distinct values for
     */
    field: ({} & string) | TField;
    /**
     * The maximum distinct field values to be returned.
     * By default the operation returns all the values.
     */
    limit?: number;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: 'all' | TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * Get a specific page number (if limit is specified)
     * @default 1
     */
    page?: number;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * Sort the documents, can be a string or an array of strings
     * @example '-createdAt' // Sort DESC by createdAt
     * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
     */
    sort?: Sort;
    /**
     * When set to `true`, the query will include both normal and trashed documents.
     * To query only trashed documents, pass `trash: true` and combine with a `where` clause filtering by `deletedAt`.
     * By default (`false`), the query will only include normal documents and exclude those with a `deletedAt` field.
     *
     * This argument has no effect unless `trash` is enabled on the collection.
     * @default false
     */
    trash?: boolean;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
    /**
     * A filter [query](https://payloadcms.com/docs/queries/overview)
     */
    where?: Where;
};

type Options$7<TSlug extends CollectionSlug> = {
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * When set to `true`, errors will not be thrown.
     * `null` will be returned instead, if the document on this ID was not found.
     */
    disableErrors?: boolean;
    /**
     * Whether the document should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
     */
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale;
    /**
     * The ID of the version to find.
     */
    id: string;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: 'all' | TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: SelectType;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * When set to `true`, the operation will return a document by ID, even if it is trashed (soft-deleted).
     * By default (`false`), the operation will exclude trashed documents.
     * To fetch a trashed document, set `trash: true`.
     *
     * This argument has no effect unless `trash` is enabled on the collection.
     * @default false
     */
    trash?: boolean;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
};

type Options$6<TSlug extends CollectionSlug> = {
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * Whether the documents should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
     */
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale;
    /**
     * The maximum related documents to be returned.
     * Defaults unless `defaultLimit` is specified for the collection config
     * @default 10
     */
    limit?: number;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: 'all' | TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * Get a specific page number
     * @default 1
     */
    page?: number;
    /**
     * Set to `false` to return all documents and avoid querying for document counts which introduces some overhead.
     * You can also combine that property with a specified `limit` to limit documents but avoid the count query.
     */
    pagination?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: SelectType;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * Sort the documents, can be a string or an array of strings
     * @example '-version.createdAt' // Sort DESC by createdAt
     * @example ['version.group', '-version.createdAt'] // sort by 2 fields, ASC group and DESC createdAt
     */
    sort?: Sort;
    /**
     * When set to `true`, the query will include both normal and trashed (soft-deleted) documents.
     * To query only trashed documents, pass `trash: true` and combine with a `where` clause filtering by `deletedAt`.
     * By default (`false`), the query will only include normal documents and exclude those with a `deletedAt` field.
     *
     * This argument has no effect unless `trash` is enabled on the collection.
     * @default false
     */
    trash?: boolean;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
    /**
     * A filter [query](https://payloadcms.com/docs/queries/overview)
     */
    where?: Where;
};

type Options$5<TSlug extends CollectionSlug> = {
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * Whether the document should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
     */
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale;
    /**
     * The ID of the version to restore.
     */
    id: string;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: SelectType;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
};

type BaseOptions<TSlug extends CollectionSlug, TSelect extends SelectType> = {
    /**
     * Whether the current update should be marked as from autosave.
     * `versions.drafts.autosave` should be specified.
     */
    autosave?: boolean;
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * The document / documents data to update.
     */
    data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * When set to `true`, a [database transactions](https://payloadcms.com/docs/database/transactions) will not be initialized.
     * @default false
     */
    disableTransaction?: boolean;
    /**
     * Update documents to a draft.
     */
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale;
    /**
     * A `File` object when updating a collection with `upload: true`.
     */
    file?: File$1;
    /**
     * A file path when creating a collection with `upload: true`.
     */
    filePath?: string;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * By default, document locks are ignored (`true`). Set to `false` to enforce locks and prevent operations when a document is locked by another user. [More details](https://payloadcms.com/docs/admin/locked-documents).
     * @default true
     */
    overrideLock?: boolean;
    /**
     * If you are uploading a file and would like to replace
     * the existing file instead of generating a new filename,
     * you can set the following property to `true`
     */
    overwriteExistingFiles?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * Publish the document / documents with a specific locale.
     */
    publishSpecificLocale?: string;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: TSelect;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * When set to `true`, the operation will update both normal and trashed (soft-deleted) documents.
     * To update only trashed documents, pass `trash: true` and combine with a `where` clause filtering by `deletedAt`.
     * By default (`false`), the update will only include normal documents and exclude those with a `deletedAt` field.
     * @default false
     */
    trash?: boolean;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
};
type ByIDOptions<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>> = {
    /**
     * The ID of the document to update.
     */
    id: number | string;
    /**
     * Limit documents to update
     */
    limit?: never;
    /**
     * Sort the documents, can be a string or an array of strings
     * @example '-createdAt' // Sort DESC by createdAt
     * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
     */
    sort?: never;
    /**
     * A filter [query](https://payloadcms.com/docs/queries/overview)
     */
    where?: never;
} & BaseOptions<TSlug, TSelect>;
type ManyOptions<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>> = {
    /**
     * The ID of the document to update.
     */
    id?: never;
    /**
     * Limit documents to update
     */
    limit?: number;
    /**
     * Sort the documents, can be a string or an array of strings
     * @example '-createdAt' // Sort DESC by createdAt
     * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
     */
    sort?: Sort;
    /**
     * A filter [query](https://payloadcms.com/docs/queries/overview)
     */
    where: Where;
} & BaseOptions<TSlug, TSelect>;

type CountGlobalVersionsOptions<TSlug extends GlobalSlug> = {
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * When set to `true`, errors will not be thrown.
     */
    disableErrors?: boolean;
    /**
     * the Global slug to operate against.
     */
    global: TSlug;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
    /**
     * A filter [query](https://payloadcms.com/docs/queries/overview)
     */
    where?: Where;
};

type GlobalFindOneArgs = {
    /**
     * You may pass the document data directly which will skip the `db.findOne` database query.
     * This is useful if you want to use this endpoint solely for running hooks and populating data.
     */
    data?: Record<string, unknown>;
    depth?: number;
    draft?: boolean;
    globalConfig: SanitizedGlobalConfig;
    includeLockStatus?: boolean;
    overrideAccess?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    slug: string;
} & Pick<AfterReadArgs<JsonObject>, 'flattenLocales'>;
declare const findOneOperation: <T extends Record<string, unknown>>(args: GlobalFindOneArgs) => Promise<T>;

type Options$4<TSlug extends GlobalSlug, TSelect extends SelectType> = {
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * You may pass the document data directly which will skip the `db.findOne` database query.
     * This is useful if you want to use this endpoint solely for running hooks and populating data.
     */
    data?: Record<string, unknown>;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * Whether the document should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
     */
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: TypedFallbackLocale;
    /**
     * Include info about the lock status to the result with fields: `_isLocked` and `_userEditing`
     */
    includeLockStatus?: boolean;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: 'all' | TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: TSelect;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * the Global slug to operate against.
     */
    slug: TSlug;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
} & Pick<GlobalFindOneArgs, 'flattenLocales'>;

type Options$3<TSlug extends GlobalSlug> = {
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * When set to `true`, errors will not be thrown.
     * `null` will be returned instead, if the document on this ID was not found.
     */
    disableErrors?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale;
    /**
     * The ID of the version to find.
     */
    id: number | string;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: 'all' | TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: SelectType;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * the Global slug to operate against.
     */
    slug: TSlug;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
};

type Options$2<TSlug extends GlobalSlug> = {
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale;
    /**
     * The maximum related documents to be returned.
     * Defaults unless `defaultLimit` is specified for the collection config
     * @default 10
     */
    limit?: number;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: 'all' | TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * Get a specific page number
     * @default 1
     */
    page?: number;
    /**
     * Set to `false` to return all documents and avoid querying for document counts which introduces some overhead.
     * You can also combine that property with a specified `limit` to limit documents but avoid the count query.
     */
    pagination?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: SelectType;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * the Global slug to operate against.
     */
    slug: TSlug;
    /**
     * Sort the documents, can be a string or an array of strings
     * @example '-version.createdAt' // Sort DESC by createdAt
     * @example ['version.group', '-version.createdAt'] // sort by 2 fields, ASC group and DESC createdAt
     */
    sort?: Sort;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
    /**
     * A filter [query](https://payloadcms.com/docs/queries/overview)
     */
    where?: Where;
};

type Options$1<TSlug extends GlobalSlug> = {
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale;
    /**
     * The ID of the version to restore.
     */
    id: string;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * the Global slug to operate against.
     */
    slug: TSlug;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
};

type Options<TSlug extends GlobalSlug, TSelect extends SelectType> = {
    /**
     * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
     * which can be read by hooks. Useful if you want to pass additional information to the hooks which
     * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
     * to determine if it should run or not.
     */
    context?: RequestContext;
    /**
     * The global data to update.
     */
    data: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * Update documents to a draft.
     */
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: 'all' | TypedLocale;
    /**
     * Skip access control.
     * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
     * @default true
     */
    overrideAccess?: boolean;
    /**
     * If you are uploading a file and would like to replace
     * the existing file instead of generating a new filename,
     * you can set the following property to `true`
     */
    overrideLock?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType;
    /**
     * Publish the document / documents with a specific locale.
     */
    publishSpecificLocale?: TypedLocale;
    /**
     * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
     * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
     */
    req?: Partial<PayloadRequest>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: TSelect;
    /**
     * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
     * @default false
     */
    showHiddenFields?: boolean;
    /**
     * the Global slug to operate against.
     */
    slug: TSlug;
    /**
     * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
     */
    user?: Document;
};

// Generated by dts-bundle-generator v9.5.1

type CatchCallbackFn = (e: unknown, job: Cron) => void;
type ProtectCallbackFn = (job: Cron) => void;
/**
 * Options for configuring cron jobs.
 *
 * @interface
 */
interface CronOptions {
	/**
	 * The name of the cron job. If provided, the job will be added to the
	 * `scheduledJobs` array, allowing it to be accessed by name.
	 */
	name?: string;
	/**
	 * If true, the job will be paused initially.
	 * @default false
	 */
	paused?: boolean;
	/**
	 * If true, the job will be stopped permanently.
	 * @default false
	 */
	kill?: boolean;
	/**
	 * If true, errors thrown by the job function will be caught.
	 * If a function is provided, it will be called with the error and the job instance.
	 * @default false
	 */
	catch?: boolean | CatchCallbackFn;
	/**
	 * If true, the underlying timer will be unreferenced, allowing the Node.js
	 * process to exit even if the job is still running.
	 * @default false
	 */
	unref?: boolean;
	/**
	 * The maximum number of times the job will run.
	 * @default Infinity
	 */
	maxRuns?: number;
	/**
	 * The minimum interval between job executions, in seconds.
	 * @default 1
	 */
	interval?: number;
	/**
	 * If true, prevents the job from running if the previous execution is still in progress.
	 * If a function is provided, it will be called if the job is blocked.
	 * @default false
	 */
	protect?: boolean | ProtectCallbackFn;
	/**
	 * The date and time at which the job should start running.
	 */
	startAt?: string | Date | CronDate;
	/**
	 * The date and time at which the job should stop running.
	 */
	stopAt?: string | Date | CronDate;
	/**
	 * The timezone for the cron job.
	 */
	timezone?: string;
	/**
	 * The UTC offset for the cron job, in minutes.
	 */
	utcOffset?: number;
	/**
	 * If true, enables legacy mode for compatibility with older cron implementations.
	 * @default true
	 */
	legacyMode?: boolean;
	/**
	 * An optional context object that will be passed to the job function.
	 */
	context?: unknown;
}
/**
 * Create a CronPattern instance from pattern string ('* * * * * *')
 * @constructor
 * @param {string} pattern - Input pattern
 * @param {string} timezone - Input timezone, used for '?'-substitution
 */
declare class CronPattern {
	pattern: string;
	timezone?: string;
	second: number[];
	minute: number[];
	hour: number[];
	day: number[];
	month: number[];
	dayOfWeek: number[];
	lastDayOfMonth: boolean;
	starDOM: boolean;
	starDOW: boolean;
	constructor(pattern: string, timezone?: string);
	/**
	 * Parse current pattern, will throw on any type of failure
	 * @private
	 */
	private parse;
	/**
	 * Convert current part (seconds/minutes etc) to an array of 1 or 0 depending on if the part is about to trigger a run or not.
	 */
	private partToArray;
	/**
	 * After converting JAN-DEC, SUN-SAT only 0-9 * , / - are allowed, throw if anything else pops up
	 * @throws On error
	 */
	private throwAtIllegalCharacters;
	/**
	 * Nothing but a number left, handle that
	 *
	 * @param conf Current part, expected to be a number, as a string
	 * @param type One of "seconds", "minutes" etc
	 * @param valueIndexOffset -1 for day of month, and month, as they start at 1. 0 for seconds, hours, minutes
	 */
	private handleNumber;
	/**
	 * Set a specific value for a specific part of the CronPattern.
	 *
	 * @param part The specific part of the CronPattern, e.g., "second", "minute", etc.
	 * @param index The index to modify.
	 * @param value The value to set, typically 0 or 1, in case of "nth weekday" it will be the weekday number used for further processing
	 */
	private setPart;
	/**
	 * Take care of ranges with stepping (e.g. 3-23/5)
	 *
	 * @param conf Current part, expected to be a string like 3-23/5
	 * @param type One of "seconds", "minutes" etc
	 * @param valueIndexOffset -1 for day of month, and month, as they start at 1. 0 for seconds, hours, minutes
	 */
	private handleRangeWithStepping;
	private extractNth;
	/**
	 * Take care of ranges (e.g. 1-20)
	 *
	 * @param conf - Current part, expected to be a string like 1-20, can contain L for last
	 * @param type - One of "seconds", "minutes" etc
	 * @param valueIndexOffset - -1 for day of month, and month, as they start at 1. 0 for seconds, hours, minutes
	 */
	private handleRange;
	/**
	 * Handle stepping (e.g. * / 14)
	 *
	 * @param conf Current part, expected to be a string like * /20 (without the space)
	 * @param type One of "seconds", "minutes" etc
	 */
	private handleStepping;
	/**
	 * Replace day name with day numbers
	 *
	 * @param conf Current part, expected to be a string that might contain sun,mon etc.
	 *
	 * @returns Conf with 0 instead of sun etc.
	 */
	private replaceAlphaDays;
	/**
	 * Replace month name with month numbers
	 *
	 * @param conf Current part, expected to be a string that might contain jan,feb etc.
	 *
	 * @returns conf with 0 instead of sun etc.
	 */
	private replaceAlphaMonths;
	/**
	 * Replace nicknames with actual cron patterns
	 *
	 * @param pattern Pattern, may contain nicknames, or not
	 *
	 * @returns Pattern, with cron expression insted of nicknames
	 */
	private handleNicknames;
	/**
	 * Handle the nth weekday of the month logic using hash sign (e.g. FRI#2 for the second Friday of the month)
	 *
	 * @param index Weekday, example: 5 for friday
	 * @param nthWeekday bitmask, 2 (0x00010) for 2nd friday, 31 (ANY_OCCURRENCE, 0b100000) for any day
	 */
	private setNthWeekdayOfMonth;
}
/**
 * Converts date to CronDate
 *
 * @param d Input date, if using string representation ISO 8001 (2015-11-24T19:40:00) local timezone is expected
 * @param tz String representation of target timezone in Europe/Stockholm format, or a number representing offset in minutes.
 */
declare class CronDate {
	tz: string | number | undefined;
	/**
	 * Current milliseconds
	 * @type {number}
	 */
	ms: number;
	/**
	 * Current second (0-59), in local time or target timezone specified by `this.tz`
	 * @type {number}
	 */
	second: number;
	/**
	 * Current minute (0-59), in local time or target timezone specified by `this.tz`
	 * @type {number}
	 */
	minute: number;
	/**
	 * Current hour (0-23), in local time or target timezone specified by `this.tz`
	 * @type {number}
	 */
	hour: number;
	/**
	 * Current day (1-31), in local time or target timezone specified by `this.tz`
	 * @type {number}
	 */
	day: number;
	/**
	 * Current month (1-12), in local time or target timezone specified by `this.tz`
	 * @type {number}
	 */
	month: number;
	/**
	 * Current full year, in local time or target timezone specified by `this.tz`
	 */
	year: number;
	constructor(d?: CronDate | Date | string | null, tz?: string | number);
	/**
	 * Check if the given date is the nth occurrence of a weekday in its month.
	 *
	 * @param year The year.
	 * @param month The month (0 for January, 11 for December).
	 * @param day The day of the month.
	 * @param nth The nth occurrence (bitmask).
	 *
	 * @return True if the date is the nth occurrence of its weekday, false otherwise.
	 */
	private isNthWeekdayOfMonth;
	/**
	 * Sets internals using a Date
	 */
	private fromDate;
	/**
	 * Sets internals by deep copying another CronDate
	 *
	 * @param {CronDate} d - Input date
	 */
	private fromCronDate;
	/**
	 * Reset internal parameters (seconds, minutes, hours) if any of them have exceeded (or could have exceeded) their normal ranges
	 *
	 * Will alway return true on february 29th, as that is a date that _could_ be out of bounds
	 */
	private apply;
	/**
	 * Sets internals by parsing a string
	 */
	private fromString;
	/**
	 * Find next match of current part
	 */
	private findNext;
	/**
	 * Increment to next run time recursively.
	 *
	 * This function traverses the date components (year, month, day, hour, minute, second)
	 * to find the next date and time that matches the cron pattern. It uses a recursive
	 * approach to handle the dependencies between different components. For example,
	 * if the day changes, the hour, minute, and second need to be reset.
	 *
	 * The recursion is currently limited to the year 3000 to prevent potential
	 * infinite loops or excessive stack depth. If you need to schedule beyond
	 * the year 3000, please open an issue on GitHub to discuss possible solutions.
	 *
	 * @param pattern The cron pattern used to determine the next run time.
	 * @param options The cron options that influence the incrementing behavior.
	 * @param doing The index of the `RecursionSteps` array indicating the current
	 *              date component being processed. 0 represents "month", 1 represents "day", etc.
	 *
	 * @returns This `CronDate` instance for chaining, or null if incrementing
	 *          was not possible (e.g., reached year 3000 limit or no matching date).
	 *
	 * @private
	 */
	private recurse;
	/**
	 * Increment to next run time
	 *
	 * @param pattern The pattern used to increment the current date.
	 * @param options Cron options used for incrementing.
	 * @param hasPreviousRun True if there was a previous run, false otherwise. This is used to determine whether to apply the minimum interval.
	 * @returns This CronDate instance for chaining, or null if incrementing was not possible (e.g., reached year 3000 limit).
	 */
	increment(pattern: CronPattern, options: CronOptions, hasPreviousRun: boolean): CronDate | null;
	/**
	 * Convert current state back to a javascript Date()
	 *
	 * @param internal If this is an internal call
	 */
	getDate(internal?: boolean): Date;
	/**
	 * Convert current state back to a javascript Date() and return UTC milliseconds
	 */
	getTime(): number;
}
/**
 * Callback function type
 *
 * @param self - Reference to the Cron instance that triggered the callback
 * @param context - Optional context value passed through options.context
 *
 * @returns void or Promise<void> for async callbacks
 */
type CronCallback = (self: InstanceType<typeof Cron>, context: unknown) => void | Promise<void>;
/**
 * Cron entrypoint
 *
 * @constructor
 * @param pattern - Input pattern, input date, or input ISO 8601 time string
 * @param [fnOrOptions1] - Options or function to be run each iteration of pattern
 * @param [fnOrOptions2] - Options or function to be run each iteration of pattern
 */
declare class Cron {
	name: string | undefined;
	options: CronOptions;
	private _states;
	private fn?;
	constructor(pattern: string | Date, fnOrOptions1?: CronOptions | CronCallback, fnOrOptions2?: CronOptions | CronCallback);
	/**
	 * Find next runtime, based on supplied date. Strips milliseconds.
	 *
	 * @param prev - Optional. Date to start from. Can be a CronDate, Date object, or a string representing a date.
	 * @returns The next run time as a Date object, or null if there is no next run.
	 */
	nextRun(prev?: CronDate | Date | string | null): Date | null;
	/**
	 * Find next n runs, based on supplied date. Strips milliseconds.
	 *
	 * @param n - Number of runs to enumerate
	 * @param previous - Date to start from
	 * @returns - Next n run times
	 */
	nextRuns(n: number, previous?: Date | string): Date[];
	/**
	 * Return the original pattern, if there was one
	 *
	 * @returns Original pattern
	 */
	getPattern(): string | undefined;
	/**
	 * Indicates whether or not the cron job is scheduled and running, e.g. awaiting next trigger
	 *
	 * @returns Running or not
	 */
	isRunning(): boolean;
	/**
	 * Indicates whether or not the cron job is permanently stopped
	 *
	 * @returns Running or not
	 */
	isStopped(): boolean;
	/**
	 * Indicates whether or not the cron job is currently working
	 *
	 * @returns Running or not
	 */
	isBusy(): boolean;
	/**
	 * Return current/previous run start time
	 *
	 * @returns Current (if running) or previous run time
	 */
	currentRun(): Date | null;
	/**
	 * Return previous run start time
	 *
	 * @returns Previous run time
	 */
	previousRun(): Date | null;
	/**
	 * Returns number of milliseconds to next run
	 *
	 * @param prev Starting date, defaults to now - minimum interval
	 */
	msToNext(prev?: CronDate | Date | string): number | null;
	/**
	 * Stop execution
	 *
	 * Running this will forcefully stop the job, and prevent furter exection. `.resume()` will not work after stopping.
	 * It will also be removed from the scheduledJobs array if it were named.
	 */
	stop(): void;
	/**
	 * Pause execution
	 *
	 * @returns Wether pause was successful
	 */
	pause(): boolean;
	/**
	 * Resume execution
	 *
	 * @returns Wether resume was successful
	 */
	resume(): boolean;
	/**
	 * Schedule a new job
	 *
	 * @param func - Function to be run each iteration of pattern
	 */
	schedule(func?: CronCallback): Cron;
	/**
	 * Internal function to trigger a run, used by both scheduled and manual trigger
	 */
	private _trigger;
	/**
	 * Trigger a run manually
	 */
	trigger(): Promise<void>;
	/**
	 * Returns number of runs left, undefined = unlimited
	 */
	runsLeft(): number | undefined;
	/**
	 * Called when it's time to trigger.
	 * Checks if all conditions are currently met,
	 * then instantly triggers the scheduled function.
	 */
	private _checkTrigger;
	/**
	 * Internal version of next. Cron needs millseconds internally, hence _next.
	 */
	private _next;
	/**
	 * Calculate the previous run if no previous run is supplied, but startAt and interval are set.
	 * This calculation is only necessary if the startAt time is before the current time.
	 * Should only be called from the _next function.
	 */
	private _calculatePreviousRun;
}

type KVStoreValue = NonNullable<unknown>;
interface KVAdapter {
    /**
     * Clears all entries in the store.
     * @returns A promise that resolves once the store is cleared.
     */
    clear(): Promise<void>;
    /**
     * Deletes a value from the store by its key.
     * @param key - The key to delete.
     * @returns A promise that resolves once the key is deleted.
     */
    delete(key: string): Promise<void>;
    /**
     * Retrieves a value from the store by its key.
     * @param key - The key to look up.
     * @returns A promise that resolves to the value, or `null` if not found.
     */
    get<T extends KVStoreValue>(key: string): Promise<null | T>;
    /**
     * Checks if a key exists in the store.
     * @param key - The key to check.
     * @returns A promise that resolves to `true` if the key exists, otherwise `false`.
     */
    has(key: string): Promise<boolean>;
    /**
     * Retrieves all the keys in the store.
     * @returns A promise that resolves to an array of keys.
     */
    keys(): Promise<string[]>;
    /**
     * Sets a value in the store with the given key.
     * @param key - The key to associate with the value.
     * @param value - The value to store.
     * @returns A promise that resolves once the value is stored.
     */
    set(key: string, value: KVStoreValue): Promise<void>;
}
interface KVAdapterResult {
    init(args: {
        payload: Payload;
    }): KVAdapter;
    /** Adapter can create additional collection if needed */
    kvCollection?: CollectionConfig;
}

declare function encrypt(text: string): string;
declare function decrypt(hash: string): string;

declare const accountLockFields: Field[];

declare const apiKeyFields: Field[];

declare const baseAuthFields: Field[];

declare const emailFieldConfig: EmailField;

declare const sessionsFieldConfig: ArrayField;

declare const usernameFieldConfig: TextField;

declare const verificationFields: Field[];

type OperationArgs = {
    data?: any;
    disableErrors?: boolean;
    id?: number | string;
    isReadingStaticFile?: boolean;
    req: PayloadRequest;
};
declare const executeAccess: ({ id, data, disableErrors, isReadingStaticFile, req }: OperationArgs, access: Access) => Promise<AccessResult>;

declare const executeAuthStrategies: (args: AuthStrategyFunctionArgs) => Promise<AuthStrategyResult>;

declare const extractAccessFromPermission: (hasPermission: boolean | Permission) => AccessResult;

type GetAccessResultsArgs = {
    req: PayloadRequest;
};
declare function getAccessResults({ req, }: GetAccessResultsArgs): Promise<SanitizedPermissions>;

declare const getFieldsToSign: (args: {
    collectionConfig: CollectionConfig;
    email: string;
    sid?: string;
    user: PayloadRequest["user"];
}) => Record<string, unknown>;

declare const getLoginOptions: (loginWithUsername: Auth["loginWithUsername"]) => {
    canLoginWithEmail: boolean;
    canLoginWithUsername: boolean;
};

declare const jwtSign: ({ fieldsToSign, secret, tokenExpiration, }: {
    fieldsToSign: Record<string, unknown>;
    secret: string;
    tokenExpiration: number;
}) => Promise<{
    exp: number;
    token: string;
}>;

type Arguments$9 = {
    req: PayloadRequest;
};
declare const accessOperation: (args: Arguments$9) => Promise<SanitizedPermissions>;

declare const initOperation: (args: {
    collection: string;
    req: PayloadRequest;
}) => Promise<boolean>;

type Arguments$8 = {
    allSessions?: boolean;
    collection: Collection;
    req: PayloadRequest;
};
declare const logoutOperation: (incomingArgs: Arguments$8) => Promise<boolean>;

type Arguments$7<TSlug extends CollectionSlug> = {
    collection: Collection;
    data: AuthOperationsFromCollectionSlug<TSlug>['registerFirstUser'] & RequiredDataFromCollectionSlug<TSlug>;
    req: PayloadRequest;
};
type Result<TData> = {
    exp?: number;
    token?: string;
    user?: TData;
};
declare const registerFirstUserOperation: <TSlug extends CollectionSlug>(args: Arguments$7<TSlug>) => Promise<Result<DataFromCollectionSlug<TSlug>>>;

type Args$l = {
    collection: Collection;
    req: PayloadRequest;
    token: string;
};
declare const verifyEmailOperation: (args: Args$l) => Promise<boolean>;

/**
 * Authentication strategy function for JWT tokens
 */
declare const JWTAuthentication: AuthStrategyFunction;

type Args$k = {
    collection: SanitizedCollectionConfig;
    payload: Payload;
    user: TypedUser;
};
declare const incrementLoginAttempts: ({ collection, payload, user, }: Args$k) => Promise<void>;

type Args$j = {
    collection: SanitizedCollectionConfig;
    doc: Record<string, unknown> & TypeWithID;
    payload: Payload;
    req: PayloadRequest;
};
declare const resetLoginAttempts: ({ collection, doc, payload, req, }: Args$j) => Promise<void>;

declare function genImportMapIterateFields({ addToImportMap, baseDir, config, fields, importMap, imports, }: {
    addToImportMap: AddToImportMap;
    baseDir: string;
    config: SanitizedConfig;
    fields: Block[] | Field[] | Tab[];
    importMap: InternalImportMap;
    imports: Imports;
}): void;

type Args$i = {
    config: SanitizedConfig;
    /**
     * Override the migration directory. Useful for testing when the CWD differs
     * from where the test config expects migrations to be stored.
     */
    migrationDir?: string;
    parsedArgs: ParsedArgs;
};
declare const migrate$1: ({ config, migrationDir, parsedArgs }: Args$i) => Promise<void>;

declare const getDataLoader: (req: PayloadRequest) => {
    find: Payload["find"];
} & DataLoader<string, TypeWithID, string>;
type CreateCacheKeyArgs = {
    collectionSlug: string;
    currentDepth: number;
    depth: number;
    docID: number | string;
    draft: boolean;
    fallbackLocale: TypedFallbackLocale;
    locale: string | string[];
    overrideAccess: boolean;
    populate?: PopulateType;
    select?: SelectType;
    showHiddenFields: boolean;
    transactionID: number | Promise<number | string> | string;
};
declare const createDataloaderCacheKey: ({ collectionSlug, currentDepth, depth, docID, draft, fallbackLocale, locale, overrideAccess, populate, select, showHiddenFields, transactionID, }: CreateCacheKeyArgs) => string;

type Arguments$6 = {
    collection: Collection;
    /**
     * If the document data is passed, it will be used to check access instead of fetching the document from the database.
     */
    data?: JsonObject;
    /**
     * When called for creating a new document, id is not provided.
     */
    id?: number | string;
    req: PayloadRequest;
};
declare function docAccessOperation$1(args: Arguments$6): Promise<SanitizedCollectionPermission>;

type Arguments$5<TSlug extends CollectionSlug> = {
    data?: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>;
    id: number | string;
} & Omit<Arguments$i<TSlug>, 'data' | 'duplicateFromID'>;
declare const duplicateOperation: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(incomingArgs: Arguments$5<TSlug>) => Promise<TransformCollectionWithSelect<TSlug, TSelect>>;

type Arguments$4 = {
    collection: Collection;
    currentDepth?: number;
    depth?: number;
    disableErrors?: boolean;
    disableTransaction?: boolean;
    draft?: boolean;
    id: number | string;
    overrideAccess?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
};
declare const restoreVersionOperation$1: <TData extends JsonObject & TypeWithID = JsonObject & TypeWithID>(args: Arguments$4) => Promise<TData>;

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
declare function buildConfig(config: Config): Promise<SanitizedConfig>;

/**
 * @deprecated - remove in 4.0. This is error-prone, as mutating this object will affect any objects that use the defaults as a base.
 */
declare const defaults: Omit<Config, 'db' | 'editor' | 'secret'>;

/**
 * The body of the reorder endpoint.
 * @internal
 */
type OrderableEndpointBody = {
    collectionSlug: string;
    docsToMove: string[];
    newKeyWillBe: 'greater' | 'less';
    orderableFieldName: string;
    target: {
        id: string;
        key: string;
    };
};

declare const sanitizeConfig: (incomingConfig: Config) => Promise<SanitizedConfig>;

/**
 * Combines two queries into a single query, using an AND operator
 */
declare const combineQueries: (where: Where, access: boolean | Where) => Where;

declare function createDatabaseAdapter<T extends BaseDatabaseAdapter>(args: MarkOptional<T, 'allowIDOnCreate' | 'bulkOperationsSingleTransaction' | 'createMigration' | 'migrate' | 'migrateDown' | 'migrateFresh' | 'migrateRefresh' | 'migrateReset' | 'migrateStatus' | 'migrationDir' | 'updateJobs'>): T;

/**
 * Default implementation of `beginTransaction` that returns a resolved promise of null
 */
declare function defaultBeginTransaction(): BeginTransaction;

/**
 * Take a where query and flatten it to all top-level operators
 */
declare function flattenWhereToOperators(query: Where): WhereField[];

type EntityPolicies = {
    collections?: {
        [collectionSlug: string]: CollectionPermission;
    };
    globals?: {
        [globalSlug: string]: GlobalPermission;
    };
};
type PathToQuery = {
    collectionSlug?: string;
    complete: boolean;
    field: FlattenedField$1;
    fields?: FlattenedField$1[];
    globalSlug?: string;
    invalid?: boolean;
    /**
     * @todo make required in v4.0
     */
    parentIsLocalized: boolean;
    path: string;
};

declare function getLocalizedPaths({ collectionSlug, fields, globalSlug, incomingPath, locale, overrideAccess, parentIsLocalized, payload, }: {
    collectionSlug?: string;
    fields: FlattenedField$1[];
    globalSlug?: string;
    incomingPath: string;
    locale?: string;
    overrideAccess?: boolean;
    /**
     * @todo make required in v4.0. Usually, you'd wanna pass this through
     */
    parentIsLocalized?: boolean;
    payload: Payload;
}): PathToQuery[];

declare const createMigration: CreateMigration;

/**
 * Attempt to find migrations directory.
 *
 * Checks for the following directories in order:
 * - `migrationDir` argument from Payload config
 * - `src/migrations`
 * - `dist/migrations`
 * - `migrations`
 *
 * @param migrationDir
 * @default src/migrations`, if the src folder does not exists - migrations.
 * @returns
 */
declare const findMigrationDir: (migrationDir?: string) => string;

/**
 * Gets all existing migrations from the database, excluding the dev migration
 */
declare function getMigrations({ payload, }: {
    payload: Payload;
}): Promise<{
    existingMigrations: MigrationData[];
    latestBatch: number;
}>;

/**
 * Get predefined migration 'up', 'down' and 'imports'.
 *
 * Supports two import methods:
 * 1. @payloadcms/db-* packages: Loads from adapter's predefinedMigrations folder directly (no package.json export needed)
 *    Example: `--file @payloadcms/db-mongodb/relationships-v2-v3`
 * 2. Any other package/path: Uses dynamic import via package.json exports or absolute file paths
 *    Example: `--file @payloadcms/plugin-seo/someMigration` or `--file /absolute/path/to/migration.ts`
 */
declare const getPredefinedMigration: ({ dirname, file, migrationName: migrationNameArg, payload, }: {
    dirname: string;
    file?: string;
    migrationName?: string;
    payload: Payload;
}) => Promise<MigrationTemplateArgs>;

declare const migrate: BaseDatabaseAdapter['migrate'];

declare function migrateDown(this: BaseDatabaseAdapter): Promise<void>;

/**
 * Run all migration down functions before running up
 */
declare function migrateRefresh(this: BaseDatabaseAdapter): Promise<void>;

declare function migrateReset(this: BaseDatabaseAdapter): Promise<void>;

declare function migrateStatus(this: BaseDatabaseAdapter): Promise<void>;

declare const migrationsCollection: CollectionConfig;

declare const migrationTemplate = "\nimport {\n  MigrateUpArgs,\n  MigrateDownArgs,\n} from \"@payloadcms/db-mongodb\";\n\nexport async function up({ payload, req }: MigrateUpArgs): Promise<void> {\n  // Migration code\n};\n\nexport async function down({ payload, req }: MigrateDownArgs): Promise<void> {\n  // Migration code\n};\n";

/**
 * Read the migration files from disk
 */
declare const readMigrationFiles: ({ payload, }: {
    payload: Payload;
}) => Promise<Migration[]>;

declare const writeMigrationIndex: (args: {
    migrationsDir: string;
}) => void;

type Args$h = {
    errors?: {
        path: string;
    }[];
    overrideAccess: boolean;
    policies?: EntityPolicies;
    polymorphicJoin?: boolean;
    req: PayloadRequest;
    versionFields?: FlattenedField$1[];
    where: Where;
} & ({
    collectionConfig: SanitizedCollectionConfig;
    globalConfig?: never | undefined;
} | {
    collectionConfig?: never | undefined;
    globalConfig: SanitizedGlobalConfig;
});
declare function validateQueryPaths({ collectionConfig, errors, globalConfig, overrideAccess, policies, polymorphicJoin, req, versionFields, where, }: Args$h): Promise<void>;

type Args$g = {
    collectionConfig?: SanitizedCollectionConfig;
    constraint: WhereField;
    errors: {
        path: string;
    }[];
    fields: FlattenedField$1[];
    globalConfig?: SanitizedGlobalConfig;
    operator: string;
    overrideAccess: boolean;
    parentIsLocalized?: boolean;
    path: string;
    policies: EntityPolicies;
    polymorphicJoin?: boolean;
    req: PayloadRequest;
    val: unknown;
    versionFields?: FlattenedField$1[];
};
/**
 * Validate the Payload key / value / operator
 */
declare function validateSearchParam({ collectionConfig, constraint, errors, fields, globalConfig, operator, overrideAccess, parentIsLocalized, path: incomingPath, policies, polymorphicJoin, req, val, versionFields, }: Args$g): Promise<void>;

declare const baseBlockFields: Field[];

declare const baseIDField: TextField;

type Args$f = {
    collectionConfig?: CollectionConfig;
    config: Config;
    existingFieldNames?: Set<string>;
    fields: Field[];
    globalConfig?: GlobalConfig;
    /**
     * Used to prevent unnecessary sanitization of fields that are not top-level.
     */
    isTopLevelField?: boolean;
    joinPath?: string;
    /**
     * When not passed in, assume that join are not supported (globals, arrays, blocks)
     */
    joins?: SanitizedJoins;
    parentIsLocalized: boolean;
    polymorphicJoins?: SanitizedJoin[];
    /**
     * If true, a richText field will require an editor property to be set, as the sanitizeFields function will not add it from the payload config if not present.
     *
     * @default false
     */
    requireFieldLevelRichTextEditor?: boolean;
    /**
     * If this property is set, RichText fields won't be sanitized immediately. Instead, they will be added to this array as promises
     * so that you can sanitize them together, after the config has been sanitized.
     */
    richTextSanitizationPromises?: Array<(config: SanitizedConfig) => Promise<void>>;
    /**
     * If not null, will validate that upload and relationship fields do not relate to a collection that is not in this array.
     * This validation will be skipped if validRelationships is null.
     */
    validRelationships: null | string[];
};
declare const sanitizeFields: ({ collectionConfig, config, existingFieldNames, fields, globalConfig, isTopLevelField, joinPath, joins, parentIsLocalized, polymorphicJoins, requireFieldLevelRichTextEditor, richTextSanitizationPromises, validRelationships, }: Args$f) => Promise<Field[]>;

type Args$e = {
    defaultValue: DefaultValue;
    locale: string | undefined;
    req: PayloadRequest;
    user: PayloadRequest['user'];
    value?: JsonValue;
};
declare const getDefaultValue: ({ defaultValue, locale, req, user, value, }: Args$e) => Promise<JsonValue>;

type Args$d = {
    /**
     * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
     */
    blockData?: JsonObject;
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    data: JsonObject;
    doc: JsonObject;
    fields: (Field | TabAsField)[];
    global: null | SanitizedGlobalConfig;
    operation: 'create' | 'update';
    parentIndexPath: string;
    /**
     * @todo make required in v4.0
     */
    parentIsLocalized?: boolean;
    parentPath: string;
    parentSchemaPath: string;
    previousDoc: JsonObject;
    previousSiblingDoc: JsonObject;
    req: PayloadRequest;
    siblingData: JsonObject;
    siblingDoc: JsonObject;
    siblingFields?: (Field | TabAsField)[];
};
declare const traverseFields$4: ({ blockData, collection, context, data, doc, fields, global, operation, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, previousDoc, previousSiblingDoc, req, siblingData, siblingDoc, siblingFields, }: Args$d) => Promise<void>;

type Args$c = {
    /**
     * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
     */
    blockData?: JsonObject;
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    currentDepth: number;
    depth: number;
    doc: JsonObject;
    draft: boolean;
    fallbackLocale: TypedFallbackLocale;
    field: Field | TabAsField;
    /**
     * The depth of the current field being processed.
     * Fields without names (i.e. rows, collapsibles, unnamed groups)
     * simply pass this value through
     *
     * @default 0
     */
    fieldDepth: number;
    fieldIndex: number;
    /**
     * fieldPromises are used for things like field hooks. They should be awaited before awaiting populationPromises
     */
    fieldPromises: Promise<void>[];
    findMany: boolean;
    global: null | SanitizedGlobalConfig;
    locale: null | string;
    overrideAccess: boolean;
    parentIndexPath: string;
    /**
     * @todo make required in v4.0
     */
    parentIsLocalized?: boolean;
    parentPath: string;
    parentSchemaPath: string;
    populate?: PopulateType;
    populationPromises: Promise<void>[];
    req: PayloadRequest;
    select?: SelectType;
    selectMode?: SelectMode;
    showHiddenFields: boolean;
    siblingDoc: JsonObject;
    siblingFields?: (Field | TabAsField)[];
    triggerAccessControl?: boolean;
    triggerHooks?: boolean;
} & Required<Pick<AfterReadArgs<JsonObject>, 'flattenLocales'>>;
declare const promise: ({ blockData, collection, context, currentDepth, depth, doc, draft, fallbackLocale, field, fieldDepth, fieldIndex, fieldPromises, findMany, flattenLocales, global, locale, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, populate, populationPromises, req, select, selectMode, showHiddenFields, siblingDoc, siblingFields, triggerAccessControl, triggerHooks, }: Args$c) => Promise<void>;

type Args$b = {
    /**
     * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
     */
    blockData?: JsonObject;
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    currentDepth: number;
    depth: number;
    doc: JsonObject;
    draft: boolean;
    fallbackLocale: TypedFallbackLocale;
    /**
     * The depth of the current field being processed.
     * Fields without names (i.e. rows, collapsibles, unnamed groups)
     * simply pass this value through
     *
     * @default 0
     */
    fieldDepth?: number;
    /**
     * fieldPromises are used for things like field hooks. They should be awaited before awaiting populationPromises
     */
    fieldPromises: Promise<void>[];
    fields: (Field | TabAsField)[];
    findMany: boolean;
    flattenLocales: boolean;
    global: null | SanitizedGlobalConfig;
    locale: null | string;
    overrideAccess: boolean;
    parentIndexPath: string;
    /**
     * @todo make required in v4.0
     */
    parentIsLocalized?: boolean;
    parentPath: string;
    parentSchemaPath: string;
    populate?: PopulateType;
    populationPromises: Promise<void>[];
    req: PayloadRequest;
    select?: SelectType;
    selectMode?: SelectMode;
    showHiddenFields: boolean;
    siblingDoc: JsonObject;
    triggerAccessControl?: boolean;
    triggerHooks?: boolean;
};
declare const traverseFields$3: ({ blockData, collection, context, currentDepth, depth, doc, draft, fallbackLocale, fieldDepth, fieldPromises, fields, findMany, flattenLocales, global, locale, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, populate, populationPromises, req, select, selectMode, showHiddenFields, siblingDoc, triggerAccessControl, triggerHooks, }: Args$b) => void;

type Args$a = {
    /**
     * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
     */
    blockData?: JsonObject;
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    data: JsonObject;
    /**
     * The original data (not modified by any hooks)
     */
    doc: JsonObject;
    /**
     * The original data with locales (not modified by any hooks)
     */
    docWithLocales: JsonObject;
    errors: ValidationFieldError[];
    /**
     * Built up labels of parent fields
     *
     * @example "Group Field > Tab Field > Text Field"
     */
    fieldLabelPath: string;
    fields: (Field | TabAsField)[];
    global: null | SanitizedGlobalConfig;
    id?: number | string;
    mergeLocaleActions: (() => Promise<void> | void)[];
    operation: Operation;
    overrideAccess: boolean;
    parentIndexPath: string;
    /**
     * @todo make required in v4.0
     */
    parentIsLocalized?: boolean;
    parentPath: string;
    parentSchemaPath: string;
    req: PayloadRequest;
    siblingData: JsonObject;
    /**
     * The original siblingData (not modified by any hooks)
     */
    siblingDoc: JsonObject;
    /**
     * The original siblingData with locales (not modified by any hooks)
     */
    siblingDocWithLocales: JsonObject;
    skipValidation?: boolean;
};
/**
 * This function is responsible for the following actions, in order:
 * - Run condition
 * - Execute field hooks
 * - Validate data
 * - Transform data for storage
 * - Unflatten locales. The input `data` is the normal document for one locale. The output result will become the document with locales.
 */
declare const traverseFields$2: ({ id, blockData, collection, context, data, doc, docWithLocales, errors, fieldLabelPath, fields, global, mergeLocaleActions, operation, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, req, siblingData, siblingDoc, siblingDocWithLocales, skipValidation, }: Args$a) => Promise<void>;

type Args$9<T> = {
    /**
     * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
     */
    blockData?: JsonObject;
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    data: T;
    /**
     * The original data (not modified by any hooks)
     */
    doc: T;
    fields: (Field | TabAsField)[];
    global: null | SanitizedGlobalConfig;
    id?: number | string;
    operation: 'create' | 'update';
    overrideAccess: boolean;
    parentIndexPath: string;
    /**
     * @todo make required in v4.0
     */
    parentIsLocalized?: boolean;
    parentPath: string;
    parentSchemaPath: string;
    req: PayloadRequest;
    siblingData: JsonObject;
    /**
     * The original siblingData (not modified by any hooks)
     */
    siblingDoc: JsonObject;
};
declare const traverseFields$1: <T>({ id, blockData, collection, context, data, doc, fields, global, operation, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, req, siblingData, siblingDoc, }: Args$9<T>) => Promise<void>;

declare const sortableFieldTypes: string[];

type Args$8 = {
    /**
     * Specify to query documents from a specific collection
     * @default undefined
     * @example 'posts'
     */
    collectionSlug?: CollectionSlug;
    /**
     * Optional where clause to filter documents by
     * @default undefined
     */
    documentWhere?: Where;
    /**
     * The ID of the folder to query documents from
     * @default undefined
     */
    folderID?: number | string;
    /** Optional where clause to filter subfolders by
     * @default undefined
     */
    folderWhere?: Where;
    req: PayloadRequest;
    sort: FolderSortKeys;
};
/**
 * Query for documents, subfolders and breadcrumbs for a given folder
 */
declare const getFolderData: ({ collectionSlug, documentWhere, folderID: _folderID, folderWhere, req, sort, }: Args$8) => Promise<GetFolderDataResult>;

type Arguments$3 = {
    /**
     * If the document data is passed, it will be used to check access instead of fetching the document from the database.
     */
    data?: JsonObject;
    globalConfig: SanitizedGlobalConfig;
    req: PayloadRequest;
};
declare const docAccessOperation: (args: Arguments$3) => Promise<SanitizedGlobalPermission>;

type Arguments$2 = {
    currentDepth?: number;
    depth?: number;
    disableErrors?: boolean;
    globalConfig: SanitizedGlobalConfig;
    id: number | string;
    overrideAccess?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
};
declare const findVersionByIDOperation: <T extends TypeWithVersion<T> = any>(args: Arguments$2) => Promise<T>;

type Arguments$1 = {
    depth?: number;
    globalConfig: SanitizedGlobalConfig;
    limit?: number;
    overrideAccess?: boolean;
    page?: number;
    pagination?: boolean;
    populate?: PopulateType;
    req?: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    sort?: Sort;
    where?: Where;
};
declare const findVersionsOperation: <T extends TypeWithVersion<T>>(args: Arguments$1) => Promise<PaginatedDocs<T>>;

type Arguments = {
    depth?: number;
    draft?: boolean;
    globalConfig: SanitizedGlobalConfig;
    id: number | string;
    overrideAccess?: boolean;
    populate?: PopulateType;
    req?: PayloadRequest;
    showHiddenFields?: boolean;
};
declare const restoreVersionOperation: <T extends TypeWithVersion<T> = any>(args: Arguments) => Promise<T>;

type Args$7<TSlug extends GlobalSlug> = {
    autosave?: boolean;
    data: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>;
    depth?: number;
    disableTransaction?: boolean;
    draft?: boolean;
    globalConfig: SanitizedGlobalConfig;
    overrideAccess?: boolean;
    overrideLock?: boolean;
    populate?: PopulateType;
    publishSpecificLocale?: string;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    slug: string;
};
declare const updateOperation: <TSlug extends GlobalSlug, TSelect extends SelectFromGlobalSlug<TSlug>>(args: Args$7<TSlug>) => Promise<TransformGlobalWithSelect<TSlug, TSelect>>;

declare class DatabaseKVAdapter implements KVAdapter {
    readonly payload: Payload;
    readonly collectionSlug: string;
    constructor(payload: Payload, collectionSlug: string);
    clear(): Promise<void>;
    delete(key: string): Promise<void>;
    get<T extends KVStoreValue>(key: string): Promise<null | T>;
    has(key: string): Promise<boolean>;
    keys(): Promise<string[]>;
    set(key: string, data: KVStoreValue): Promise<void>;
}
type DatabaseKVAdapterOptions = {
    /** Override options for the generated collection */
    kvCollectionOverrides?: Partial<CollectionConfig>;
};
declare const databaseKVAdapter: (options?: DatabaseKVAdapterOptions) => KVAdapterResult;

declare class InMemoryKVAdapter implements KVAdapter {
    store: Map<string, {}>;
    clear(): Promise<void>;
    delete(key: string): Promise<void>;
    get<T extends KVStoreValue>(key: string): Promise<null | T>;
    has(key: string): Promise<boolean>;
    keys(): Promise<string[]>;
    set(key: string, value: KVStoreValue): Promise<void>;
}
declare const inMemoryKVAdapter: () => KVAdapterResult;

declare function jobAfterRead({ config, doc }: {
    config: SanitizedConfig;
    doc: Job;
}): Job;

/**
 * Throw this error from within a task or workflow handler to cancel the job.
 * Unlike failing a job (e.g. by throwing any other error), a cancelled job will not be retried.
 */
declare class JobCancelledError extends Error {
    constructor(message: string);
}

/**
 * Gets all queued jobs that can be run. This means they either:
 * - failed but do not have a definitive error => can be retried
 * - are currently processing
 * - have not been started yet
 */
declare function countRunnableOrActiveJobsForQueue({ onlyScheduled, queue, req, taskSlug, workflowSlug, }: {
    /**
     * If true, this counts only jobs that have been created through the scheduling system.
     *
     * @default false
     */
    onlyScheduled?: boolean;
    queue: string;
    req: PayloadRequest;
    taskSlug?: TaskType;
    workflowSlug?: WorkflowTypes;
}): Promise<number>;

/**
 * Imports a handler function from a given path.
 */
declare function importHandlerPath<T>(path: string): Promise<T>;

/**
 * Globals that are used by our integration tests to modify the behavior of the job system during runtime.
 * This is useful to avoid having to wait for the cron jobs to run, or to pause auto-running jobs.
 */
declare const _internal_jobSystemGlobals: {
    getCurrentDate: () => Date;
    shouldAutoRun: boolean;
    shouldAutoSchedule: boolean;
};
declare function _internal_resetJobSystemGlobals(): void;
declare const getCurrentDate: () => Date;

declare const getLocalI18n: ({ config, language, }: {
    config: SanitizedConfig;
    language: AcceptedLanguages;
}) => Promise<I18n>;

declare const getFileByPath: (filePath: string) => Promise<PayloadRequest["file"]>;

/**
 * @internal this is used to mock the IP `lookup` function in integration tests
 */
declare const _internal_safeFetchGlobal: {
    lookup: typeof lookup;
};

type AddDataAndFileToRequest = (req: PayloadRequest) => Promise<void>;
/**
 * Mutates the Request, appending 'data' and 'file' if found
 */
declare const addDataAndFileToRequest: AddDataAndFileToRequest;

/**
 * Mutates the Request to contain 'locale' and 'fallbackLocale' based on data or searchParams
 */
declare function addLocalesToRequestFromData(req: PayloadRequest): void;
type SanitizeLocalesArgs = {
    fallbackLocale: TypedFallbackLocale;
    locale: string;
    localization: SanitizedConfig['localization'];
};
type SanitizeLocalesReturn = {
    fallbackLocale?: TypedFallbackLocale;
    locale?: string;
};
declare const sanitizeLocales: ({ fallbackLocale, locale, localization, }: SanitizeLocalesArgs) => SanitizeLocalesReturn;

/**
 * Protects admin-only routes, server functions, etc.
 * The requesting user must either:
 * a. pass the `access.admin` function on the `users` collection, if defined
 * b. match the `config.admin.user` property on the Payload config
 * c. if no user is present, and there are no users in the system, allow access (for first user creation)
 * @throws {Error} Throws an `Unauthorized` error if access is denied that can be explicitly caught
 */
declare const canAccessAdmin: ({ req }: {
    req: PayloadRequest;
}) => Promise<void>;

/**
 * complete a transaction calling adapter db.commitTransaction and delete the transactionID from req
 */
declare function commitTransaction(req: MarkRequired<Partial<PayloadRequest>, 'payload'>): Promise<void>;

/**
 * Returns a JSON Schema Type with 'null' added if the field is not required.
 */
declare function withNullableJSONSchemaType(fieldType: JSONSchema4TypeName, isRequired: boolean): JSONSchema4TypeName | JSONSchema4TypeName[];
declare function fieldsToJSONSchema(
/**
 * Used for relationship fields, to determine whether to use a string or number type for the ID.
 * While there is a default ID field type set by the db adapter, they can differ on a collection-level
 * if they have custom ID fields.
 */
collectionIDFieldTypes: {
    [key: string]: 'number' | 'string';
}, fields: FlattenedField$1[], 
/**
 * Allows you to define new top-level interfaces that can be re-used in the output schema.
 */
interfaceNameDefinitions: Map<string, JSONSchema4>, config?: SanitizedConfig, i18n?: I18n): {
    properties: {
        [k: string]: JSONSchema4;
    };
    required: string[];
};
declare function entityToJSONSchema(config: SanitizedConfig, entity: SanitizedCollectionConfig | SanitizedGlobalConfig, interfaceNameDefinitions: Map<string, JSONSchema4>, defaultIDType: 'number' | 'text', collectionIDFieldTypes?: {
    [key: string]: 'number' | 'string';
}, i18n?: I18n): JSONSchema4;
/**
 * This is used for generating the TypeScript types (payload-types.ts) with the payload generate:types command.
 */
declare function configToJSONSchema(config: SanitizedConfig, defaultIDType?: 'number' | 'text', i18n?: I18n): JSONSchema4;

declare function createArrayFromCommaDelineated(input: string): string[];

type CreateLocalReqOptions = {
    context?: RequestContext;
    fallbackLocale?: false | TypedLocale;
    locale?: string;
    req?: Partial<PayloadRequest>;
    urlSuffix?: string;
    user?: TypedUser;
};
type CreateLocalReq = (options: CreateLocalReqOptions, payload: Payload) => Promise<PayloadRequest>;
declare const createLocalReq: CreateLocalReq;

type Args$6 = {
    canSetHeaders?: boolean;
    config: Promise<SanitizedConfig> | SanitizedConfig;
    params?: {
        collection: string;
    };
    payloadInstanceCacheKey?: string;
    request: Request;
};
declare const createPayloadRequest: ({ canSetHeaders, config: configPromise, params, payloadInstanceCacheKey, request, }: Args$6) => Promise<PayloadRequest>;

declare const deepCopyObject: <T>(o: T) => T;
/**
 * A deepCopyObject implementation which only works for JSON objects and arrays, and is faster than
 * JSON.parse(JSON.stringify(obj))
 *
 * @param value The JSON value to be cloned. There are two invariants. 1) It must not contain circles
 *              as JSON does not allow it. This function will cause infinite loop for such values by
 *              design. 2) It must contain JSON values only. Other values like `Date`, `Regexp`, `Map`,
 *              `Set`, `Buffer`, ... are not allowed.
 * @returns The cloned JSON value.
 */
declare function deepCopyObjectSimple<T extends JsonValue>(value: T, filterUndefined?: boolean): T;
/**
 * A deepCopyObject implementation which is slower than deepCopyObject, but more correct.
 * Can be used if correctness is more important than speed. Supports circular dependencies
 */
declare function deepCopyObjectComplex<T>(object: T, cache?: WeakMap<any, any>): T;

/**
 * Fully-featured deepMerge.
 *
 * Array handling: Arrays in the target object are combined with the source object's arrays.
 */
declare function deepMergeWithCombinedArrays<T extends object>(obj1: object, obj2: object, options?: deepMerge.Options): T;
/**
 * Fully-featured deepMerge.
 *
 * Array handling: Arrays in the target object are replaced by the source object's arrays.
 */
declare function deepMergeWithSourceArrays<T extends object>(obj1: object, obj2: object): T;
/**
 * Fully-featured deepMerge. Does not clone React components by default.
 */
declare function deepMergeWithReactComponents<T extends object>(obj1: object, obj2: object): T;

type CustomVersionParser = (version: string) => {
    parts: number[];
    preReleases: string[];
};
type DependencyCheckerArgs = {
    /**
     * Define dependency groups to ensure that all dependencies within that group are on the same version, and that no dependencies in that group with different versions are found
     */
    dependencyGroups?: {
        dependencies: string[];
        /**
         * Name of the dependency group to be displayed in the error message
         */
        name: string;
        targetVersion?: string;
        targetVersionDependency?: string;
    }[];
    /**
     * Dependency package names keyed to their required versions. Supports >= (greater or equal than version) as a prefix, or no prefix for the exact version
     */
    dependencyVersions?: {
        [dependency: string]: {
            customVersionParser?: CustomVersionParser;
            required?: boolean;
            version?: string;
        };
    };
};
declare function checkDependencies({ dependencyGroups, dependencyVersions, }: DependencyCheckerArgs): Promise<void>;

type NecessaryDependencies = {
    missing: string[];
    resolved: Map<string, {
        path: string;
        version: string;
    }>;
};
declare function getDependencies(baseDir: string, requiredPackages: string[]): Promise<NecessaryDependencies>;

/**
 * Synchronously walks up parent directories until a condition is met and/or one of the file names within the fileNames array is found.
 */
declare function findUpSync({ condition, dir, fileNames, }: {
    condition?: (dir: string) => boolean | Promise<boolean | string> | string;
    dir: string;
    fileNames?: string[];
}): null | string;
/**
 * Asynchronously walks up parent directories until a condition is met and/or one of the file names within the fileNames array is found.
 */
declare function findUp({ condition, dir, fileNames, }: {
    condition?: (dir: string) => boolean | Promise<boolean | string> | string;
    dir: string;
    fileNames?: string[];
}): Promise<null | string>;
declare function pathExistsAndIsAccessibleSync(path: string): boolean;
declare function pathExistsAndIsAccessible(path: string): Promise<boolean>;

/**
 * Flattens all fields in a collection, preserving the nested field structure.
 * @param cache
 * @param fields
 */
declare const flattenAllFields: ({ cache, fields, }: {
    /** Allows you to get FlattenedField[] from Field[] anywhere without performance overhead by caching. */
    cache?: boolean;
    fields: Field[];
}) => FlattenedField$1[];

type FlattenedField<TField> = TField extends ClientField ? {
    accessor?: string;
    labelWithPrefix?: string;
} & (FieldAffectingDataClient | FieldPresentationalOnlyClient) : {
    accessor?: string;
    labelWithPrefix?: string;
} & (FieldAffectingData | FieldPresentationalOnly);
/**
 * Options to control how fields are flattened.
 */
type FlattenFieldsOptions = {
    /**
     * i18n context used for translating `label` values via `getTranslation`.
     */
    i18n?: I18nClient;
    /**
     * If true, presentational-only fields (like UI fields) will be included
     * in the output. Otherwise, they will be skipped.
     * Default: false.
     */
    keepPresentationalFields?: boolean;
    /**
     * A label prefix to prepend to translated labels when building `labelWithPrefix`.
     * Used recursively when flattening nested fields.
     */
    labelPrefix?: string;
    /**
     * If true, nested fields inside `group` & `tabs` fields will be lifted to the top level
     * and given contextual `accessor` and `labelWithPrefix` values.
     * Default: false.
     */
    moveSubFieldsToTop?: boolean;
    /**
     * A path prefix to prepend to field names when building the `accessor`.
     * Used recursively when flattening nested fields.
     */
    pathPrefix?: string;
};
/**
 * Flattens a collection's fields into a single array of fields, optionally
 * extracting nested fields in group fields.
 *
 * @param fields - Array of fields to flatten
 * @param options - Options to control the flattening behavior
 */
declare function flattenTopLevelFields<TField extends ClientField | Field>(fields?: TField[], options?: boolean | FlattenFieldsOptions): FlattenedField<TField>[];

declare const formatErrors: (incoming: {
    [key: string]: unknown;
} | APIError) => ErrorResult;

declare const toWords: (inputString: string, joinWords?: boolean) => string;
declare const formatLabels: (slug: string) => {
    plural: string;
    singular: string;
};
declare const formatNames: (slug: string) => {
    plural: string;
    singular: string;
};

/**
 * This is used for the Select API to determine the select level of a block.
 * It will ensure that `id` and `blockType` are always included in the select object.
 * @returns { blockSelect: boolean | SelectType, blockSelectMode: SelectMode }
 */
declare const getBlockSelect: ({ block, select, selectMode, }: {
    block: Block;
    select: SelectType[string];
    selectMode: SelectMode;
}) => {
    blockSelect: boolean | SelectType;
    blockSelectMode: SelectMode;
};

/**
 *  While the default ID is determined by the db adapter, it can still differ for a collection if they
 *  define a custom ID field. This builds a map of collection slugs to their ID field type.
 * @param defaultIDType as defined by the database adapter
 */
declare function getCollectionIDFieldTypes({ config, defaultIDType, }: {
    config: SanitizedConfig;
    defaultIDType: 'number' | 'text';
}): {
    [key: string]: 'number' | 'string';
};

/**
 * Get the field by its schema path, e.g. group.title, array.group.title
 * If there were any localized on the path, `pathHasLocalized` will be true and `localizedPath` will look like:
 * `group.<locale>.title` // group is localized here
 */
declare const getFieldByPath: ({ config, fields, includeRelationships, localizedPath, path, }: {
    config?: SanitizedConfig;
    fields: FlattenedField$1[];
    includeRelationships?: boolean;
    localizedPath?: string;
    /**
     * The schema path, e.g. `array.group.title`
     */
    path: string;
}) => {
    field: FlattenedField$1;
    localizedPath: string;
    pathHasLocalized: boolean;
} | null;

/**
 *
 * @deprecated use getObjectDotNotation from `'payload/shared'` instead of `'payload'`
 *
 * @example
 *
 * ```ts
 * import { getObjectDotNotation } from 'payload/shared'
 *
 * const obj = { a: { b: { c: 42 } } }
 * const value = getObjectDotNotation<number>(obj, 'a.b.c', 0) // value is 42
 * const defaultValue = getObjectDotNotation<number>(obj, 'a.b.x', 0) // defaultValue is 0
 * ```
 */
declare const getObjectDotNotation: <T>(obj: Record<string, unknown>, path: string, defaultValue?: T) => T;

type GetRequestLanguageArgs = {
    config: SanitizedConfig;
    cookies: Map<string, string> | ReadonlyRequestCookies;
    defaultLanguage?: AcceptedLanguages;
    headers: Request['headers'];
};
declare const getRequestLanguage: ({ config, cookies, headers, }: GetRequestLanguageArgs) => AcceptedLanguages;

/**
 * Attaches the Payload REST API to any backend framework that uses Fetch Request/Response
 * like Next.js (app router), Remix, Bun, Hono.
 *
 * ### Example: Using Hono
 * ```ts
 * import { handleEndpoints } from 'payload';
 * import { serve } from '@hono/node-server';
 * import { loadEnv } from 'payload/node';
 *
 * const port = 3001;
 * loadEnv();
 *
 * const { default: config } = await import('@payload-config');
 *
 * const server = serve({
 *   fetch: async (request) => {
 *     const response = await handleEndpoints({
 *       config,
 *       request: request.clone(),
 *     });
 *
 *     return response;
 *   },
 *   port,
 * });
 *
 * server.on('listening', () => {
 *   console.log(`API server is listening on http://localhost:${port}/api`);
 * });
 * ```
 */
declare const handleEndpoints: ({ basePath, config: incomingConfig, path, payloadInstanceCacheKey, request, }: {
    basePath?: string;
    config: Promise<SanitizedConfig> | SanitizedConfig;
    /** Override path from the request */
    path?: string;
    payloadInstanceCacheKey?: string;
    request: Request;
}) => Promise<Response>;

type CorsArgs = {
    headers: Headers;
    req: Partial<PayloadRequest>;
};
declare const headersWithCors: ({ headers, req }: CorsArgs) => Headers;

/**
 * Starts a new transaction using the db adapter with a random id and then assigns it to the req.transaction
 * @returns true if beginning a transaction and false when req already has a transaction to use
 */
declare function initTransaction(req: MarkRequired<Partial<PayloadRequest>, 'payload'>): Promise<boolean>;

declare const isEntityHidden: ({ hidden, user, }: {
    hidden: SanitizedCollectionConfig["admin"]["hidden"] | SanitizedGlobalConfig["admin"]["hidden"];
    user: PayloadRequest["user"];
}) => boolean;

/**
 * Creates a proxy for the given object that has its own property
 */
declare function isolateObjectProperty<T extends object>(object: T, key: (keyof T)[] | keyof T): T;

declare function isPlainObject(o: any): boolean;

declare const isValidID: (value: number | string, type: "number" | "ObjectID" | "text") => boolean;

/**
 * Rollback the transaction from the req using the db adapter and removes it from the req
 */
declare function killTransaction(req: MarkRequired<Partial<PayloadRequest>, 'payload'>): Promise<void>;

declare const logError: ({ err, payload }: {
    err: unknown;
    payload: Payload;
}) => void;

declare function mapAsync<T, U>(arr: T[], callbackfn: (item: T, index: number, array: T[]) => Promise<U>): Promise<U[]>;

declare const mergeHeaders: (sourceHeaders: Headers, destinationHeaders: Headers) => Headers;

type ParseDocumentIDArgs = {
    collectionSlug: CollectionSlug;
    id?: number | string;
    payload: Payload;
};
declare function parseDocumentID({ id, collectionSlug, payload }: ParseDocumentIDArgs): string | number | undefined;

interface Args$5 {
    fallbackLocale: TypedFallbackLocale;
    locale: string;
    localization: SanitizedLocalizationConfig;
}
/**
 * Sanitizes fallbackLocale based on a provided fallbackLocale, locale and localization config
 *
 * Handles the following scenarios:
 * - determines if a fallback locale should be used
 * - determines if a locale specific fallback should be used in place of the default locale
 * - sets the fallbackLocale to 'null' if no fallback locale should be used
 */
declare const sanitizeFallbackLocale: ({ fallbackLocale, locale, localization, }: Args$5) => TypedFallbackLocale;

type JoinParams = {
    [schemaPath: string]: {
        limit?: unknown;
        sort?: string;
        where?: unknown;
    } | false;
} | false;
/**
 * Convert request JoinQuery object from strings to numbers
 * @param joins
 */
declare const sanitizeJoinParams: (_joins?: JoinParams) => JoinQuery;

/**
 * Sanitizes REST populate query to PopulateType
 */
declare const sanitizePopulateParam: (unsanitizedPopulate: unknown) => PopulateType | undefined;

/**
 * Sanitizes REST select query to SelectType
 */
declare const sanitizeSelectParam: (unsanitizedSelect: unknown) => SelectType | undefined;

/**
 * This is used for the Select API to strip out fields that are not selected.
 * It will mutate the given data object and determine if your recursive function should continue to run.
 * It is used within the `afterRead` hook as well as `getFormState`.
 * @returns boolean - whether or not the recursive function should continue
 */
declare const stripUnselectedFields: ({ field, select, selectMode, siblingDoc, }: {
    field: Field | TabAsField;
    select: SelectType;
    selectMode: SelectMode;
    siblingDoc: Data;
}) => boolean;

type TraverseFieldsCallback = (args: {
    /**
     * The current field
     */
    field: Field | TabAsField;
    /**
     * Function that when called will skip the current field and continue to the next
     */
    next?: () => void;
    parentIsLocalized: boolean;
    parentPath: string;
    /**
     * The parent reference object
     */
    parentRef?: Record<string, unknown> | unknown;
    /**
     * The current reference object
     */
    ref?: Record<string, unknown> | unknown;
}) => boolean | void;
type TraverseFieldsArgs = {
    callback: TraverseFieldsCallback;
    callbackStack?: (() => ReturnType<TraverseFieldsCallback>)[];
    config?: Config | SanitizedConfig;
    fields: (Field | TabAsField)[];
    fillEmpty?: boolean;
    isTopLevel?: boolean;
    /**
     * @default false
     *
     * if this is `true`, the callback functions of the leaf fields will be called before the parent fields.
     * The return value of the callback function will be ignored.
     */
    leavesFirst?: boolean;
    parentIsLocalized?: boolean;
    parentPath?: string;
    parentRef?: Record<string, unknown> | unknown;
    ref?: Record<string, unknown> | unknown;
};
/**
 * Iterate a recurse an array of fields, calling a callback for each field
 *
 * @param fields
 * @param callback callback called for each field, discontinue looping if callback returns truthy
 * @param fillEmpty fill empty properties to use this without data
 * @param ref the data or any artifacts assigned in the callback during field recursion
 * @param parentRef the data or any artifacts assigned in the callback during field recursion one level up
 */
declare const traverseFields: ({ callback, callbackStack: _callbackStack, config, fields, fillEmpty, isTopLevel, leavesFirst, parentIsLocalized, parentPath, parentRef, ref, }: TraverseFieldsArgs) => void;

declare const buildVersionCollectionFields: <T extends boolean = false>(config: SanitizedConfig, collection: SanitizedCollectionConfig, flatten?: T) => true extends T ? FlattenedField$1[] : Field[];

declare const buildVersionGlobalFields: <T extends boolean = false>(config: SanitizedConfig, global: SanitizedGlobalConfig, flatten?: T) => true extends T ? FlattenedField$1[] : Field[];

declare const buildVersionCompoundIndexes: ({ indexes, }: {
    indexes: SanitizedCompoundIndex[];
}) => SanitizedCompoundIndex[];

declare const versionDefaults: {
    autosaveInterval: number;
};

type Args$4 = {
    id?: number | string;
    payload: Payload;
    req?: PayloadRequest;
    slug: string;
};
declare const deleteCollectionVersions: ({ id, slug, payload, req }: Args$4) => Promise<void>;

declare const appendVersionToQueryKey: (query?: Where) => Where;

/**
 * Takes the incoming sort argument and prefixes it with `versions.` and preserves any `-` prefixes for descending order
 * @param sort
 */
declare const getQueryDraftsSort: ({ collectionConfig, sort, }: {
    collectionConfig: SanitizedCollectionConfig;
    sort?: Sort;
}) => Sort;

type Args$3 = {
    collection?: SanitizedCollectionConfig;
    global?: SanitizedGlobalConfig;
    id?: number | string;
    max: number;
    payload: Payload;
    req?: PayloadRequest;
};
declare const enforceMaxVersions: ({ id, collection, global: globalConfig, max, payload, req, }: Args$3) => Promise<void>;

type Args$2 = {
    config: SanitizedCollectionConfig;
    id: number | string;
    payload: Payload;
    published?: boolean;
    query: FindOneArgs;
    req?: PayloadRequest;
};
declare const getLatestCollectionVersion: <T extends TypeWithID = any>({ id, config, payload, published, query, req, }: Args$2) => Promise<T | undefined>;

type Args$1 = {
    config: SanitizedGlobalConfig;
    locale?: string;
    payload: Payload;
    published?: boolean;
    req?: PayloadRequest;
    slug: string;
    where: Where;
};
declare const getLatestGlobalVersion: ({ slug, config, locale, payload, published, req, where, }: Args$1) => Promise<{
    global: Document;
    globalExists: boolean;
}>;

type Args<T extends JsonObject = JsonObject> = {
    autosave?: boolean;
    collection?: SanitizedCollectionConfig;
    docWithLocales: T;
    draft?: boolean;
    global?: SanitizedGlobalConfig;
    id?: number | string;
    operation?: 'create' | 'restoreVersion' | 'update';
    payload: Payload;
    publishSpecificLocale?: string;
    req?: PayloadRequest;
    returning?: boolean;
    select?: SelectType;
    snapshot?: any;
};
declare function saveVersion<TData extends JsonObject = JsonObject>(args: {
    returning: false;
} & Args<TData>): Promise<null>;
declare function saveVersion<TData extends JsonObject = JsonObject>(args: {
    returning: true;
} & Args<TData>): Promise<JsonObject>;
declare function saveVersion<TData extends JsonObject = JsonObject>(args: Omit<Args<TData>, 'returning'>): Promise<JsonObject>;

type SchedulePublishTaskInput = {
    doc?: {
        relationTo: CollectionSlug;
        value: string;
    };
    global?: GlobalSlug;
    locale?: string;
    type?: string;
    user?: number | string;
};

/**
 * Very simple, but fast deepMerge implementation. Only deepMerges objects, not arrays and clones everything.
 * Do not use this if your object contains any complex objects like React Components, or if you would like to combine Arrays.
 * If you only have simple objects and need a fast deepMerge, this is the function for you.
 *
 * obj2 takes precedence over obj1 - thus if obj2 has a key that obj1 also has, obj2's value will be used.
 *
 * @param obj1 base object
 * @param obj2 object to merge "into" obj1
 */
declare function deepMergeSimple<T = object>(obj1: object, obj2: object): T;

/**
 * Shape constraint for PayloadTypes.
 * Matches the structure of generated Config types.
 *
 * By defining the actual shape, we can use simple property access (T['collections'])
 * instead of conditional types throughout the codebase.
 */
interface PayloadTypesShape {
    auth: Record<string, unknown>;
    blocks: Record<string, unknown>;
    collections: Record<string, unknown>;
    collectionsJoins: Record<string, unknown>;
    collectionsSelect: Record<string, unknown>;
    db: {
        defaultIDType: unknown;
    };
    fallbackLocale: unknown;
    globals: Record<string, unknown>;
    globalsSelect: Record<string, unknown>;
    jobs: unknown;
    locale: unknown;
    user: unknown;
}
/**
 * Untyped fallback types. Uses the SAME property names as generated types.
 * PayloadTypes merges GeneratedTypes with these fallbacks.
 */
interface UntypedPayloadTypes {
    auth: {
        [slug: string]: {
            forgotPassword: {
                email: string;
            };
            login: {
                email: string;
                password: string;
            };
            registerFirstUser: {
                email: string;
                password: string;
            };
            unlock: {
                email: string;
            };
        };
    };
    blocks: {
        [slug: string]: JsonObject;
    };
    collections: {
        [slug: string]: JsonObject & TypeWithID;
    };
    collectionsJoins: {
        [slug: string]: {
            [schemaPath: string]: string;
        };
    };
    collectionsSelect: {
        [slug: string]: SelectType;
    };
    db: {
        defaultIDType: number | string;
    };
    fallbackLocale: 'false' | 'none' | 'null' | ({} & string)[] | ({} & string) | false | null;
    globals: {
        [slug: string]: JsonObject;
    };
    globalsSelect: {
        [slug: string]: SelectType;
    };
    jobs: {
        tasks: {
            [slug: string]: {
                input?: JsonObject;
                output?: JsonObject;
            };
        };
        workflows: {
            [slug: string]: {
                input: JsonObject;
            };
        };
    };
    locale: null | string;
    user: UntypedUser;
}
/**
 * Interface to be module-augmented by the `payload-types.ts` file.
 * When augmented, its properties take precedence over UntypedPayloadTypes.
 */
interface GeneratedTypes {
}
/**
 * Check if GeneratedTypes has been augmented (has any keys).
 */
type IsAugmented = keyof GeneratedTypes extends never ? false : true;
/**
 * PayloadTypes merges GeneratedTypes with UntypedPayloadTypes.
 * - When augmented: uses augmented properties, fills gaps with untyped fallbacks
 * - When not augmented: uses only UntypedPayloadTypes
 */
type PayloadTypes = IsAugmented extends true ? GeneratedTypes & Omit<UntypedPayloadTypes, keyof GeneratedTypes> : UntypedPayloadTypes;
type TypedCollection<T extends PayloadTypesShape = PayloadTypes> = T['collections'];
type TypedBlock = PayloadTypes['blocks'];
type TypedUploadCollection<T extends PayloadTypesShape = PayloadTypes> = NonNever<{
    [TSlug in keyof T['collections']]: 'filename' | 'filesize' | 'mimeType' | 'url' extends keyof T['collections'][TSlug] ? T['collections'][TSlug] : never;
}>;
type TypedCollectionSelect<T extends PayloadTypesShape = PayloadTypes> = T['collectionsSelect'];
type TypedCollectionJoins<T extends PayloadTypesShape = PayloadTypes> = T['collectionsJoins'];
type TypedGlobal<T extends PayloadTypesShape = PayloadTypes> = T['globals'];
type TypedGlobalSelect<T extends PayloadTypesShape = PayloadTypes> = T['globalsSelect'];
type StringKeyOf<T> = Extract<keyof T, string>;
type CollectionSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<T['collections']>;
type BlockSlug = StringKeyOf<TypedBlock>;
type UploadCollectionSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<TypedUploadCollection<T>>;
type DefaultDocumentIDType = PayloadTypes['db']['defaultIDType'];
type GlobalSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<T['globals']>;
type TypedLocale<T extends PayloadTypesShape = PayloadTypes> = T['locale'];
type TypedFallbackLocale = PayloadTypes['fallbackLocale'];
/**
 * @todo rename to `User` in 4.0
 */
type TypedUser = PayloadTypes['user'];
type TypedAuthOperations<T extends PayloadTypesShape = PayloadTypes> = T['auth'];
type AuthCollectionSlug<T extends PayloadTypesShape> = StringKeyOf<T['auth']>;
type TypedJobs = PayloadTypes['jobs'];
type HasPayloadJobsType = GeneratedTypes extends {
    collections: infer C;
} ? 'payload-jobs' extends keyof C ? true : false : false;
/**
 * Represents a job in the `payload-jobs` collection, referencing a queued workflow or task (= Job).
 * If a generated type for the `payload-jobs` collection is not available, falls back to the BaseJob type.
 *
 * `input` and `taksStatus` are always present here, as the job afterRead hook will always populate them.
 */
type Job<TWorkflowSlugOrInput extends false | keyof TypedJobs['workflows'] | object = false> = HasPayloadJobsType extends true ? {
    input: BaseJob<TWorkflowSlugOrInput>['input'];
    taskStatus: BaseJob<TWorkflowSlugOrInput>['taskStatus'];
} & Omit<TypedCollection['payload-jobs'], 'input' | 'taskStatus'> : BaseJob<TWorkflowSlugOrInput>;
/**
 * @description Payload
 */
declare class BasePayload {
    /**
     * @description Authorization and Authentication using headers and cookies to run auth user strategies
     * @returns permissions: Permissions
     * @returns user: User
     */
    auth: (options: AuthArgs) => Promise<AuthResult>;
    authStrategies: AuthStrategy[];
    blocks: Record<BlockSlug, FlattenedBlock>;
    collections: Record<CollectionSlug, Collection>;
    config: SanitizedConfig;
    /**
     * @description Performs count operation
     * @param options
     * @returns count of documents satisfying query
     */
    count: <T extends CollectionSlug>(options: Options$d<T>) => Promise<{
        totalDocs: number;
    }>;
    /**
     * @description Performs countGlobalVersions operation
     * @param options
     * @returns count of global document versions satisfying query
     */
    countGlobalVersions: <T extends GlobalSlug>(options: CountGlobalVersionsOptions<T>) => Promise<{
        totalDocs: number;
    }>;
    /**
     * @description Performs countVersions operation
     * @param options
     * @returns count of document versions satisfying query
     */
    countVersions: <T extends CollectionSlug>(options: Options$d<T>) => Promise<{
        totalDocs: number;
    }>;
    /**
     * @description Performs create operation
     * @param options
     * @returns created document
     */
    create: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(options: Options$c<TSlug, TSelect>) => Promise<TransformCollectionWithSelect<TSlug, TSelect>>;
    crons: Cron[];
    db: DatabaseAdapter;
    decrypt: typeof decrypt;
    destroy: () => Promise<void>;
    duplicate: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(options: Options$b<TSlug, TSelect>) => Promise<TransformCollectionWithSelect<TSlug, TSelect>>;
    email: InitializedEmailAdapter;
    encrypt: typeof encrypt;
    extensions: (args: {
        args: OperationArgs$1<any>;
        req: Request$1<unknown, unknown>;
        result: ExecutionResult;
    }) => Promise<any>;
    /**
     * @description Find documents with criteria
     * @param options
     * @returns documents satisfying query
     */
    find: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>, TDraft extends boolean = false>(options: {
        draft?: TDraft;
    } & Options$a<TSlug, TSelect>) => Promise<PaginatedDocs<TDraft extends true ? PayloadTypes extends {
        strictDraftTypes: true;
    } ? DraftTransformCollectionWithSelect<TSlug, TSelect> : TransformCollectionWithSelect<TSlug, TSelect> : TransformCollectionWithSelect<TSlug, TSelect>>>;
    /**
     * @description Find document by ID
     * @param options
     * @returns document with specified ID
     */
    findByID: <TSlug extends CollectionSlug, TDisableErrors extends boolean, TSelect extends SelectFromCollectionSlug<TSlug>>(options: Options$9<TSlug, TDisableErrors, TSelect>) => Promise<ApplyDisableErrors<TransformCollectionWithSelect<TSlug, TSelect>, TDisableErrors>>;
    /**
     * @description Find distinct field values
     * @param options
     * @returns result with distinct field values
     */
    findDistinct: <TSlug extends CollectionSlug, TField extends keyof DataFromCollectionSlug<TSlug> & string>(options: Options$8<TSlug, TField>) => Promise<PaginatedDistinctDocs<Record<TField, DataFromCollectionSlug<TSlug>[TField]>>>;
    findGlobal: <TSlug extends GlobalSlug, TSelect extends SelectFromGlobalSlug<TSlug>>(options: Options$4<TSlug, TSelect>) => Promise<TransformGlobalWithSelect<TSlug, TSelect>>;
    /**
     * @description Find global version by ID
     * @param options
     * @returns global version with specified ID
     */
    findGlobalVersionByID: <TSlug extends GlobalSlug>(options: Options$3<TSlug>) => Promise<TypeWithVersion<DataFromGlobalSlug<TSlug>>>;
    /**
     * @description Find global versions with criteria
     * @param options
     * @returns versions satisfying query
     */
    findGlobalVersions: <TSlug extends GlobalSlug>(options: Options$2<TSlug>) => Promise<PaginatedDocs<TypeWithVersion<DataFromGlobalSlug<TSlug>>>>;
    /**
     * @description Find version by ID
     * @param options
     * @returns version with specified ID
     */
    findVersionByID: <TSlug extends CollectionSlug>(options: Options$7<TSlug>) => Promise<TypeWithVersion<DataFromCollectionSlug<TSlug>>>;
    /**
     * @description Find versions with criteria
     * @param options
     * @returns versions satisfying query
     */
    findVersions: <TSlug extends CollectionSlug>(options: Options$6<TSlug>) => Promise<PaginatedDocs<TypeWithVersion<DataFromCollectionSlug<TSlug>>>>;
    forgotPassword: <TSlug extends CollectionSlug>(options: Options$i<TSlug>) => Promise<Result$3>;
    getAdminURL: () => string;
    getAPIURL: () => string;
    globals: Globals;
    importMap: ImportMap;
    jobs: {
        handleSchedules: (args?: {
            allQueues?: boolean;
            queue?: string;
            req?: PayloadRequest;
        }) => Promise<HandleSchedulesResult>;
        queue: <TTaskOrWorkflowSlug extends keyof TypedJobs["tasks"] | keyof TypedJobs["workflows"]>(args: {
            input: TypedJobs["tasks"][TTaskOrWorkflowSlug]["input"];
            meta?: BaseJob["meta"];
            overrideAccess?: boolean;
            queue?: string;
            req?: PayloadRequest;
            task: TTaskOrWorkflowSlug extends keyof TypedJobs["tasks"] ? TTaskOrWorkflowSlug : never;
            waitUntil?: Date;
            workflow?: never;
        } | {
            input: TypedJobs["workflows"][TTaskOrWorkflowSlug]["input"];
            meta?: BaseJob["meta"];
            overrideAccess?: boolean;
            queue?: string;
            req?: PayloadRequest;
            task?: never;
            waitUntil?: Date;
            workflow: TTaskOrWorkflowSlug extends keyof TypedJobs["workflows"] ? TTaskOrWorkflowSlug : never;
        }) => Promise<TTaskOrWorkflowSlug extends keyof TypedJobs["workflows"] ? Job<TTaskOrWorkflowSlug> : RunningJobFromTask<TTaskOrWorkflowSlug>>;
        run: (args?: {
            allQueues?: boolean;
            limit?: number;
            overrideAccess?: boolean;
            processingOrder?: Sort;
            queue?: string;
            req?: PayloadRequest;
            sequential?: boolean;
            silent?: RunJobsSilent;
            where?: Where;
        }) => Promise<ReturnType<typeof runJobs>>;
        runByID: (args: {
            id: number | string;
            overrideAccess?: boolean;
            req?: PayloadRequest;
            silent?: RunJobsSilent;
        }) => Promise<ReturnType<typeof runJobs>>;
        cancel: (args: {
            overrideAccess?: boolean;
            queue?: string;
            req?: PayloadRequest;
            where: Where;
        }) => Promise<void>;
        cancelByID: (args: {
            id: number | string;
            overrideAccess?: boolean;
            req?: PayloadRequest;
        }) => Promise<void>;
    };
    /**
     * Key Value storage
     */
    kv: KVAdapter;
    logger: Logger;
    login: <TSlug extends CollectionSlug>(options: Options$h<TSlug>) => Promise<{
        user: DataFromCollectionSlug<TSlug>;
    } & Result$2>;
    resetPassword: <TSlug extends CollectionSlug>(options: Options$g<TSlug>) => Promise<Result$1>;
    /**
     * @description Restore global version by ID
     * @param options
     * @returns version with specified ID
     */
    restoreGlobalVersion: <TSlug extends GlobalSlug>(options: Options$1<TSlug>) => Promise<DataFromGlobalSlug<TSlug>>;
    /**
     * @description Restore version by ID
     * @param options
     * @returns version with specified ID
     */
    restoreVersion: <TSlug extends CollectionSlug>(options: Options$5<TSlug>) => Promise<DataFromCollectionSlug<TSlug>>;
    schema: GraphQLSchema;
    secret: string;
    sendEmail: InitializedEmailAdapter['sendEmail'];
    types: {
        arrayTypes: any;
        blockInputTypes: any;
        blockTypes: any;
        fallbackLocaleInputType?: any;
        groupTypes: any;
        localeInputType?: any;
        tabTypes: any;
    };
    unlock: <TSlug extends CollectionSlug>(options: Options$f<TSlug>) => Promise<boolean>;
    updateGlobal: <TSlug extends GlobalSlug, TSelect extends SelectFromGlobalSlug<TSlug>>(options: Options<TSlug, TSelect>) => Promise<TransformGlobalWithSelect<TSlug, TSelect>>;
    validationRules: (args: OperationArgs$1<any>) => ValidationRule[];
    verifyEmail: <TSlug extends CollectionSlug>(options: Options$e<TSlug>) => Promise<boolean>;
    versions: {
        [slug: string]: any;
    };
    _initializeCrons(): Promise<void>;
    bin({ args, cwd, log, }: {
        args: string[];
        cwd?: string;
        log?: boolean;
    }): Promise<{
        code: number;
    }>;
    /**
     * @description delete one or more documents
     * @param options
     * @returns Updated document(s)
     */
    delete<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(options: ByIDOptions$1<TSlug, TSelect>): Promise<TransformCollectionWithSelect<TSlug, TSelect>>;
    delete<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(options: ManyOptions$1<TSlug, TSelect>): Promise<BulkOperationResult<TSlug, TSelect>>;
    /**
     * @description Initializes Payload
     * @param options
     */
    init(options: InitOptions): Promise<Payload>;
    update<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(options: ManyOptions<TSlug, TSelect>): Promise<BulkOperationResult<TSlug, TSelect>>;
    /**
     * @description Update one or more documents
     * @param options
     * @returns Updated document(s)
     */
    update<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(options: ByIDOptions<TSlug, TSelect>): Promise<TransformCollectionWithSelect<TSlug, TSelect>>;
}
declare const initialized: BasePayload;

declare const reload: (config: SanitizedConfig, payload: Payload, skipImportMapGeneration?: boolean, options?: InitOptions) => Promise<void>;
/**
 * Get a payload instance.
 * This function is a wrapper around new BasePayload().init() that adds the following functionality on top of that:
 *
 * - smartly caches Payload instance on the module scope. That way, we prevent unnecessarily initializing Payload over and over again
 * when calling getPayload multiple times or from multiple locations.
 * - adds HMR support and reloads the payload instance when the config changes.
 */
declare const getPayload: (options: {
    /**
     * A unique key to identify the payload instance. You can pass your own key if you want to cache this payload instance separately.
     * This is useful if you pass a different payload config for each instance.
     *
     * @default 'default'
     */
    key?: string;
} & InitOptions) => Promise<Payload>;
type Payload = BasePayload;
interface RequestContext {
    [key: string]: unknown;
}
interface DatabaseAdapter extends BaseDatabaseAdapter {
}

interface FieldCustom extends Record<string, any> {
}
interface CollectionCustom extends Record<string, any> {
}
interface CollectionAdminCustom extends Record<string, any> {
}
interface GlobalCustom extends Record<string, any> {
}
interface GlobalAdminCustom extends Record<string, any> {
}

export { APIError, APIErrorName, Action, AuthenticationError, BasePayload, DatabaseKVAdapter, DiffMethod, DuplicateCollection, DuplicateFieldName, DuplicateGlobal, EntityType, ErrorDeletingFile, FileRetrievalError, FileUploadError, Forbidden, InMemoryKVAdapter, InvalidConfiguration, InvalidFieldName, InvalidFieldRelationship, JWTAuthentication, JobCancelledError, Locked, LockedAuth, MissingCollectionLabel, MissingEditorProp, MissingFieldInputOptions, MissingFieldType, MissingFile, NotFound, QueryError, UnauthorizedError, UnverifiedEmail, ValidationError, ValidationErrorName, _internal_jobSystemGlobals, _internal_resetJobSystemGlobals, _internal_safeFetchGlobal, accessOperation, addDataAndFileToRequest, addLocalesToRequestFromData, traverseFields$4 as afterChangeTraverseFields, promise as afterReadPromise, traverseFields$3 as afterReadTraverseFields, appendVersionToQueryKey, apiKeyFields as baseAPIKeyFields, accountLockFields as baseAccountLockFields, baseAuthFields, baseBlockFields, emailFieldConfig as baseEmailField, baseIDField, sessionsFieldConfig as baseSessionsField, usernameFieldConfig as baseUsernameField, verificationFields as baseVerificationFields, traverseFields$2 as beforeChangeTraverseFields, traverseFields$1 as beforeValidateTraverseFields, buildConfig, buildVersionCollectionFields, buildVersionCompoundIndexes, buildVersionGlobalFields, canAccessAdmin, checkDependencies, checkLoginPermission, combineQueries, commitTransaction, configToJSONSchema, countOperation, countRunnableOrActiveJobsForQueue, createArrayFromCommaDelineated, createClientCollectionConfig, createClientCollectionConfigs, createClientConfig, createClientField, createClientFields, createClientGlobalConfig, createClientGlobalConfigs, createDatabaseAdapter, createDataloaderCacheKey, createLocalReq, createMigration, createOperation, createPayloadRequest, createUnauthenticatedClientConfig, databaseKVAdapter, deepCopyObject, deepCopyObjectComplex, deepCopyObjectSimple, deepMergeSimple, deepMergeWithCombinedArrays, deepMergeWithReactComponents, deepMergeWithSourceArrays, initialized as default, defaultBeginTransaction, defaultLoggerOptions, defaults, deleteByIDOperation, deleteCollectionVersions, deleteOperation, docAccessOperation$1 as docAccessOperation, docAccessOperation as docAccessOperationGlobal, docHasTimestamps, duplicateOperation, enforceMaxVersions, entityToJSONSchema, executeAccess, executeAuthStrategies, extractAccessFromPermission, extractJWT, fieldsToJSONSchema, findByIDOperation, findMigrationDir, findOneOperation, findOperation, findUp, findUpSync, findVersionByIDOperation$1 as findVersionByIDOperation, findVersionByIDOperation as findVersionByIDOperationGlobal, findVersionsOperation$1 as findVersionsOperation, findVersionsOperation as findVersionsOperationGlobal, flattenAllFields, flattenTopLevelFields, flattenWhereToOperators, forgotPasswordOperation, formatErrors, formatLabels, formatNames, genImportMapIterateFields, generateCookie, generateExpiredPayloadCookie, generateImportMap, generatePayloadCookie, getAccessResults, getBlockSelect, getCollectionIDFieldTypes, getCookieExpiration, getCurrentDate, getDataLoader, getDefaultValue, getDependencies, getFieldByPath, getFieldsToSign, getFileByPath, getFolderData, getLatestCollectionVersion, getLatestGlobalVersion, getLocalI18n, getLocalizedPaths, getLoginOptions, getMigrations, getObjectDotNotation, getPayload, getPredefinedMigration, getQueryDraftsSort, getRequestLanguage, handleEndpoints, hasWhereAccessResult, headersWithCors, importHandlerPath, inMemoryKVAdapter, incrementLoginAttempts, initOperation, initTransaction, isEntityHidden, isPlainObject, isValidID, isolateObjectProperty, jobAfterRead, jwtSign, killTransaction, logError, loginOperation, logoutOperation, mapAsync, meOperation, mergeHeaders, migrate, migrate$1 as migrateCLI, migrateDown, migrateRefresh, migrateReset, migrateStatus, migrationTemplate, migrationsCollection, parseCookies, parseDocumentID, pathExistsAndIsAccessible, pathExistsAndIsAccessibleSync, readMigrationFiles, refreshOperation, registerFirstUserOperation, reload, resetLoginAttempts, resetPasswordOperation, restoreVersionOperation$1 as restoreVersionOperation, restoreVersionOperation as restoreVersionOperationGlobal, sanitizeConfig, sanitizeFallbackLocale, sanitizeFields, sanitizeJoinParams, sanitizeLocales, sanitizePopulateParam, sanitizeSelectParam, saveVersion, serverOnlyAdminConfigProperties, serverOnlyConfigProperties, serverProps, slugField, sortableFieldTypes, stripUnselectedFields, toWords, traverseFields, unlockOperation, updateByIDOperation, updateOperation$1 as updateOperation, updateOperation as updateOperationGlobal, validateBlocksFilterOptions, validateQueryPaths, validateSearchParam, validations, verifyEmailOperation, versionDefaults, withNullableJSONSchemaType, writeMigrationIndex };
export type { Access, AccessArgs, AccessResult, AdminClient, AdminComponent, AdminDependencies, AdminFunction, AdminViewClientProps, AdminViewComponent, AdminViewConfig, AdminViewServerProps as AdminViewProps, AdminViewServerProps, AdminViewServerPropsOnly, AfterErrorHook$1 as AfterErrorHook, AfterErrorHookArgs, AfterErrorResult, AfterFolderListClientProps, AfterFolderListServerProps, AfterFolderListServerPropsOnly, AfterFolderListTableClientProps, AfterFolderListTableServerProps, AfterFolderListTableServerPropsOnly, AfterListClientProps, AfterListServerProps, AfterListServerPropsOnly, AfterListTableClientProps, AfterListTableServerProps, AfterListTableServerPropsOnly, AllOperations, AllowList, ApplyDisableErrors, ArrayField, ArrayFieldClient, ArrayFieldClientComponent, ArrayFieldClientProps, ArrayFieldDescriptionClientComponent, ArrayFieldDescriptionServerComponent, ArrayFieldDiffClientComponent, ArrayFieldDiffServerComponent, ArrayFieldErrorClientComponent, ArrayFieldErrorServerComponent, ArrayFieldLabelClientComponent, ArrayFieldLabelServerComponent, ArrayFieldServerComponent, ArrayFieldServerProps, ArrayFieldValidation, Auth, AuthCollection, AuthCollectionSlug, AuthOperations, AuthOperationsFromCollectionSlug, AuthStrategy, AuthStrategyFunction, AuthStrategyFunctionArgs, AuthStrategyResult, BaseDatabaseAdapter, BaseFilter, BaseJob, BaseListFilter, BaseLocalizationConfig, BaseValidateOptions, BaseVersionField, BeforeDocumentControlsClientProps, BeforeDocumentControlsServerProps, BeforeDocumentControlsServerPropsOnly, BeforeFolderListClientProps, BeforeFolderListServerProps, BeforeFolderListServerPropsOnly, BeforeFolderListTableClientProps, BeforeFolderListTableServerProps, BeforeFolderListTableServerPropsOnly, BeforeListClientProps, BeforeListServerProps, BeforeListServerPropsOnly, BeforeListTableClientProps, BeforeListTableServerProps, BeforeListTableServerPropsOnly, BeginTransaction, BinScript, BinScriptConfig, Block, BlockJSX, BlockPermissions, BlockRowLabelClientComponent, BlockRowLabelServerComponent, BlockSlug, BlocksField, BlocksFieldClient, BlocksFieldClientComponent, BlocksFieldClientProps, BlocksFieldDescriptionClientComponent, BlocksFieldDescriptionServerComponent, BlocksFieldDiffClientComponent, BlocksFieldDiffServerComponent, BlocksFieldErrorClientComponent, BlocksFieldErrorServerComponent, BlocksFieldLabelClientComponent, BlocksFieldLabelServerComponent, BlocksFieldServerComponent, BlocksFieldServerProps, BlocksFieldValidation, BlocksPermissions, BuildCollectionFolderViewResult, BuildFormStateArgs, BuildTableStateArgs, BulkOperationResult, CORSConfig, CheckboxField, CheckboxFieldClient, CheckboxFieldClientComponent, CheckboxFieldClientProps, CheckboxFieldDescriptionClientComponent, CheckboxFieldDescriptionServerComponent, CheckboxFieldDiffClientComponent, CheckboxFieldDiffServerComponent, CheckboxFieldErrorClientComponent, CheckboxFieldErrorServerComponent, CheckboxFieldLabelClientComponent, CheckboxFieldLabelServerComponent, CheckboxFieldServerComponent, CheckboxFieldServerProps, CheckboxFieldValidation, ClientBlock, ClientCollectionConfig, ClientComponentProps, ClientConfig, ClientField, ClientFieldBase, ClientFieldProps, ClientFieldSchemaMap, ClientFieldWithOptionalType, ClientGlobalConfig, DocumentViewClientProps as ClientSideEditViewProps, ClientTab, ClientUser, ClientWidget, CodeField, CodeFieldClient, CodeFieldClientComponent, CodeFieldClientProps, CodeFieldDescriptionClientComponent, CodeFieldDescriptionServerComponent, CodeFieldDiffClientComponent, CodeFieldDiffServerComponent, CodeFieldErrorClientComponent, CodeFieldErrorServerComponent, CodeFieldLabelClientComponent, CodeFieldLabelServerComponent, CodeFieldServerComponent, CodeFieldServerProps, CodeFieldValidation, CollapsedPreferences, CollapsibleField, CollapsibleFieldClient, CollapsibleFieldClientComponent, CollapsibleFieldClientProps, CollapsibleFieldDescriptionClientComponent, CollapsibleFieldDescriptionServerComponent, CollapsibleFieldDiffClientComponent, CollapsibleFieldDiffServerComponent, CollapsibleFieldErrorClientComponent, CollapsibleFieldErrorServerComponent, CollapsibleFieldLabelClientComponent, CollapsibleFieldLabelServerComponent, CollapsibleFieldServerComponent, CollapsibleFieldServerProps, Collection, CollectionAdminCustom, CollectionAdminOptions, AfterChangeHook as CollectionAfterChangeHook, AfterDeleteHook as CollectionAfterDeleteHook, AfterErrorHook as CollectionAfterErrorHook, AfterForgotPasswordHook as CollectionAfterForgotPasswordHook, AfterLoginHook as CollectionAfterLoginHook, AfterLogoutHook as CollectionAfterLogoutHook, AfterMeHook as CollectionAfterMeHook, AfterOperationHook as CollectionAfterOperationHook, AfterReadHook as CollectionAfterReadHook, AfterRefreshHook as CollectionAfterRefreshHook, BeforeChangeHook as CollectionBeforeChangeHook, BeforeDeleteHook as CollectionBeforeDeleteHook, BeforeLoginHook as CollectionBeforeLoginHook, BeforeOperationHook as CollectionBeforeOperationHook, BeforeReadHook as CollectionBeforeReadHook, BeforeValidateHook as CollectionBeforeValidateHook, CollectionConfig, CollectionCustom, MeHook as CollectionMeHook, CollectionPermission, CollectionPreferences, RefreshHook as CollectionRefreshHook, CollectionSlug, Column, ColumnPreference, CommitTransaction, CompoundIndex, ConcurrencyConfig, Condition, ConditionalDateProps, Config, ConfirmPasswordFieldValidation, Connect, Count, CountArgs, CountGlobalVersionArgs, CountGlobalVersions, CountVersions, Create, CreateArgs, CreateClientConfigArgs, CreateGlobal, CreateGlobalArgs, CreateGlobalVersion, CreateGlobalVersionArgs, CreateMigration, CreateVersion, CreateVersionArgs, CustomComponent, CustomDocumentViewConfig, CustomPayloadRequestProperties, CustomComponent as CustomPreviewButton, CustomComponent as CustomPublishButton, CustomComponent as CustomSaveButton, CustomComponent as CustomSaveDraftButton, CustomStatus, CustomUpload, CustomVersionParser, DBIdentifierName, DashboardConfig, Data, DataFromCollectionSlug, DataFromGlobalSlug, DatabaseAdapter, DatabaseAdapterResult as DatabaseAdapterObj, DatabaseKVAdapterOptions, DateField, DateFieldClient, DateFieldClientComponent, DateFieldClientProps, DateFieldDescriptionClientComponent, DateFieldDescriptionServerComponent, DateFieldDiffClientComponent, DateFieldDiffServerComponent, DateFieldErrorClientComponent, DateFieldErrorServerComponent, DateFieldLabelClientComponent, DateFieldLabelServerComponent, DateFieldServerComponent, DateFieldServerProps, DateFieldValidation, DayPickerProps, DefaultCellComponentProps, DefaultDocumentIDType, DefaultDocumentViewConfig, DefaultServerCellComponentProps, DefaultServerFunctionArgs, DefaultValue, DeleteMany, DeleteManyArgs, DeleteOne, DeleteOneArgs, DeleteVersions, DeleteVersionsArgs, Description, DescriptionFunction, Destroy, Document, DocumentEvent, DocumentPermissions, DocumentPreferences, DocumentSlots, DocumentSubViewTypes, DocumentTabClientProps, DocumentTabComponent, DocumentTabCondition, DocumentTabConfig, DocumentTabServerProps as DocumentTabProps, DocumentTabServerProps, DocumentTabServerPropsOnly, DocumentViewClientProps, DocumentViewComponent, DocumentViewConfig, DocumentViewServerProps, DocumentViewServerPropsOnly, DraftTransformCollectionWithSelect, EditConfig, EditConfigWithRoot, EditConfigWithoutRoot, EditMenuItemsClientProps, EditMenuItemsServerProps, EditMenuItemsServerPropsOnly, EditViewComponent, EditViewConfig, EditViewProps, EmailAdapter, EmailField, EmailFieldClient, EmailFieldClientComponent, EmailFieldClientProps, EmailFieldDescriptionClientComponent, EmailFieldDescriptionServerComponent, EmailFieldDiffClientComponent, EmailFieldDiffServerComponent, EmailFieldErrorClientComponent, EmailFieldErrorServerComponent, EmailFieldLabelClientComponent, EmailFieldLabelServerComponent, EmailFieldServerComponent, EmailFieldServerProps, EmailFieldValidation, Endpoint, EntityDescription, EntityDescriptionComponent, EntityDescriptionFunction, EntityPolicies, ErrorResult, FetchAPIFileUploadOptions, Field, FieldAccess, FieldAffectingData, FieldAffectingDataClient, FieldBase, FieldBaseClient, FieldClientComponent, FieldCustom, FieldDescriptionClientComponent, FieldDescriptionClientProps, FieldDescriptionServerComponent, FieldDescriptionServerProps, FieldDiffClientComponent, FieldDiffClientProps, FieldDiffServerComponent, FieldDiffServerProps, FieldErrorClientComponent, FieldErrorClientProps, FieldErrorServerComponent, FieldErrorServerProps, FieldHook, FieldHookArgs, FieldLabelClientComponent, FieldLabelClientProps, FieldLabelServerComponent, FieldLabelServerProps, FieldPaths, FieldPermissions, FieldPresentationalOnly, FieldPresentationalOnlyClient, FieldRow, FieldSchemaMap, FieldServerComponent, FieldState, FieldTypes, FieldWithMany, FieldWithManyClient, FieldWithMaxDepth, FieldWithMaxDepthClient, FieldWithPath, FieldWithPathClient, FieldWithSubFields, FieldWithSubFieldsClient, FieldsPermissions, FieldsPreferences, File$1 as File, FileAllowList, FileData, FileSize, FileSizeImproved, FileSizes, FileToSave, FilterOptions, FilterOptionsProps, FilterOptionsResult, Find, FindArgs, FindDistinct, FindGlobal, FindGlobalArgs, FindGlobalVersions, FindGlobalVersionsArgs, FindOne, FindOneArgs, FindVersions, FindVersionsArgs, FlattenedArrayField, FlattenedBlock, FlattenedBlocksField, FlattenedField$1 as FlattenedField, FlattenedGroupField, FlattenedJoinField, FlattenedTabAsField, FocalPoint, FolderListViewClientProps, FolderListViewServerProps, FolderListViewServerPropsOnly, FolderListViewSlotSharedClientProps, FolderListViewSlots, FolderSortKeys, FieldState as FormField, FieldStateWithoutComponents as FormFieldWithoutComponents, FormState, FormStateWithoutComponents, GenerateImageName, GeneratePreviewURL, GenerateSchema, GeneratedTypes, GenericDescriptionProps, GenericErrorProps, GenericLabelProps, GetAdminThumbnail, GetFolderResultsComponentAndDataArgs, GlobalAdminCustom, GlobalAdminOptions, AfterChangeHook$1 as GlobalAfterChangeHook, AfterReadHook$1 as GlobalAfterReadHook, BeforeChangeHook$1 as GlobalBeforeChangeHook, BeforeOperationHook$1 as GlobalBeforeOperationHook, BeforeReadHook$1 as GlobalBeforeReadHook, BeforeValidateHook$1 as GlobalBeforeValidateHook, GlobalConfig, GlobalCustom, GlobalPermission, GlobalSlug, GraphQLExtension, GraphQLInfo, GroupField, GroupFieldClient, GroupFieldClientComponent, GroupFieldClientProps, GroupFieldDescriptionClientComponent, GroupFieldDescriptionServerComponent, GroupFieldDiffClientComponent, GroupFieldDiffServerComponent, GroupFieldErrorClientComponent, GroupFieldErrorServerComponent, GroupFieldLabelClientComponent, GroupFieldLabelServerComponent, GroupFieldServerComponent, GroupFieldServerProps, HiddenFieldProps, HookName, HookOperationType, IfAny, ImageSize, ImageUploadFormatOptions, ImageUploadTrimOptions, ImportMap, ImportMapGenerators, IncomingAuthType, Init, InitOptions, InitPageResult, InsideFieldsPreferences, IsAny, JSONField, JSONFieldClient, JSONFieldClientComponent, JSONFieldClientProps, JSONFieldDescriptionClientComponent, JSONFieldDescriptionServerComponent, JSONFieldDiffClientComponent, JSONFieldDiffServerComponent, JSONFieldErrorClientComponent, JSONFieldErrorServerComponent, JSONFieldLabelClientComponent, JSONFieldLabelServerComponent, JSONFieldServerComponent, JSONFieldServerProps, JSONFieldValidation, Job, JobLog, JobTaskStatus, JobsConfig, JoinField, JoinFieldClient, JoinFieldClientComponent, JoinFieldClientProps, JoinFieldDescriptionClientComponent, JoinFieldDescriptionServerComponent, JoinFieldDiffClientComponent, JoinFieldDiffServerComponent, JoinFieldErrorClientComponent, JoinFieldErrorServerComponent, JoinFieldLabelClientComponent, JoinFieldLabelServerComponent, JoinFieldServerComponent, JoinFieldServerProps, JoinQuery, JsonArray, JsonObject, JsonValue, KVAdapter, KVAdapterResult, KVStoreValue, LabelFunction, Labels, LabelsClient, LanguageOptions, CollectionPreferences as ListPreferences, ListQuery, ListViewClientProps, ListViewServerProps, ListViewServerPropsOnly, ListViewSlotSharedClientProps, ListViewSlots, LivePreviewConfig, LivePreviewURLType, Locale, LocalizationConfig, LocalizationConfigWithLabels, LocalizationConfigWithNoLabels, LoginWithUsernameOptions, MappedClientComponent, MappedEmptyComponent, MappedServerComponent, MaybePromise, MeOperationResult, MetaConfig, Migration, MigrationData, MigrationTemplateArgs, NamedGroupField, NamedGroupFieldClient, NamedTab, NavGroupPreferences, NavPreferences, NonPresentationalField, NonPresentationalFieldClient, NumberField, NumberFieldClient, NumberFieldClientComponent, NumberFieldClientProps, NumberFieldDescriptionClientComponent, NumberFieldDescriptionServerComponent, NumberFieldDiffClientComponent, NumberFieldDiffServerComponent, NumberFieldErrorClientComponent, NumberFieldErrorServerComponent, NumberFieldLabelClientComponent, NumberFieldLabelServerComponent, NumberFieldManyValidation, NumberFieldServerComponent, NumberFieldServerProps, NumberFieldSingleValidation, NumberFieldValidation, OGImageConfig, Operation, Operator, Option, OptionLabel, OptionObject, OrderableEndpointBody, PaginatedDistinctDocs, PaginatedDocs, Params, PasswordFieldValidation, PathToQuery, Payload, PayloadClientComponentProps, PayloadClientReactComponent, PayloadComponent, PayloadComponentProps, EmailAdapter as PayloadEmailAdapter, PayloadHandler, PayloadReactComponent, PayloadRequest, PayloadServerAction, PayloadServerComponentProps, PayloadServerReactComponent, PayloadTypes, PayloadTypesShape, Permission, Permissions, PickPreserveOptional, Plugin, PointField, PointFieldClient, PointFieldClientComponent, PointFieldClientProps, PointFieldDescriptionClientComponent, PointFieldDescriptionServerComponent, PointFieldDiffClientComponent, PointFieldDiffServerComponent, PointFieldErrorClientComponent, PointFieldErrorServerComponent, PointFieldLabelClientComponent, PointFieldLabelServerComponent, PointFieldServerComponent, PointFieldServerProps, PointFieldValidation, PolymorphicRelationshipField, PolymorphicRelationshipFieldClient, PopulateType, PreferenceRequest, PreferenceUpdateRequest, PreviewButtonClientProps, PreviewButtonServerProps, PreviewButtonServerPropsOnly, ProbedImageSize, PublishButtonClientProps, PublishButtonServerProps, PublishButtonServerPropsOnly, QueryDrafts, QueryDraftsArgs, QueryPreset, RadioField, RadioFieldClient, RadioFieldClientComponent, RadioFieldClientProps, RadioFieldDescriptionClientComponent, RadioFieldDescriptionServerComponent, RadioFieldDiffClientComponent, RadioFieldDiffServerComponent, RadioFieldErrorClientComponent, RadioFieldErrorServerComponent, RadioFieldLabelClientComponent, RadioFieldLabelServerComponent, RadioFieldServerComponent, RadioFieldServerProps, RadioFieldValidation, RawPayloadComponent, RelationshipField, RelationshipFieldClient, RelationshipFieldClientComponent, RelationshipFieldClientProps, RelationshipFieldDescriptionClientComponent, RelationshipFieldDescriptionServerComponent, RelationshipFieldDiffClientComponent, RelationshipFieldDiffServerComponent, RelationshipFieldErrorClientComponent, RelationshipFieldErrorServerComponent, RelationshipFieldLabelClientComponent, RelationshipFieldLabelServerComponent, RelationshipFieldManyValidation, RelationshipFieldServerComponent, RelationshipFieldServerProps, RelationshipFieldSingleValidation, RelationshipFieldValidation, RelationshipValue, RenderConfigArgs, RenderDocumentVersionsProperties, RenderEntityConfigArgs, RenderFieldConfigArgs, RenderRootConfigArgs, RenderedField, ReplaceAny, RequestContext, RequiredDataFromCollection, RequiredDataFromCollectionSlug, ResolvedComponent, ResolvedFilterOptions, RichTextAdapter, RichTextAdapterProvider, RichTextField, RichTextFieldClient, RichTextFieldClientComponent, RichTextFieldClientProps, RichTextFieldDescriptionClientComponent, RichTextFieldDescriptionServerComponent, RichTextFieldDiffClientComponent, RichTextFieldDiffServerComponent, RichTextFieldErrorClientComponent, RichTextFieldErrorServerComponent, RichTextFieldLabelClientComponent, RichTextFieldLabelServerComponent, RichTextFieldServerComponent, RichTextFieldServerProps, RichTextFieldValidation, RichTextHooks, RollbackTransaction, RootLivePreviewConfig, Row, RowField, RowFieldClient, RowFieldClientComponent, RowFieldClientProps, RowFieldDescriptionClientComponent, RowFieldDescriptionServerComponent, RowFieldDiffClientComponent, RowFieldDiffServerComponent, RowFieldErrorClientComponent, RowFieldErrorServerComponent, RowFieldLabelClientComponent, RowFieldLabelServerComponent, RowFieldServerComponent, RowFieldServerProps, RowLabel, RowLabelComponent, RunInlineTaskFunction, RunJobAccess, RunJobAccessArgs, RunTaskFunction, RunTaskFunctions, RunningJob, SanitizedBlockPermissions, SanitizedBlocksPermissions, SanitizedCollectionConfig, SanitizedCollectionPermission, SanitizedCompoundIndex, SanitizedConfig, SanitizedDashboardConfig, SanitizedDocumentPermissions, SanitizedFieldPermissions, SanitizedFieldsPermissions, SanitizedGlobalConfig, SanitizedGlobalPermission, SanitizedJoins, SanitizedLabelProps, SanitizedLocalizationConfig, SanitizedPermissions, SanitizedUploadConfig, SaveButtonClientProps, SaveButtonServerProps, SaveButtonServerPropsOnly, SaveDraftButtonClientProps, SaveDraftButtonServerProps, SaveDraftButtonServerPropsOnly, SchedulePublish, SchedulePublishTaskInput, SelectExcludeType, SelectField, SelectFieldClient, SelectFieldClientComponent, SelectFieldClientProps, SelectFieldDescriptionClientComponent, SelectFieldDescriptionServerComponent, SelectFieldDiffClientComponent, SelectFieldDiffServerComponent, SelectFieldErrorClientComponent, SelectFieldErrorServerComponent, SelectFieldLabelClientComponent, SelectFieldLabelServerComponent, SelectFieldManyValidation, SelectFieldServerComponent, SelectFieldServerProps, SelectFieldSingleValidation, SelectFieldValidation, SelectIncludeType, SelectMode, SelectType, SendEmailOptions, ServerComponentProps, ServerFieldBase, ServerFunction, ServerFunctionArgs, ServerFunctionClient, ServerFunctionClientArgs, ServerFunctionConfig, ServerFunctionHandler, ServerOnlyCollectionAdminProperties, ServerOnlyCollectionProperties, ServerOnlyFieldAdminProperties, ServerOnlyFieldProperties, ServerOnlyGlobalAdminProperties, ServerOnlyGlobalProperties, ServerOnlyLivePreviewProperties, ServerOnlyUploadProperties, ServerProps, ServerPropsFromView, DocumentViewServerProps as ServerSideEditViewProps, SharedProps, SharpDependency, SingleRelationshipField, SingleRelationshipFieldClient, SingleTaskStatus, SlugField, SlugFieldClientProps, SlugifyServerFunctionArgs, Sort, StaticDescription, StaticLabel, StringKeyOf, Tab, TabAsField, TabAsFieldClient, TabsField, TabsFieldClient, TabsFieldClientComponent, TabsFieldClientProps, TabsFieldDescriptionClientComponent, TabsFieldDescriptionServerComponent, TabsFieldDiffClientComponent, TabsFieldDiffServerComponent, TabsFieldErrorClientComponent, TabsFieldErrorServerComponent, TabsFieldLabelClientComponent, TabsFieldLabelServerComponent, TabsFieldServerComponent, TabsFieldServerProps, TabsPreferences, TaskConfig, TaskHandler, TaskHandlerArgs, TaskHandlerResult, TaskHandlerResults, TaskInput, TaskOutput, TaskType, TextField, TextFieldClient, TextFieldClientComponent, TextFieldClientProps, TextFieldDescriptionClientComponent, TextFieldDescriptionServerComponent, TextFieldDiffClientComponent, TextFieldDiffServerComponent, TextFieldErrorClientComponent, TextFieldErrorServerComponent, TextFieldLabelClientComponent, TextFieldLabelServerComponent, TextFieldManyValidation, TextFieldServerComponent, TextFieldServerProps, TextFieldSingleValidation, TextFieldValidation, TextareaField, TextareaFieldClient, TextareaFieldClientComponent, TextareaFieldClientProps, TextareaFieldDescriptionClientComponent, TextareaFieldDescriptionServerComponent, TextareaFieldDiffClientComponent, TextareaFieldDiffServerComponent, TextareaFieldErrorClientComponent, TextareaFieldErrorServerComponent, TextareaFieldLabelClientComponent, TextareaFieldLabelServerComponent, TextareaFieldServerComponent, TextareaFieldServerProps, TextareaFieldValidation, TimePickerProps, Timezone, TimezonesConfig, Transaction, TransformCollectionWithSelect, TransformDataWithSelect, TransformGlobalWithSelect, TraverseFieldsCallback, TypeWithID, TypeWithTimestamps, TypeWithVersion, TypedAuthOperations, TypedBlock, TypedCollection, TypedCollectionJoins, TypedCollectionSelect, TypedFallbackLocale, TypedGlobal, TypedGlobalSelect, TypedJobs, TypedLocale, TypedUploadCollection, TypedUser, UIField, UIFieldClient, UIFieldClientComponent, UIFieldClientProps, UIFieldDiffClientComponent, UIFieldDiffServerComponent, UIFieldServerComponent, UIFieldServerProps, UnauthenticatedClientConfig, UnnamedGroupField, UnnamedGroupFieldClient, UnnamedTab, UntypedPayloadTypes, UntypedUser, UpdateGlobal, UpdateGlobalArgs, UpdateGlobalVersion, UpdateGlobalVersionArgs, UpdateJobs, UpdateJobsArgs, UpdateMany, UpdateManyArgs, UpdateOne, UpdateOneArgs, UpdateVersion, UpdateVersionArgs, UploadCollectionSlug, UploadConfig, UploadEdits, UploadField, UploadFieldClient, UploadFieldClientComponent, UploadFieldClientProps, UploadFieldDescriptionClientComponent, UploadFieldDescriptionServerComponent, UploadFieldDiffClientComponent, UploadFieldDiffServerComponent, UploadFieldErrorClientComponent, UploadFieldErrorServerComponent, UploadFieldLabelClientComponent, UploadFieldLabelServerComponent, UploadFieldManyValidation, UploadFieldServerComponent, UploadFieldServerProps, UploadFieldSingleValidation, UploadFieldValidation, Upsert, UpsertArgs, UntypedUser as User, UserSession, UsernameFieldValidation, Validate, ValidateOptions, ValidationFieldError, ValueWithRelation, VerifyConfig, VersionField, VersionOperations, VersionTab, ViewDescriptionClientProps, ViewDescriptionServerProps, ViewDescriptionServerPropsOnly, ViewTypes, VisibleEntities, Where, WhereField, Widget, WidgetInstance, WidgetServerProps, WidgetWidth, WithServerSidePropsComponent, WithServerSidePropsComponentProps, WorkflowConfig, WorkflowHandler, WorkflowTypes, checkFileRestrictionsParams };
