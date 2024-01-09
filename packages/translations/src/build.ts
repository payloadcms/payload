import * as fs from 'fs'
import * as path from 'path'
import { transpileAndCopy } from './utilities/transpileAndCopy'
import { ensureDirectoryExists } from './utilities/ensureDirExists'

const serverTranslationKeys = [
  'authentication:api',
  'authentication:apiKey',
  'authentication:enableAPIKey',
  'authentication:newAccountCreated',
  'authentication:resetYourPassword',
  'authentication:verifyYourEmail',
  'authentication:youAreReceivingResetPassword',
  'authentication:youDidNotRequestPassword',
  'authentication:verified',

  'general:createdAt',
  'general:deletedCountSuccessfully',
  'general:deletedSuccessfully',
  'general:email',
  'general:notFound',
  'general:successfullyCreated',
  'general:thisLanguage',
  'general:user',
  'general:users',
  'general:updatedAt',
  'general:updatedCountSuccessfully',
  'general:value',

  'error:deletingFile',
  'error:emailOrPasswordIncorrect',
  'error:followingFieldsInvalid',
  'error:noFilesUploaded',
  'error:notAllowedToPerformAction',
  'error:problemUploadingFile',
  'error:unableToDeleteCount',
  'error:unableToUpdateCount',
  'error:unauthorized',
  'error:userLocked',
  'error:valueMustBeUnique',

  'upload:width',
  'upload:height',
  'upload:fileSize',
  'upload:fileName',
  'upload:sizes',

  'validation:emailAddress',
  'validation:enterNumber',
  'validation:greaterThanMax',
  'validation:invalidInput',
  'validation:invalidSelection',
  'validation:invalidSelections',
  'validation:lessThanMin',
  'validation:longerThanMin',
  'validation:notValidDate',
  'validation:requiresNoMoreThan',
  'validation:requiresTwoNumbers',
  'validation:shorterThanMax',
  'validation:trueOrFalse',
  'validation:validUploadID',

  'version:autosavedSuccessfully',
  'version:draftSavedSuccessfully',
  'version:restoredSuccessfully',
  'version:draft',
  'version:published',
  'version:status',
]

const clientTranslationKeys = [
  'authentication:account',
  'authentication:accountOfCurrentUser',
  'authentication:alreadyActivated',
  'authentication:alreadyLoggedIn',
  'authentication:backToLogin',
  'authentication:beginCreateFirstUser',
  'authentication:changePassword',
  'authentication:confirmGeneration',
  'authentication:confirmPassword',
  'authentication:emailNotValid',
  'authentication:emailSent',
  'authentication:enableAPIKey',
  'authentication:failedToUnlock',
  'authentication:forceUnlock',
  'authentication:forgotPassword',
  'authentication:forgotPasswordEmailInstructions',
  'authentication:forgotPasswordQuestion',
  'authentication:generate',
  'authentication:generateNewAPIKey',
  'authentication:logBackIn',
  'authentication:loggedOutInactivity',
  'authentication:loggedOutSuccessfully',
  'authentication:login',
  'authentication:logOut',
  'authentication:logout',
  'authentication:logoutUser',
  'authentication:newAPIKeyGenerated',
  'authentication:newPassword',
  'authentication:resetPassword',
  'authentication:stayLoggedIn',
  'authentication:successfullyUnlocked',
  'authentication:unableToVerify',
  'authentication:verified',
  'authentication:verifiedSuccessfully',
  'authentication:verify',
  'authentication:verifyUser',
  'authentication:youAreInactive',

  'error:autosaving',
  'error:correctInvalidFields',
  'error:deletingTitle',
  'error:loadingDocument',
  'error:localesNotSaved',
  'error:noMatchedField',
  'error:notAllowedToAccessPage',
  'error:previewing',
  'error:unableToDeleteCount',
  'error:unableToUpdateCount',
  'error:unknown',
  'error:unspecific',

  'fields:addLabel',
  'fields:addNew',
  'fields:addNewLabel',
  'fields:block',
  'fields:blocks',
  'fields:blockType',
  'fields:chooseFromExisting',
  'fields:collapseAll',
  'fields:itemsAndMore',
  'fields:latitude',
  'fields:longitude',
  'fields:passwordsDoNotMatch',
  'fields:searchForBlock',
  'fields:selectFieldsToEdit',
  'fields:showAll',
  'fields:uploadNewLabel',

  'general:aboutToDeleteCount',
  'general:addBelow',
  'general:addFilter',
  'general:adminTheme',
  'general:and',
  'general:applyChanges',
  'general:ascending',
  'general:automatic',
  'general:backToDashboard',
  'general:cancel',
  'general:changesNotSaved',
  'general:close',
  'general:collapse',
  'general:collections',
  'general:columns',
  'general:columnToSort',
  'general:confirm',
  'general:confirmDeletion',
  'general:confirmDuplication',
  'general:copied',
  'general:copy',
  'general:create',
  'general:created',
  'general:createNew',
  'general:createNewLabel',
  'general:creating',
  'general:creatingNewLabel',
  'general:dark',
  'general:dashboard',
  'general:delete',
  'general:deletedCountSuccessfully',
  'general:deleting',
  'general:descending',
  'general:deselectAllRows',
  'general:duplicate',
  'general:duplicateWithoutSaving',
  'general:edit',
  'general:editing',
  'general:editingLabel',
  'general:editLabel',
  'general:email',
  'general:emailAddress',
  'general:enterAValue',
  'general:error',
  'general:errors',
  'general:fallbackToDefaultLocale',
  'general:filters',
  'general:filterWhere',
  'general:globals',
  'general:language',
  'general:lastModified',
  'general:lastSavedAgo',
  'general:leaveAnyway',
  'general:leaveWithoutSaving',
  'general:light',
  'general:livePreview',
  'general:loading',
  'general:locale',
  'general:menu',
  'general:moveDown',
  'general:moveUp',
  'general:noFiltersSet',
  'general:noLabel',
  'general:none',
  'general:noOptions',
  'general:noResults',
  'general:notFound',
  'general:nothingFound',
  'general:noValue',
  'general:of',
  'general:open',
  'general:or',
  'general:order',
  'general:pageNotFound',
  'general:password',
  'general:payloadSettings',
  'general:perPage',
  'general:remove',
  'general:reset',
  'general:row',
  'general:rows',
  'general:save',
  'general:saving',
  'general:searchBy',
  'general:selectAll',
  'general:selectAllRows',
  'general:selectedCount',
  'general:selectValue',
  'general:showAllLabel',
  'general:sorryNotFound',
  'general:sort',
  'general:sortByLabelDirection',
  'general:stayOnThisPage',
  'general:submissionSuccessful',
  'general:submit',
  'general:successfullyCreated',
  'general:successfullyDeleted',
  'general:successfullyDuplicated',
  'general:thisLanguage',
  'general:titleDeleted',
  'general:toggleBlock',
  'general:unauthorized',
  'general:unsavedChangesDuplicate',
  'general:untitled',
  'general:updatedAt',
  'general:updatedCountSuccessfully',
  'general:updatedSuccessfully',
  'general:updating',
  'general:welcome',

  'upload:crop',
  'upload:cropToolDescription',
  'upload:dragAndDrop',
  'upload:editImage',
  'upload:focalPoint',
  'upload:focalPointDescription',
  'upload:height',
  'upload:previewSizes',
  'upload:selectCollectionToBrowse',
  'upload:selectFile',
  'upload:setCropArea',
  'upload:setFocalPoint',
  'upload:sizesFor',
  'upload:width',

  'validation:fieldHasNo',
  'validation:limitReached',
  'validation:required',
  'validation:requiresAtLeast',

  'version:aboutToPublishSelection',
  'version:aboutToRestore',
  'version:aboutToRestoreGlobal',
  'version:aboutToUnpublishSelection',
  'version:autosave',
  'version:autosavedSuccessfully',
  'version:compareVersion',
  'version:confirmPublish',
  'version:confirmUnpublish',
  'version:confirmVersionRestoration',
  'version:draft',
  'version:draftSavedSuccessfully',
  'version:noFurtherVersionsFound',
  'version:noRowsFound',
  'version:preview',
  'version:problemRestoringVersion',
  'version:publish',
  'version:publishChanges',
  'version:published',
  'version:publishing',
  'version:restoredSuccessfully',
  'version:restoreThisVersion',
  'version:restoring',
  'version:saveDraft',
  'version:selectLocales',
  'version:selectVersionToCompare',
  'version:showLocales',
  'version:type',
  'version:unpublish',
  'version:unpublishing',
  'version:versionCreatedOn',
  'version:versionID',
  'version:versions',
  'version:viewingVersion',
  'version:viewingVersionGlobal',
  'version:viewingVersions',
  'version:viewingVersionsGlobal',
]

const DESTINATION_ROOT = '../dist'
const SOURCE_DIR = './all'

function filterKeys(obj, parentGroupKey = '', keys) {
  const result = {}

  for (const [namespaceKey, value] of Object.entries(obj)) {
    // Skip $schema key
    if (namespaceKey === '$schema') {
      result[namespaceKey] = value
      continue
    }

    if (typeof value === 'object') {
      const filteredObject = filterKeys(value, namespaceKey, keys)
      if (Object.keys(filteredObject).length > 0) {
        result[namespaceKey] = filteredObject
      }
    } else {
      for (const key of keys) {
        const [groupKey, selector] = key.split(':')

        if (parentGroupKey === groupKey) {
          if (namespaceKey === selector) {
            result[selector] = value
          } else {
            const pluralKeys = ['zero', 'one', 'two', 'few', 'many', 'other']
            pluralKeys.forEach((pluralKey) => {
              if (namespaceKey === `${selector}_${pluralKey}`) {
                result[`${selector}_${pluralKey}`] = value
              }
            })
          }
        }
      }
    }
  }

  return result
}

function sortObject(obj) {
  const sortedObject = {}
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      if (typeof obj[key] === 'object') {
        sortedObject[key] = sortObject(obj[key])
      } else {
        sortedObject[key] = obj[key]
      }
    })
  return sortedObject
}

function buildSchemaFile(type: 'client' | 'server') {
  const groupedProperties = new Map()

  const keys = type === 'client' ? clientTranslationKeys : serverTranslationKeys
  const DESTINATION_DIR = `${DESTINATION_ROOT}/${type === 'client' ? 'client' : 'api'}`

  for (const translationKey of keys) {
    const [group, selector] = translationKey.split(':')
    groupedProperties.set(group, groupedProperties.get(group) || new Set())
    groupedProperties.get(group).add(selector)

    const pluralKeys = ['zero', 'one', 'two', 'few', 'many', 'other']
    pluralKeys.forEach((pluralKey) => {
      groupedProperties.get(group).add(`${selector}_${pluralKey}`)
    })
  }

  const schemaFileContents = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, SOURCE_DIR, 'translation-schema.json'), 'utf8'),
  )

  for (const [group, selectors] of groupedProperties.entries()) {
    const groupProperties = schemaFileContents.properties[group]

    const remainingProperties = {}
    const remainingRequired: string[] = []
    for (const selector of selectors) {
      if (groupProperties.properties?.[selector]) {
        remainingProperties[selector] = groupProperties.properties[selector]
        if (groupProperties.required && groupProperties.required.includes(selector)) {
          remainingRequired.push(selector)
        }
      }
    }

    groupProperties.properties = remainingProperties
    if (remainingRequired.length) {
      groupProperties.required = remainingRequired
    } else {
      delete groupProperties.required
    }
  }

  schemaFileContents.required = Array.from(groupedProperties.keys())

  fs.writeFileSync(
    path.resolve(__dirname, DESTINATION_DIR, 'translation-schema.json'),
    JSON.stringify(schemaFileContents, null, 2),
    { flag: 'w+' },
  )
}

async function build() {
  ensureDirectoryExists(path.resolve(__dirname, `${DESTINATION_ROOT}/client`))
  ensureDirectoryExists(path.resolve(__dirname, `${DESTINATION_ROOT}/api`))

  const filenames = fs.readdirSync(path.resolve(__dirname, SOURCE_DIR))

  // build up the client and server translation files
  for (const filename of filenames) {
    if (!filename.endsWith('.json') || filename === 'translation-schema.json') {
      continue
    }

    const source = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, SOURCE_DIR, filename), 'utf8'),
    )

    const clientTranslations = sortObject(filterKeys(source, '', clientTranslationKeys))
    fs.writeFileSync(
      path.resolve(__dirname, `${DESTINATION_ROOT}/client`, filename),
      JSON.stringify(clientTranslations, null, 2),
      {
        flag: 'w+',
      },
    )

    const serverTranslations = sortObject(filterKeys(source, '', serverTranslationKeys))
    fs.writeFileSync(
      path.resolve(__dirname, `${DESTINATION_ROOT}/api`, filename),
      JSON.stringify(serverTranslations, null, 2),
      {
        flag: 'w+',
      },
    )

    console.info(filename, ': sync complete')
  }

  // build up the client and server schema files after the translation files have been built
  buildSchemaFile('client')
  buildSchemaFile('server')

  // copy barrel files
  await transpileAndCopy(
    path.resolve(__dirname, SOURCE_DIR, 'index.ts'),
    path.resolve(__dirname, `${DESTINATION_ROOT}/api`, 'index.ts'),
  )
  await transpileAndCopy(
    path.resolve(__dirname, SOURCE_DIR, 'index.ts'),
    path.resolve(__dirname, `${DESTINATION_ROOT}/client`, 'index.ts'),
  )
}

build()
  .then(() => {
    console.log('Built client and api translation files.')
  })
  .catch((error) => {
    console.error('Error occurred:', error)
  })
