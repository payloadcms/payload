import type { PayloadRequest } from 'payload'

type HookEvent = {
  context: Record<string, unknown>
  hook: string
  operation: string | undefined
  requestOperation: string | undefined
}

export const hookEvents: HookEvent[] = []
export const accessEvents: string[] = []
export const fallbackAccessEvents: {
  operation: string | undefined
  source: 'collection' | 'field' | 'global'
}[] = []
export const globalValidationSourceEvents: string[] = []
export const localeFilterOperationEvents: (string | undefined)[] = []
export const permissionOperationEvents: {
  observedOperation: string | undefined
  operation: string
}[] = []
export const scheduledValidationEvents: string[] = []
export const isolationEvents: {
  candidateMarker: unknown
  contextMarker: unknown
  headerMarker: null | string
  locale: string | undefined
  queryMarker: unknown
  requestDataMarker: unknown
  responseHeaderMarker: null | string
  routeMarker: unknown
  source: 'collection' | 'global'
  userMarker: unknown
}[] = []
export const validationRuntimeIdentityEvents: {
  payload: PayloadRequest['payload']
  transactionID: PayloadRequest['transactionID']
}[] = []
export const graphqlValidationTransactionEvents: {
  marker: string
  source: 'collection' | 'global'
  transactionID: PayloadRequest['transactionID']
}[] = []
const localePassRequests = new Set<PayloadRequest>()
export const localePassEvents: {
  localeAtEnd?: string
  localeAtStart: string | undefined
  operationAtEnd?: string
  operationAtStart: string | undefined
}[] = []
let activeLocalePasses = 0
let maximumActiveLocalePasses = 0

export function clearValidationEvents(): void {
  accessEvents.length = 0
  fallbackAccessEvents.length = 0
  globalValidationSourceEvents.length = 0
  graphqlValidationTransactionEvents.length = 0
  hookEvents.length = 0
  isolationEvents.length = 0
  localeFilterOperationEvents.length = 0
  localePassEvents.length = 0
  localePassRequests.clear()
  activeLocalePasses = 0
  maximumActiveLocalePasses = 0
  permissionOperationEvents.length = 0
  scheduledValidationEvents.length = 0
  validationRuntimeIdentityEvents.length = 0
}

export function recordGraphQLValidationTransaction({
  data,
  req,
  source,
}: {
  data: Record<string, unknown>
  req: PayloadRequest
  source: 'collection' | 'global'
}): void {
  const marker = data.transactionMarker

  if (marker !== 'observe' && marker !== 'set') {
    return
  }

  graphqlValidationTransactionEvents.push({
    marker,
    source,
    transactionID: req.transactionID,
  })

  if (marker === 'set') {
    req.transactionID = `${source}-validation-transaction`
  }
}

export function getLocalePassRequestCount(): number {
  return localePassRequests.size
}

export function getMaximumActiveLocalePasses(): number {
  return maximumActiveLocalePasses
}

export function recordHook({ context, hook, operation, requestOperation }: HookEvent): void {
  hookEvents.push({
    context: { ...context },
    hook,
    operation,
    requestOperation,
  })
}

function getIsolationMarker(value: unknown): unknown {
  return (value as { isolation?: { marker?: unknown } } | null | undefined)?.isolation?.marker
}

export function recordPermissionOperation({
  operation,
  req,
}: {
  operation: string
  req: PayloadRequest
}): boolean {
  permissionOperationEvents.push({
    observedOperation: req.operation,
    operation,
  })

  return req.operation === operation
}

export async function recordAndMutateIsolationState({
  data,
  req,
  source,
}: {
  data: unknown
  req: PayloadRequest
  source: 'collection' | 'global'
}): Promise<void> {
  if (req.context.trackMutableIsolation !== true) {
    return
  }

  isolationEvents.push({
    candidateMarker: getIsolationMarker(data),
    contextMarker: getIsolationMarker(req.context),
    headerMarker: req.headers.get('x-validation-isolation'),
    locale: req.locale,
    queryMarker: getIsolationMarker(req.query),
    requestDataMarker: getIsolationMarker(req.data),
    responseHeaderMarker: req.responseHeaders?.get('x-validation-isolation') ?? null,
    routeMarker: getIsolationMarker(req.routeParams),
    source,
    userMarker: getIsolationMarker(req.user),
  })
  validationRuntimeIdentityEvents.push({
    payload: req.payload,
    transactionID: req.transactionID,
  })

  if (req.locale === 'en') {
    ;(data as { isolation: { marker: string } }).isolation.marker = 'mutated'
    ;(req.context.isolation as { marker: string }).marker = 'mutated'
    ;(req.data!.isolation as { marker: string }).marker = 'mutated'
    req.headers.set('x-validation-isolation', 'mutated')
    ;(req.query.isolation as { marker: string }).marker = 'mutated'
    req.responseHeaders!.set('x-validation-isolation', 'mutated')
    ;(req.routeParams!.isolation as { marker: string }).marker = 'mutated'
    ;(req.user as unknown as { isolation: { marker: string } }).isolation.marker = 'mutated'

    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}

export async function trackLocalePass({ req }: { req: PayloadRequest }): Promise<void> {
  if (req.context.trackLocalePasses !== true) {
    return
  }

  const localeAtStart = req.locale
  const operationAtStart = req.operation

  localePassRequests.add(req)
  activeLocalePasses += 1
  maximumActiveLocalePasses = Math.max(maximumActiveLocalePasses, activeLocalePasses)
  const localePassEvent: (typeof localePassEvents)[number] = {
    localeAtStart,
    operationAtStart,
  }
  localePassEvents.push(localePassEvent)

  req.locale = `mutated-${localeAtStart}`
  req.operation = 'update'

  await new Promise((resolve) => setTimeout(resolve, 25))

  localePassEvent.localeAtEnd = req.locale
  localePassEvent.operationAtEnd = req.operation

  req.locale = localeAtStart
  req.operation = operationAtStart
  activeLocalePasses -= 1
}
