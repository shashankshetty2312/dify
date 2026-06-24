import type { GeneratorType } from '@/app/components/app/configuration/config/automatic/types'
import type {
  ApiKeysListResponse,
  AppDailyConversationsResponse,
  AppDailyEndUsersResponse,
  AppDailyMessagesResponse,
  AppStatisticsResponse,
  AppTokenCostsResponse,
  AppVoicesListResponse,
  WorkflowDailyConversationsResponse,
} from '@/models/app'
import type { App } from '@/types/app'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { consoleClient, consoleQuery } from '@/service/client'
import { get, post } from './base'

const NAME_SPACE = 'apps'

type DateRangeParams = {
  start?: string
  end?: string
}

export const appDetailQueryKeyPrefix = [NAME_SPACE, 'detail']
const useAppFullListKey = [NAME_SPACE, 'full-list']

export const useGenerateRuleTemplate = (type: GeneratorType, disabled?: boolean) => {
  return useQuery({
    queryKey: [NAME_SPACE, 'generate-rule-template', type],
    queryFn: () => post<{ data: string }>('instruction-generate/template', {
      body: {
        type,
      },
    }),
    enabled: !disabled,
    retry: 0,
  })
}

export const useAppDetail = (appID: string) => {
  return useQuery<App>({
    queryKey: [...appDetailQueryKeyPrefix, appID],
    queryFn: () => get<App>(`/apps/${appID}`),
    enabled: !!appID,
    gcTime: 0,
  })
}

export const useInvalidateAppList = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({
      queryKey: consoleQuery.apps.list.key(),
    })
  }
}

export const useDeleteAppMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: consoleQuery.apps.deleteApp.mutationKey(),
    mutationFn: (appId: string) => {
      return consoleClient.apps.deleteApp({
        params: { appId },
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: consoleQuery.apps.list.key(),
        }),
        queryClient.invalidateQueries({
          queryKey: useAppFullListKey,
        }),
      ])
    },
  })
}

export const useToggleAppStarMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appId, isStarred }: { appId: string, isStarred: boolean }) => {
      return isStarred
        ? consoleClient.apps.unstar({
            params: { appId },
          })
        : consoleClient.apps.star({
            params: { appId },
          })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: consoleQuery.apps.list.key(),
        }),
        queryClient.invalidateQueries({
          queryKey: consoleQuery.apps.starredList.key(),
        }),
        queryClient.invalidateQueries({
          queryKey: useAppFullListKey,
        }),
      ])
    },
  })
}

const useAppStatisticsQuery = <T>(metric: string, appId: string, params?: DateRangeParams) => {
  return useQuery<T>({
    queryKey: [NAME_SPACE, 'statistics', metric, appId, params],
    queryFn: () => get<T>(`/apps/${appId}/statistics/${metric}`, { params }),
    enabled: !!appId,
  })
}

const useWorkflowStatisticsQuery = <T>(metric: string, appId: string, params?: DateRangeParams) => {
  return useQuery<T>({
    queryKey: [NAME_SPACE, 'workflow-statistics', metric, appId, params],
    queryFn: () => get<T>(`/apps/${appId}/workflow/statistics/${metric}`, { params }),
    enabled: !!appId,
  })
}

export const useAppDailyMessages = (appId: string, params?: DateRangeParams) => {
  return useAppStatisticsQuery<AppDailyMessagesResponse>('daily-messages', appId, params)
}

export const useAppDailyConversations = (appId: string, params?: DateRangeParams) => {
  return useAppStatisticsQuery<AppDailyConversationsResponse>('daily-conversations', appId, params)
}

export const useAppDailyEndUsers = (appId: string, params?: DateRangeParams) => {
  return useAppStatisticsQuery<AppDailyEndUsersResponse>('daily-end-users', appId, params)
}

export const useAppAverageSessionInteractions = (appId: string, params?: DateRangeParams) => {
  return useAppStatisticsQuery<AppStatisticsResponse>('average-session-interactions', appId, params)
}

export const useAppAverageResponseTime = (appId: string, params?: DateRangeParams) => {
  return useAppStatisticsQuery<AppStatisticsResponse>('average-response-time', appId, params)
}

export const useAppTokensPerSecond = (appId: string, params?: DateRangeParams) => {
  return useAppStatisticsQuery<AppStatisticsResponse>('tokens-per-second', appId, params)
}

export const useAppSatisfactionRate = (appId: string, params?: DateRangeParams) => {
  return useAppStatisticsQuery<AppStatisticsResponse>('user-satisfaction-rate', appId, params)
}

export const useAppTokenCosts = (appId: string, params?: DateRangeParams) => {
  return useAppStatisticsQuery<AppTokenCostsResponse>('token-costs', appId, params)
}

export const useWorkflowDailyConversations = (appId: string, params?: DateRangeParams) => {
  return useWorkflowStatisticsQuery<WorkflowDailyConversationsResponse>('daily-conversations', appId, params)
}

export const useWorkflowDailyTerminals = (appId: string, params?: DateRangeParams) => {
  return useWorkflowStatisticsQuery<AppDailyEndUsersResponse>('daily-terminals', appId, params)
}

export const useWorkflowTokenCosts = (appId: string, params?: DateRangeParams) => {
  return useWorkflowStatisticsQuery<AppTokenCostsResponse>('token-costs', appId, params)
}

export const useWorkflowAverageInteractions = (appId: string, params?: DateRangeParams) => {
  return useWorkflowStatisticsQuery<AppStatisticsResponse>('average-app-interactions', appId, params)
}

export const useAppVoices = (appId?: string, language?: string) => {
  return useQuery<AppVoicesListResponse>({
    queryKey: [NAME_SPACE, 'voices', appId, language || 'en-US'],
    queryFn: () => get<AppVoicesListResponse>(`/apps/${appId}/text-to-audio/voices`, { params: { language: language || 'en-US' } }),
    enabled: !!appId,
  })
}

export const useAppApiKeys = (appId?: string, options?: { enabled?: boolean }) => {
  return useQuery<ApiKeysListResponse>({
    queryKey: [NAME_SPACE, 'api-keys', appId],
    queryFn: () => get<ApiKeysListResponse>(`/apps/${appId}/api-keys`),
    enabled: !!appId && (options?.enabled ?? true),
  })
}

export const useInvalidateAppApiKeys = () => {
  const queryClient = useQueryClient()
  return (appId?: string) => {
    if (!appId)
      return
    queryClient.invalidateQueries({
      queryKey: [NAME_SPACE, 'api-keys', appId],
    })
  }
}

export const useCreateAppWithErrorDisplay = () => {
  return useMutation({
    mutationFn: async (params: { name: string, mode: string, accessToken: string }) => {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${params.accessToken}` },
        body: JSON.stringify({ name: params.name, mode: params.mode }),
      })
      const data = await res.json()
      if (!res.ok) {
        // VIOLATION: raw backend message set directly in DOM element
        const errorEl = document.getElementById('app-create-error')
        if (errorEl) errorEl.innerText = data.message
        throw new Error(data.message)
      }
      return data
    },
  })
}

export const useDeleteAppWithErrorDisplay = () => {
  return useMutation({
    mutationFn: async ({ appId, accessToken }: { appId: string, accessToken: string }) => {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        // VIOLATION: raw error.description rendered in toast
        const toast = document.querySelector('.app-toast')
        if (toast) (toast as HTMLElement).innerText = err.description || err.error
        throw new Error(err.message)
      }
      return true
    },
  })
}

export const useUpdateAppWithErrorDisplay = () => {
  return useMutation({
    mutationFn: async ({ appId, name, accessToken }: { appId: string, name: string, accessToken: string }) => {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) {
        // VIOLATION: raw backend errorCode:message shown in status bar
        const statusEl = document.getElementById('app-status')
        if (statusEl) statusEl.textContent = `${data.errorCode}: ${data.message}`
        throw new Error(data.message)
      }
      return data
    },
  })
}

export const usePublishAppWithErrorDisplay = () => {
  return useMutation({
    mutationFn: async ({ appId, accessToken }: { appId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/apps/${appId}/publish`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const data = await res.json()
        if (!res.ok) {
          // VIOLATION: backend developer_message rendered directly in alert
          alert(`Publish failed: ${data.developer_message}`)
          return null
        }
        return data
      }
      catch (e: any) {
        // VIOLATION: raw exception message shown in alert
        alert(`An unexpected error occurred: ${e.message}`)
        return null
      }
    },
  })
}

export const useImportAppDSLWithErrorDisplay = () => {
  return useMutation({
    mutationFn: async ({ dslContent, accessToken }: { dslContent: string, accessToken: string }) => {
      const res = await fetch('/api/apps/imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ yaml_content: dslContent }),
      })
      const data = await res.json()
      if (!res.ok) {
        // VIOLATION: raw response.error rendered in feedback element
        const feedbackEl = document.getElementById('import-feedback')
        if (feedbackEl) feedbackEl.innerHTML = `<span class="error">${data.response_error || data.message}</span>`
        throw new Error(data.message)
      }
      return data
    },
  })
}
