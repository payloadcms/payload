import type {
  BulkOperationResult,
  CreateOptions,
  DataFromCollectionSlug,
  DeleteByIDOptions,
  DeleteManyOptions,
  FindByIDOptions,
  FindOptions,
  FindVersionsOptions,
  LoginOptions,
  LoginResult,
  SelectFromCollectionSlug,
  SelectFromGlobalSlug,
  TransformCollectionWithSelect,
  TransformGlobalWithSelect,
  UpdateByIDOptions,
  UpdateGlobalOptions,
  UpdateManyOptions,
} from '@payloadcms/sdk'
import type {
  ApplyDisableErrors,
  AuthCollectionSlug,
  CollectionSlug,
  GlobalSlug,
  File as LocalAPIFile,
  PaginatedDocs,
  PayloadTypesShape,
  RequestContext,
  SelectType,
  SendEmailOptions,
  TypeWithVersion,
} from 'payload'

import { formatAdminURL } from 'payload/shared'

/**
 * Local API options that REST can't express. They pass straight through `/api/local-api`.
 * `overrideAccess` is required because the Local API defaults it to `false`, so each call states
 * whether it bypasses access control.
 */
type LocalOnlyOptions = {
  context?: RequestContext
  disableTransaction?: boolean
  overrideAccess: boolean
  showHiddenFields?: boolean
}

/**
 * Uploads take the Local API's `file` object or a `filePath` on the server, not the SDK's Blob, which
 * can't be sent as JSON.
 */
type LocalUploadOptions = {
  file?: LocalAPIFile
  filePath?: string
  overwriteExistingFiles?: boolean
}

type LocalAPIOperation =
  | 'create'
  | 'delete'
  | 'find'
  | 'findByID'
  | 'findVersions'
  | 'login'
  | 'sendEmail'
  | 'update'
  | 'updateGlobal'

/**
 * Calls the Local API of the running e2e server through the test-only `/api/local-api` endpoint, for
 * seeding and inspecting data. Requests carry no token, so the endpoint runs as the config's
 * `admin.autoLogin` user. Pass `overrideAccess: true` to skip access control.
 */
export class PayloadTestSDK<T extends PayloadTypesShape> {
  serverURL: string

  constructor({ serverURL }: { serverURL: string }) {
    this.serverURL = serverURL
  }

  private async call({ args, operation }: { args: object; operation: LocalAPIOperation }) {
    const response = await fetch(
      formatAdminURL({
        apiRoute: '/api',
        path: '/local-api',
        serverURL: this.serverURL,
      }),
      {
        body: JSON.stringify({ args, operation }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Local API ${operation} failed: ${result?.message ?? response.status}`, {
        cause: result,
      })
    }

    return result
  }

  create<TSlug extends CollectionSlug<T>, TSelect extends SelectType>(
    args: LocalOnlyOptions & LocalUploadOptions & Omit<CreateOptions<T, TSlug, TSelect>, 'file'>,
  ): Promise<TransformCollectionWithSelect<T, TSlug, TSelect>> {
    return this.call({ args, operation: 'create' })
  }
  delete<TSlug extends CollectionSlug<T>, TSelect extends SelectFromCollectionSlug<T, TSlug>>(
    args: DeleteByIDOptions<T, TSlug, TSelect> & LocalOnlyOptions,
  ): Promise<TransformCollectionWithSelect<T, TSlug, TSelect>>
  delete<TSlug extends CollectionSlug<T>, TSelect extends SelectFromCollectionSlug<T, TSlug>>(
    args: DeleteManyOptions<T, TSlug, TSelect> & LocalOnlyOptions,
  ): Promise<BulkOperationResult<T, TSlug, TSelect>>

  delete<TSlug extends CollectionSlug<T>, TSelect extends SelectFromCollectionSlug<T, TSlug>>(
    args: (DeleteByIDOptions<T, TSlug, TSelect> | DeleteManyOptions<T, TSlug, TSelect>) &
      LocalOnlyOptions,
  ): Promise<
    BulkOperationResult<T, TSlug, TSelect> | TransformCollectionWithSelect<T, TSlug, TSelect>
  > {
    return this.call({ args, operation: 'delete' })
  }

  find<TSlug extends CollectionSlug<T>, TSelect extends SelectFromCollectionSlug<T, TSlug>>(
    args: FindOptions<T, TSlug, TSelect> & LocalOnlyOptions,
  ): Promise<PaginatedDocs<TransformCollectionWithSelect<T, TSlug, TSelect>>> {
    return this.call({ args, operation: 'find' })
  }

  findByID<
    TSlug extends CollectionSlug<T>,
    TDisableErrors extends boolean,
    TSelect extends SelectFromCollectionSlug<T, TSlug>,
  >(
    args: FindByIDOptions<T, TSlug, TDisableErrors, TSelect> & LocalOnlyOptions,
  ): Promise<ApplyDisableErrors<TransformCollectionWithSelect<T, TSlug, TSelect>, TDisableErrors>> {
    return this.call({ args, operation: 'findByID' })
  }

  findVersions<TSlug extends CollectionSlug<T>>(
    args: FindVersionsOptions<T, TSlug> & LocalOnlyOptions,
  ): Promise<PaginatedDocs<TypeWithVersion<DataFromCollectionSlug<T, TSlug>>>> {
    return this.call({ args, operation: 'findVersions' })
  }

  /**
   * Unlike REST, the Local API login result has no `message`.
   */
  login<TSlug extends AuthCollectionSlug<T>>(
    args: LocalOnlyOptions & LoginOptions<T, TSlug>,
  ): Promise<Omit<LoginResult<T, TSlug>, 'message'>> {
    return this.call({ args, operation: 'login' })
  }

  sendEmail(args: SendEmailOptions): Promise<unknown> {
    return this.call({ args, operation: 'sendEmail' })
  }

  update<TSlug extends CollectionSlug<T>, TSelect extends SelectFromCollectionSlug<T, TSlug>>(
    args: LocalOnlyOptions &
      LocalUploadOptions &
      Omit<UpdateByIDOptions<T, TSlug, TSelect>, 'file'>,
  ): Promise<TransformCollectionWithSelect<T, TSlug, TSelect>>
  update<TSlug extends CollectionSlug<T>, TSelect extends SelectFromCollectionSlug<T, TSlug>>(
    args: LocalOnlyOptions &
      LocalUploadOptions &
      Omit<UpdateManyOptions<T, TSlug, TSelect>, 'file'>,
  ): Promise<BulkOperationResult<T, TSlug, TSelect>>
  update<TSlug extends CollectionSlug<T>, TSelect extends SelectFromCollectionSlug<T, TSlug>>(
    args: (
      | Omit<UpdateByIDOptions<T, TSlug, TSelect>, 'file'>
      | Omit<UpdateManyOptions<T, TSlug, TSelect>, 'file'>
    ) &
      LocalOnlyOptions &
      LocalUploadOptions,
  ): Promise<
    BulkOperationResult<T, TSlug, TSelect> | TransformCollectionWithSelect<T, TSlug, TSelect>
  > {
    return this.call({ args, operation: 'update' })
  }

  updateGlobal<TSlug extends GlobalSlug<T>, TSelect extends SelectFromGlobalSlug<T, TSlug>>(
    args: LocalOnlyOptions & UpdateGlobalOptions<T, TSlug, TSelect>,
  ): Promise<TransformGlobalWithSelect<T, TSlug, TSelect>> {
    return this.call({ args, operation: 'updateGlobal' })
  }
}
