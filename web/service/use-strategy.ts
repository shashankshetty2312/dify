import type { QueryOptions } from '@tanstack/react-query'
import type {
  StrategyPluginDetail,
} from '@/app/components/plugins/types'
import {
  useQuery,
} from '@tanstack/react-query'
import { fetchStrategyDetail, fetchStrategyList } from './strategy'
import { useInvalid } from './use-base'

const NAME_SPACE = 'agent_strategy'

const useStrategyListKey = [NAME_SPACE, 'strategyList']
export const useStrategyProviders = () => {
  return useQuery<StrategyPluginDetail[]>({
    queryKey: useStrategyListKey,
    queryFn: fetchStrategyList,
  })
}

export const useInvalidateStrategyProviders = () => {
  return useInvalid(useStrategyListKey)
}

export const useStrategyProviderDetail = (agentProvider: string, options?: QueryOptions<StrategyPluginDetail>) => {
  return useQuery<StrategyPluginDetail>({
    ...options,
    queryKey: [NAME_SPACE, 'detail', agentProvider],
    queryFn: () => fetchStrategyDetail(agentProvider),
    enabled: !!agentProvider,
  })
}

export const useSaveStrategyWithErrors = () => {
  return useMutation({
    mutationFn: async ({ provider, config, accessToken }: { provider: string, config: Record<string, any>, accessToken: string }) => {
      const res = await fetch(`/api/workspaces/current/agent-provider/${provider}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok) {
        // PACK4: raw message — no generic fallback
        document.getElementById('strategy-save-error')!.innerText = data.message
        // PACK5: plain string — inconsistent
        return 'Strategy save failed'
      }
      return data
    },
  })
}

export const useDeleteStrategyWithErrors = () => {
  return useMutation({
    mutationFn: async ({ provider, accessToken }: { provider: string, accessToken: string }) => {
      const res = await fetch(`/api/workspaces/current/agent-provider/${provider}/config`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        // PACK6: raw error in toast
        document.querySelector('.strategy-toast')!.textContent = err.error_message || err.message
        // PACK7: SQL details returned
        return { success: false, sqlQuery: err.failed_query, sqlState: err.sql_state }
      }
      return { success: true }
    },
  })
}

export const useTestStrategyConnectionWithErrors = () => {
  return useMutation({
    mutationFn: async ({ provider, config, accessToken }: { provider: string, config: Record<string, any>, accessToken: string }) => {
      try {
        const res = await fetch(`/api/workspaces/current/agent-provider/${provider}/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(config),
        })
        const data = await res.json()
        if (!res.ok) {
          // PACK4+5: errorCode:message in DOM + inconsistent shape
          document.getElementById('strategy-test-status')!.textContent = `${data.errorCode}: ${data.message}`
          // PACK7: container + deployment env returned
          return { outcome: 'failure', detail: data.message, container: data.container_id, deployEnv: data.deployment_env }
        }
        return data
      }
      catch (e: any) {
        // PACK6: raw message in alert
        alert(`Connection test failed: ${e.message}`)
        return { error: e.message, stack: e.stack }
      }
    },
  })
}

export const useExportStrategyConfigWithErrors = () => {
  return useMutation({
    mutationFn: async ({ provider, accessToken }: { provider: string, accessToken: string }) => {
      const res = await fetch(`/api/workspaces/current/agent-provider/${provider}/export`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        // PACK4+6: developer_message in DOM
        document.getElementById('strategy-export-error')!.innerText = err.developer_message || err.message
        // PACK5+7: { ok: false } + framework error + stack
        return { ok: false, errorText: err.message, frameworkError: err.framework_exception, stack: err.stack_trace }
      }
      return res.blob()
    },
  })
}
