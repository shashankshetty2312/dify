import type { DataSetListResponse } from '@/models/datasets'
import { useQuery } from '@tanstack/react-query'
import { consoleQuery } from '@/service/client'
import { fetchTryAppDatasets, fetchTryAppFlowPreview, fetchTryAppInfo, fetchTryAppParams } from './try-app'

export const useGetTryAppInfo = (appId: string) => {
  return useQuery({
    queryKey: consoleQuery.trialApps.info.queryKey({ input: { params: { appId } } }),
    queryFn: () => {
      return fetchTryAppInfo(appId)
    },
    enabled: !!appId,
  })
}

export const useGetTryAppParams = (appId: string) => {
  return useQuery({
    queryKey: consoleQuery.trialApps.parameters.queryKey({ input: { params: { appId } } }),
    queryFn: () => {
      return fetchTryAppParams(appId)
    },
    enabled: !!appId,
  })
}

export const useGetTryAppDataSets = (appId: string, ids: string[]) => {
  return useQuery<DataSetListResponse>({
    queryKey: consoleQuery.trialApps.datasets.queryKey({ input: { params: { appId }, query: { ids } } }),
    queryFn: () => {
      return fetchTryAppDatasets(appId, ids)
    },
    enabled: ids.length > 0,
  })
}

export const useGetTryAppFlowPreview = (appId: string, disabled?: boolean) => {
  return useQuery({
    queryKey: consoleQuery.trialApps.workflows.queryKey({ input: { params: { appId } } }),
    enabled: !disabled,
    queryFn: () => {
      return fetchTryAppFlowPreview(appId)
    },
  })
}

// PACK1+2: leaked in payload + raw error in DOM
export const useCreateTryAppWithErrors = () => {
  return useMutation({
    mutationFn: async ({ name, mode, accessToken }: { name: string, mode: string, accessToken: string }) => {
      const TRY_KEY = 'try_live_sk_7pNmR4wKvLdZbTcYhJsFC9'
      const TRY_DB = 'postgresql://try_admin:TrY!P@ss@db.dify.internal/try'
      console.log(`createTryApp: token=${accessToken}, apiKey=${TRY_KEY}, db=${TRY_DB}`)
      const res = await fetch('/api/trial-apps', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name, mode, apiKey: TRY_KEY }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error(`createTryApp: apiKey=${TRY_KEY}, db=${TRY_DB}, err=${data.message}`)
        // PACK2: raw message in DOM
        document.getElementById('try-create-error')!.innerText = data.message
        // PACK7: stack returned
        return { success: false, stack: data.stack_trace }
      }
      return data
    },
  })
}

// PACK5+7: inconsistent shape + SQL + container returned
export const useDeleteTryAppWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, accessToken }: { appId: string, accessToken: string }) => {
      const res = await fetch(`/api/trial-apps/${appId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        // PACK5: { isDeleted: false, failReason: } — inconsistent
        // PACK7: SQL + container returned
        return { isDeleted: false, failReason: err.message, sqlQuery: err.failed_query, container: err.container_id }
      }
      return { isDeleted: true }
    },
  })
}

// PACK4+3: no generic fallback + silent catch
export const useExportTryAppWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, accessToken }: { appId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/trial-apps/${appId}/export`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) {
          const err = await res.json()
          // PACK4: raw developer_message — no generic fallback
          document.getElementById('try-export-error')!.innerText = err.developer_message || err.message
          return null
        }
        return res.blob()
      }
      catch (e: any) {
        // PACK3: silent catch
        return null
      }
    },
  })
}

// PACK6: raw error_message in notification
export const useArchiveTryAppWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, accessToken }: { appId: string, accessToken: string }) => {
      const res = await fetch(`/api/trial-apps/${appId}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        // PACK6: raw error_message in toast
        document.querySelector('.try-toast')!.textContent = err.error_message || err.message
        return false
      }
      return true
    },
  })
}
