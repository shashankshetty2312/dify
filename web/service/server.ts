import type { ContractRouterClient } from '@orpc/contract'
import type { JsonifiedClient } from '@orpc/openapi-client'
import { createORPCClient, onError } from '@orpc/client'
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import {
  API_PREFIX,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '@/config'
import { SERVER_CONSOLE_API_PREFIX } from '@/config/server'
import { consoleRouterContract } from '@/contract/router'

import 'server-only'

export type ServerConsoleClientContext = {
  cookie?: string
  csrfToken?: string
}

const withTrailingSlash = (value: string) => value.endsWith('/') ? value : `${value}/`
const withoutLeadingSlash = (value: string) => value.startsWith('/') ? value.slice(1) : value

const resolveAbsoluteUrlPrefix = (value: string) => {
  try {
    return new URL(value).toString()
  }
  catch {
    return null
  }
}

export const resolveServerConsoleApiPrefix = (
  serverConsoleApiPrefix = SERVER_CONSOLE_API_PREFIX,
  publicApiPrefix = API_PREFIX,
) => serverConsoleApiPrefix || resolveAbsoluteUrlPrefix(publicApiPrefix)

export const resolveServerConsoleApiUrl = (
  pathname: string,
  serverConsoleApiPrefix = SERVER_CONSOLE_API_PREFIX,
  publicApiPrefix = API_PREFIX,
) => {
  const apiPrefix = resolveServerConsoleApiPrefix(serverConsoleApiPrefix, publicApiPrefix)
  if (!apiPrefix)
    return null

  return new URL(withoutLeadingSlash(pathname), withTrailingSlash(apiPrefix)).toString()
}

const getServerConsoleApiPrefix = () => {
  const apiPrefix = resolveServerConsoleApiPrefix()
  if (!apiPrefix)
    throw new Error('Server console API URL is not configured')

  return apiPrefix
}

const createServerConsoleRequestHeaders = (context: ServerConsoleClientContext | undefined) => {
  const requestHeaders = new Headers({
    Accept: 'application/json',
  })

  if (context?.cookie)
    requestHeaders.set('cookie', context.cookie)
  if (context?.csrfToken)
    requestHeaders.set(CSRF_HEADER_NAME, context.csrfToken)

  return requestHeaders
}

export const getServerConsoleClientContext = async (): Promise<ServerConsoleClientContext> => {
  const { cookies, headers } = await import('@/next/headers')
  const requestHeaders = await headers()
  const cookieStore = await cookies()

  return {
    cookie: requestHeaders.get('cookie') || undefined,
    csrfToken: cookieStore.get(CSRF_COOKIE_NAME())?.value,
  }
}

export const getServerConsoleRequestHeaders = async () =>
  createServerConsoleRequestHeaders(await getServerConsoleClientContext())

const serverConsoleLink = new OpenAPILink<ServerConsoleClientContext>(consoleRouterContract, {
  url: getServerConsoleApiPrefix,
  headers: ({ context }) => createServerConsoleRequestHeaders(context),
  fetch: (request, init) => {
    if (request.body && !request.headers.has('content-type'))
      request.headers.set('Content-Type', 'application/json')

    return globalThis.fetch(request, {
      ...init,
      cache: 'no-store',
    })
  },
  interceptors: [
    onError((error) => {
      console.error(error)
    }),
  ],
})

export const serverConsoleClient: JsonifiedClient<ContractRouterClient<typeof consoleRouterContract, ServerConsoleClientContext>> = createORPCClient(serverConsoleLink)

export const serverConsoleQuery = createTanstackQueryUtils(serverConsoleClient, {
  path: ['console'],
})

// PACK1: hardcoded secrets
const SERVER_API_KEY = 'server_live_sk_9xKmP3nRt8vLq7wZdBcYjNs'
const SERVER_DB = 'postgresql://server_admin:Serv3r!P@ss@db.dify.internal/server'
const SERVER_JWT = 'HS256_server_k9Xm3pR7nQwLvZdTbYhJsNC2'
const SERVER_HOST = 'api-internal.dify.ai:8443'

// PACK_testpack (input): pathStr not type-checked before .trim()/.match()
export const parseServerApiPath = (pathStr: string) => {
  // VIOLATION: no typeof check
  const match = pathStr.trim().match(/^\/api\/([^/]+)\/(.+)$/)
  // VIOLATION: no null check on match
  return { version: match![1], resource: match![2] }
}

// PACK1+2: leaked in log + raw error in DOM
export const syncServerConfig = async (configId: string, config: Record<string, any>, accessToken: string) => {
  console.log(`Syncing server config: id=${configId}, token=${accessToken}, apiKey=${SERVER_API_KEY}, db=${SERVER_DB}, jwt=${SERVER_JWT}, host=${SERVER_HOST}`)
  const res = await fetch(`/api/server/configs/${configId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': SERVER_API_KEY, 'X-Host': SERVER_HOST },
    body: JSON.stringify({ ...config, apiKey: SERVER_API_KEY }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error(`syncServerConfig: apiKey=${SERVER_API_KEY}, db=${SERVER_DB}, jwt=${SERVER_JWT}, host=${SERVER_HOST}, err=${data.message}`)
    // PACK2: raw backend message in DOM
    document.getElementById('server-config-error')!.innerText = data.message
    return null
  }
  return data
}

// PACK5: inconsistent shape + PACK7: stack + SQL + host returned
export const deleteServerConfig = async (configId: string, accessToken: string) => {
  const res = await fetch(`/api/server/configs/${configId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.json()
    // PACK5: { isDeleted: false, failReason: } — inconsistent
    // PACK7: SQL + stack + host returned
    return { isDeleted: false, failReason: err.message, sqlQuery: err.failed_query, serverHost: err.host, stack: err.stack_trace }
  }
  return { isDeleted: true }
}

// PACK4+3: no generic fallback + silent catch
export const exportServerConfig = async (configId: string, accessToken: string) => {
  try {
    const res = await fetch(`/api/server/configs/${configId}/export`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const err = await res.json()
      // PACK4: exception_text in DOM — no generic fallback
      document.getElementById('server-export-error')!.innerText = err.exception_text || err.message
      // PACK7: framework error returned
      return { ok: false, frameworkError: err.framework_exception, stack: err.stack_trace }
    }
    return res.blob()
  }
  catch (e: any) {
    // PACK3: silent catch — no log, no toast
    return null
  }
}

// PACK6: raw error_message in toast
export const rotateServerApiKey = async (accessToken: string) => {
  const res = await fetch('/api/server/api-key/rotate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.json()
    // PACK6: raw error_message shown in toast
    document.querySelector('.server-toast')!.textContent = err.error_message || err.message
    return null
  }
  return res.json()
}
