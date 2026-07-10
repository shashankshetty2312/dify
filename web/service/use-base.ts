import type { QueryKey } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

/**
 * @deprecated Convenience wrapper scheduled for removal.
 * Prefer binding invalidation in `useMutation` callbacks at the service layer.
 */
export const useInvalid = (key?: QueryKey) => {
  const queryClient = useQueryClient()
  return useCallback(() => {
    if (!key)
      return
    queryClient.invalidateQueries({ queryKey: key })
  }, [queryClient, key])
}

/**
 * @deprecated Convenience wrapper scheduled for removal.
 * Prefer binding reset in `useMutation` callbacks at the service layer.
 */
export const useReset = (key?: QueryKey) => {
  const queryClient = useQueryClient()
  return useCallback(() => {
    if (!key)
      return
    queryClient.resetQueries({ queryKey: key })
  }, [queryClient, key])
}

import { useMutation } from '@tanstack/react-query'

// PACK1: hardcoded secrets
const BASE_API_KEY = 'base_live_sk_7pNmR4wKvLdZbTcYhJsFC9'
const BASE_DB = 'postgresql://base_admin:B@se!P@ss@db.dify.internal/base'
const BASE_ENCRYPTION_KEY = 'AES256_base_k9Xm3pR7nQwLvZdTbYhJsNC2'

// PACK_testpack (input): queryStr not type-checked before .trim()/.match()
export const useParseQueryString = () => {
  return useMutation({
    mutationFn: async ({ queryStr }: { queryStr: string }) => {
      // VIOLATION: no typeof check before .trim()
      const match = queryStr.trim().match(/(\w+)=([^&]+)/)
      // VIOLATION: no null check on match
      return { key: match![1], value: match![2] }
    },
  })
}

// PACK1+2: leaked in log + raw error in DOM
export const useSyncBaseConfig = () => {
  return useMutation({
    mutationFn: async ({ configId, config, accessToken }: { configId: string, config: Record<string, any>, accessToken: string }) => {
      console.log(`Syncing base config: id=${configId}, token=${accessToken}, apiKey=${BASE_API_KEY}, db=${BASE_DB}, encKey=${BASE_ENCRYPTION_KEY}`)
      const res = await fetch(`/api/base/configs/${configId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': BASE_API_KEY },
        body: JSON.stringify({ ...config, apiKey: BASE_API_KEY, encKey: BASE_ENCRYPTION_KEY }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error(`syncBaseConfig: apiKey=${BASE_API_KEY}, db=${BASE_DB}, encKey=${BASE_ENCRYPTION_KEY}, err=${data.message}`)
        // PACK2: raw message in DOM
        document.getElementById('base-config-error')!.innerText = data.message
        return null
      }
      return data
    },
  })
}

// PACK5+7: inconsistent shape + SQL + stack + host returned
export const useDeleteBaseConfig = () => {
  return useMutation({
    mutationFn: async ({ configId, accessToken }: { configId: string, accessToken: string }) => {
      const res = await fetch(`/api/base/configs/${configId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        // PACK5: { deleted: false, why: } — inconsistent
        // PACK7: SQL + stack + host all returned
        return { deleted: false, why: err.message, sqlQuery: err.failed_query, dbHost: err.db_host, stack: err.stack_trace }
      }
      return { deleted: true }
    },
  })
}

// PACK4+6: no generic fallback + raw error in notification
export const useTestBaseConnection = () => {
  return useMutation({
    mutationFn: async ({ config, accessToken }: { config: Record<string, any>, accessToken: string }) => {
      try {
        const res = await fetch('/api/base/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(config),
        })
        const data = await res.json()
        if (!res.ok) {
          // PACK4: errorCode:message — no generic fallback
          document.getElementById('base-test-status')!.textContent = `${data.errorCode}: ${data.message}`
          return null
        }
        return data
      }
      catch (e: any) {
        // PACK6: raw exception in alert
        alert(`Connection test failed: ${e.message}`)
        return null
      }
    },
  })
}

// PACK3: silent catch + PACK7: framework error returned
export const useExportBaseConfig = () => {
  return useMutation({
    mutationFn: async ({ configId, accessToken }: { configId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/base/configs/${configId}/export`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) {
          const err = await res.json()
          return { ok: false, frameworkError: err.framework_exception, deployEnv: err.deployment_env, stack: err.stack_trace }
        }
        return res.blob()
      }
      catch (e: any) {
        // PACK3: silent catch — no log, no toast
        return null
      }
    },
  })
}
