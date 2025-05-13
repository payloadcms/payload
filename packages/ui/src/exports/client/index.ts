/* eslint-disable perfectionist/sort-exports */
'use client'

// IMPORTANT: this file cannot use any wildcard exports because it is wrapped in a `use client` boundary
// IMPORTANT: do _not_ alias any of the exports in this file, this will cause a mismatch between the unbundled exports

// hooks

export { fieldComponents } from '../../fields/index.js'

export { useDebounce } from '../../hooks/useDebounce.js'
export { useDebouncedCallback } from '../../hooks/useDebouncedCallback.js'
export { useDebouncedEffect } from '../../hooks/useDebouncedEffect.js'
export { useDelay } from '../../hooks/useDelay.js'
export { useDelayedRender } from '../../hooks/useDelayedRender.js'
export { useHotkey } from '../../hooks/useHotkey.js'
export { useIntersect } from '../../hooks/useIntersect.js'
export { usePayloadAPI } from '../../hooks/usePayloadAPI.js'
export { useResize } from '../../hooks/useResize.js'
export { useThrottledEffect } from '../../hooks/useThrottledEffect.js'
export { useEffectEvent } from '../../hooks/useEffectEvent.js'

export { useUseTitleField } from '../../hooks/useUseAsTitle.js'

export { SortHeader } from '../../elements/SortHeader/index.js'
export { SortRow } from '../../elements/SortRow/index.js'
export { OrderableTable } from '../../elements/Table/OrderableTable.js'

// query preset elements
export { QueryPresetsColumnsCell } from '../../elements/QueryPresets/cells/ColumnsCell/index.js'
export { QueryPresetsWhereCell } from '../../elements/QueryPresets/cells/WhereCell/index.js'
export { QueryPresetsAccessCell } from '../../elements/QueryPresets/cells/AccessCell/index.js'
export { QueryPresetsColumnField } from '../../elements/QueryPresets/fields/ColumnsField/index.js'
export { QueryPresetsWhereField } from '../../elements/QueryPresets/fields/WhereField/index.js'

// elements
export { ConfirmationModal } from '../../elements/ConfirmationModal/index.js'
export type { OnCancel } from '../../elements/ConfirmationModal/index.js'
export { Link } from '../../elements/Link/index.js'
export { LeaveWithoutSaving } from '../../elements/LeaveWithoutSaving/index.js'
export { DocumentTakeOver } from '../../elements/DocumentTakeOver/index.js'
export { DocumentLocked } from '../../elements/DocumentLocked/index.js'
export { TableColumnsProvider, useTableColumns } from '../../providers/TableColumns/index.js'
export {
  RenderDefaultCell,
  useCellProps,
} from '../../providers/TableColumns/RenderDefaultCell/index.js'

export { Translation } from '../../elements/Translation/index.js'
export { default as DatePicker } from '../../elements/DatePicker/DatePicker.js'
export { ViewDescription } from '../../elements/ViewDescription/index.js'
export { AppHeader } from '../../elements/AppHeader/index.js'
export { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
export {
  BulkUploadDrawer,
  BulkUploadProvider,
  useBulkUpload,
  useBulkUploadDrawerSlug,
} from '../../elements/BulkUpload/index.js'
export type { BulkUploadProps } from '../../elements/BulkUpload/index.js'
export { Banner } from '../../elements/Banner/index.js'
export { Button } from '../../elements/Button/index.js'
export { Card } from '../../elements/Card/index.js'
export { Collapsible, useCollapsible } from '../../elements/Collapsible/index.js'
export { CopyLocaleData } from '../../elements/CopyLocaleData/index.js'
export { CopyToClipboard } from '../../elements/CopyToClipboard/index.js'
export { DeleteMany } from '../../elements/DeleteMany/index.js'
export { DocumentControls } from '../../elements/DocumentControls/index.js'
export { Dropzone } from '../../elements/Dropzone/index.js'
export { documentDrawerBaseClass, useDocumentDrawer } from '../../elements/DocumentDrawer/index.js'
export type {
  DocumentDrawerProps,
  DocumentTogglerProps,
  UseDocumentDrawer,
} from '../../elements/DocumentDrawer/types.js'

export { useDocumentDrawerContext } from '../../elements/DocumentDrawer/Provider.js'
export { DocumentFields } from '../../elements/DocumentFields/index.js'
export { Drawer, DrawerToggler, formatDrawerSlug } from '../../elements/Drawer/index.js'
export { useDrawerSlug } from '../../elements/Drawer/useDrawerSlug.js'
export { EditMany } from '../../elements/EditMany/index.js'
export { ErrorPill } from '../../elements/ErrorPill/index.js'
export { FullscreenModal } from '../../elements/FullscreenModal/index.js'
export { GenerateConfirmation } from '../../elements/GenerateConfirmation/index.js'
export { Gutter } from '../../elements/Gutter/index.js'
export { Hamburger } from '../../elements/Hamburger/index.js'
export { HydrateAuthProvider } from '../../elements/HydrateAuthProvider/index.js'
export { Locked } from '../../elements/Locked/index.js'
export { ListControls } from '../../elements/ListControls/index.js'
export { useListDrawer } from '../../elements/ListDrawer/index.js'
export type {
  ListDrawerProps,
  ListTogglerProps,
  UseListDrawer,
} from '../../elements/ListDrawer/types.js'
export { ListSelection } from '../../elements/ListSelection/index.js'
export { ListHeader } from '../../views/List/ListHeader/index.js'
export { LoadingOverlayToggle } from '../../elements/Loading/index.js'
export { FormLoadingOverlayToggle } from '../../elements/Loading/index.js'
export { LoadingOverlay } from '../../elements/Loading/index.js'
export { Logout } from '../../elements/Logout/index.js'
export { Modal, useModal } from '../../elements/Modal/index.js'
export { NavToggler } from '../../elements/Nav/NavToggler/index.js'
export { useNav } from '../../elements/Nav/context.js'
export { NavGroup } from '../../elements/NavGroup/index.js'
export { Pagination } from '../../elements/Pagination/index.js'
export { PerPage } from '../../elements/PerPage/index.js'
export { Pill } from '../../elements/Pill/index.js'
import * as PopupList from '../../elements/Popup/PopupButtonList/index.js'
export { PopupList }
export { Popup } from '../../elements/Popup/index.js'
export { PublishMany } from '../../elements/PublishMany/index.js'
export { PublishButton } from '../../elements/PublishButton/index.js'
export { SaveButton } from '../../elements/SaveButton/index.js'
export { SaveDraftButton } from '../../elements/SaveDraftButton/index.js'

export { type Option as ReactSelectOption, ReactSelect } from '../../elements/ReactSelect/index.js'
export { ReactSelect as Select } from '../../elements/ReactSelect/index.js'
export { RenderTitle } from '../../elements/RenderTitle/index.js'
export { ShimmerEffect } from '../../elements/ShimmerEffect/index.js'
export { StaggeredShimmers } from '../../elements/ShimmerEffect/index.js'
export { SortColumn } from '../../elements/SortColumn/index.js'
export { SetStepNav } from '../../elements/StepNav/SetStepNav.js'
export { useStepNav } from '../../elements/StepNav/index.js'
export type { StepNavItem } from '../../elements/StepNav/types.js'
export {
  RelationshipProvider,
  useListRelationships,
} from '../../elements/Table/RelationshipProvider/index.js'
export { Table } from '../../elements/Table/index.js'
export type {
  /**
   * @deprecated
   * This export will be removed in the next major version.
   * Use `import { Column } from 'payload'` instead.
   */
  Column,
} from 'payload'
export { DefaultCell } from '../../elements/Table/DefaultCell/index.js'
export { Thumbnail } from '../../elements/Thumbnail/index.js'
export { Tooltip } from '../../elements/Tooltip/index.js'
import { toast } from 'sonner'
export { toast }
export { UnpublishMany } from '../../elements/UnpublishMany/index.js'
export { Upload } from '../../elements/Upload/index.js'
export { SearchFilter } from '../../elements/SearchFilter/index.js'
export { EditUpload } from '../../elements/EditUpload/index.js'
export { FileDetails } from '../../elements/FileDetails/index.js'
export { PreviewSizes } from '../../elements/PreviewSizes/index.js'
export { PreviewButton } from '../../elements/PreviewButton/index.js'
export { RelationshipTable } from '../../elements/RelationshipTable/index.js'
export { TimezonePicker } from '../../elements/TimezonePicker/index.js'

export { BlocksDrawer } from '../../fields/Blocks/BlocksDrawer/index.js'
export { SectionTitle } from '../../fields/Blocks/SectionTitle/index.js'

// fields
export { HiddenField } from '../../fields/Hidden/index.js'
export { ArrayField } from '../../fields/Array/index.js'
export { BlocksField } from '../../fields/Blocks/index.js'
export { CheckboxField, CheckboxInput } from '../../fields/Checkbox/index.js'
export { CodeField } from '../../fields/Code/index.js'
export { CodeEditor as CodeEditorLazy } from '../../elements/CodeEditor/index.js'
export { default as CodeEdiftor } from '../../elements/CodeEditor/CodeEditor.js'

export { CollapsibleField } from '../../fields/Collapsible/index.js'
export { ConfirmPasswordField } from '../../fields/ConfirmPassword/index.js'
export { DateTimeField } from '../../fields/DateTime/index.js'
export { EmailField } from '../../fields/Email/index.js'
export { FieldDescription } from '../../fields/FieldDescription/index.js'
export { FieldError } from '../../fields/FieldError/index.js'
export { FieldLabel } from '../../fields/FieldLabel/index.js'
export { GroupField } from '../../fields/Group/index.js'
export { JSONField } from '../../fields/JSON/index.js'
export { NumberField } from '../../fields/Number/index.js'
export { PasswordField } from '../../fields/Password/index.js'
export { PointField } from '../../fields/Point/index.js'
export { RadioGroupField } from '../../fields/RadioGroup/index.js'
export { RelationshipField } from '../../fields/Relationship/index.js'
export { RichTextField } from '../../fields/RichText/index.js'
export { RowField } from '../../fields/Row/index.js'
export { SelectField, SelectInput } from '../../fields/Select/index.js'
export { TabsField, TabsProvider } from '../../fields/Tabs/index.js'
export { TabComponent } from '../../fields/Tabs/Tab/index.js'

export { TextField, TextInput } from '../../fields/Text/index.js'
export { JoinField } from '../../fields/Join/index.js'
export type { TextInputProps } from '../../fields/Text/index.js'
export { allFieldComponents } from '../../fields/index.js'

export { TextareaField, TextareaInput } from '../../fields/Textarea/index.js'
export type { TextAreaInputProps } from '../../fields/Textarea/index.js'

export { UIField } from '../../fields/UI/index.js'
export { UploadField, UploadInput } from '../../fields/Upload/index.js'
export type { UploadInputProps } from '../../fields/Upload/index.js'

export { fieldBaseClass } from '../../fields/shared/index.js'

// forms

export {
  useAllFormFields,
  useDocumentForm,
  useForm,
  useFormBackgroundProcessing,
  useFormFields,
  useFormInitializing,
  useFormModified,
  useFormProcessing,
  useFormSubmitted,
  useWatchForm,
} from '../../forms/Form/context.js'
export { Form, type FormProps } from '../../forms/Form/index.js'
export { fieldReducer } from '../../forms/Form/fieldReducer.js'
export { NullifyLocaleField } from '../../forms/NullifyField/index.js'
export { RenderFields } from '../../forms/RenderFields/index.js'
export { RowLabel, type RowLabelProps } from '../../forms/RowLabel/index.js'
export { RowLabelProvider, useRowLabel } from '../../forms/RowLabel/Context/index.js'

export { FormSubmit } from '../../forms/Submit/index.js'
export { WatchChildErrors } from '../../forms/WatchChildErrors/index.js'
export { useField } from '../../forms/useField/index.js'
export type { FieldType, Options } from '../../forms/useField/types.js'

export { withCondition } from '../../forms/withCondition/index.js'
export { WatchCondition } from '../../forms/withCondition/WatchCondition.js'

// graphics
export { Account } from '../../graphics/Account/index.js'
export { PayloadIcon } from '../../graphics/Icon/index.js'

export { DefaultBlockImage } from '../../graphics/DefaultBlockImage/index.js'
export { ExternalLinkIcon } from '../../graphics/ExternalLink/index.js'
export { File } from '../../graphics/File/index.js'

// icons
export { CalendarIcon } from '../../icons/Calendar/index.js'
export { CheckIcon } from '../../icons/Check/index.js'
export { ChevronIcon } from '../../icons/Chevron/index.js'
export { CloseMenuIcon } from '../../icons/CloseMenu/index.js'
export { CodeBlockIcon } from '../../icons/CodeBlock/index.js'
export { CopyIcon } from '../../icons/Copy/index.js'
export { DragHandleIcon } from '../../icons/DragHandle/index.js'
export { EditIcon } from '../../icons/Edit/index.js'
export { LineIcon } from '../../icons/Line/index.js'
export { LinkIcon } from '../../icons/Link/index.js'
export { LogOutIcon } from '../../icons/LogOut/index.js'
export { MenuIcon } from '../../icons/Menu/index.js'
export { MinimizeMaximizeIcon } from '../../icons/MinimizeMaximize/index.js'
export { MoreIcon } from '../../icons/More/index.js'
export { PlusIcon } from '../../icons/Plus/index.js'
export { SearchIcon } from '../../icons/Search/index.js'
export { SwapIcon } from '../../icons/Swap/index.js'
export { XIcon } from '../../icons/X/index.js'
export { Error as ErrorIcon } from '../../providers/ToastContainer/icons/Error.js'
export { Info as InfoIcon } from '../../providers/ToastContainer/icons/Info.js'
export { Success as SuccessIcon } from '../../providers/ToastContainer/icons/Success.js'
export { Warning as WarningIcon } from '../../providers/ToastContainer/icons/Warning.js'

// providers
export {
  ServerFunctionsProvider,
  useServerFunctions,
} from '../../providers/ServerFunctions/index.js'
export { ActionsProvider, useActions } from '../../providers/Actions/index.js'
export { AuthProvider, useAuth } from '../../providers/Auth/index.js'
export type { UserWithToken } from '../../providers/Auth/index.js'
export { ClientFunctionProvider, useClientFunctions } from '../../providers/ClientFunction/index.js'
export { useAddClientFunction } from '../../providers/ClientFunction/index.js'

export { ProgressBar } from '../../providers/RouteTransition/ProgressBar/index.js'
export {
  RouteTransitionProvider,
  useRouteTransition,
} from '../../providers/RouteTransition/index.js'
export { ConfigProvider, useConfig } from '../../providers/Config/index.js'
export { DocumentEventsProvider, useDocumentEvents } from '../../providers/DocumentEvents/index.js'
export { DocumentInfoProvider, useDocumentInfo } from '../../providers/DocumentInfo/index.js'
export type { DocumentInfoContext, DocumentInfoProps } from '../../providers/DocumentInfo/index.js'

export { EditDepthProvider, useEditDepth } from '../../providers/EditDepth/index.js'
export {
  EntityVisibilityProvider,
  useEntityVisibility,
} from '../../providers/EntityVisibility/index.js'
export { UploadEditsProvider, useUploadEdits } from '../../providers/UploadEdits/index.js'
export {
  ListDrawerContextProvider,
  useListDrawerContext,
} from '../../elements/ListDrawer/Provider.js'
export { ListQueryProvider, useListQuery } from '../../providers/ListQuery/index.js'
export { LocaleProvider, useLocale } from '../../providers/Locale/index.js'
export { OperationProvider, useOperation } from '../../providers/Operation/index.js'
export { ParamsProvider, useParams } from '../../providers/Params/index.js'
export { PreferencesProvider, usePreferences } from '../../providers/Preferences/index.js'
export { RootProvider } from '../../providers/Root/index.js'
export {
  RouteCache as RouteCacheProvider,
  useRouteCache,
} from '../../providers/RouteCache/index.js'
export { ScrollInfoProvider, useScrollInfo } from '../../providers/ScrollInfo/index.js'
export { SearchParamsProvider, useSearchParams } from '../../providers/SearchParams/index.js'
export { SelectionProvider, useSelection } from '../../providers/Selection/index.js'
export { UploadHandlersProvider, useUploadHandlers } from '../../providers/UploadHandlers/index.js'
export type { UploadHandlersContext } from '../../providers/UploadHandlers/index.js'
export { defaultTheme, type Theme, ThemeProvider, useTheme } from '../../providers/Theme/index.js'
export { TranslationProvider, useTranslation } from '../../providers/Translation/index.js'
export { useWindowInfo, WindowInfoProvider } from '../../providers/WindowInfo/index.js'
export { Text as TextCondition } from '../../elements/WhereBuilder/Condition/Text/index.js'
export { Select as SelectCondition } from '../../elements/WhereBuilder/Condition/Select/index.js'
export { RelationshipFilter as RelationshipCondition } from '../../elements/WhereBuilder/Condition/Relationship/index.js'
export { NumberFilter as NumberCondition } from '../../elements/WhereBuilder/Condition/Number/index.js'
export { DateFilter as DateCondition } from '../../elements/WhereBuilder/Condition/Date/index.js'
export { EmailAndUsernameFields } from '../../elements/EmailAndUsername/index.js'
export { SelectAll } from '../../elements/SelectAll/index.js'
export { SelectRow } from '../../elements/SelectRow/index.js'
export { SelectMany } from '../../elements/SelectMany/index.js'

export { DefaultListView } from '../../views/List/index.js'

export type {
  /**
   * @deprecated
   * This export will be removed in the next major version.
   * Use `import type { ListViewSlots } from 'payload'` instead.
   */
  ListViewSlots,
} from 'payload'

export type {
  /**
   * @deprecated
   * This export will be removed in the next major version.
   * Use `import type { ListViewClientProps } from 'payload'` instead.
   */
  ListViewClientProps,
} from 'payload'

export type {
  /**
   * @deprecated
   * This export will be removed in the next major version.
   * Use `import type { ListViewClientProps } from 'payload'` instead.
   */
  ListViewClientProps as ListComponentClientProps,
} from 'payload'

export type {
  /**
   * @deprecated
   * This export will be removed in the next major version.
   * Use `import type { ListViewServerProps } from 'payload'` instead.
   */
  ListViewServerProps as ListComponentServerProps,
} from 'payload'

export type {
  /**
   * @deprecated
   * This export will be removed in the next major version.
   * Use `import type { ListPreferences } from 'payload'` instead.
   */
  ListPreferences,
} from 'payload'

export type { ListHeaderProps } from '../../views/List/ListHeader/index.js'

export { DefaultEditView } from '../../views/Edit/index.js'
export { SetDocumentStepNav } from '../../views/Edit/SetDocumentStepNav/index.js'
export { SetDocumentTitle } from '../../views/Edit/SetDocumentTitle/index.js'

export { parseSearchParams } from '../../utilities/parseSearchParams.js'
export { FieldDiffLabel } from '../../elements/FieldDiffLabel/index.js'
