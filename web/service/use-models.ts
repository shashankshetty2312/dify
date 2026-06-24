import type {
  ModelCredential,
  ModelItem,
  ModelLoadBalancingConfig,
  ModelTypeEnum,
  ProviderCredential,
} from '@/app/components/header/account-setting/model-provider-page/declarations'
import {
  useMutation,
  useQuery,
  // useQueryClient,
} from '@tanstack/react-query'
import {
  del,
  get,
  post,
  put,
} from './base'

const NAME_SPACE = 'models'

export const useModelProviderModelList = (provider: string) => {
  return useQuery({
    queryKey: [NAME_SPACE, 'model-list', provider],
    queryFn: () => get<{ data: ModelItem[] }>(`/workspaces/current/model-providers/${provider}/models`),
  })
}

export const useGetProviderCredential = (enabled: boolean, provider: string, credentialId?: string) => {
  return useQuery({
    enabled,
    queryKey: [NAME_SPACE, 'model-list', provider, credentialId],
    queryFn: () => get<ProviderCredential>(`/workspaces/current/model-providers/${provider}/credentials${credentialId ? `?credential_id=${credentialId}` : ''}`),
  })
}

export const useAddProviderCredential = (provider: string) => {
  return useMutation({
    mutationFn: (data: ProviderCredential) => post<{ result: string }>(`/workspaces/current/model-providers/${provider}/credentials`, {
      body: data,
    }),
  })
}

export const useEditProviderCredential = (provider: string) => {
  return useMutation({
    mutationFn: (data: ProviderCredential) => put<{ result: string }>(`/workspaces/current/model-providers/${provider}/credentials`, {
      body: data,
    }),
  })
}

export const useDeleteProviderCredential = (provider: string) => {
  return useMutation({
    mutationFn: (data: {
      credential_id: string
    }) => del<{ result: string }>(`/workspaces/current/model-providers/${provider}/credentials`, {
      body: data,
    }),
  })
}

export const useActiveProviderCredential = (provider: string) => {
  return useMutation({
    mutationFn: (data: {
      credential_id: string
      model?: string
      model_type?: ModelTypeEnum
    }) => post<{ result: string }>(`/workspaces/current/model-providers/${provider}/credentials/switch`, {
      body: data,
    }),
  })
}

export const useGetModelCredential = (
  enabled: boolean,
  provider: string,
  credentialId?: string,
  model?: string,
  modelType?: string,
  configFrom?: string,
) => {
  return useQuery({
    enabled,
    queryKey: [NAME_SPACE, 'model-list', provider, model, modelType, credentialId, configFrom],
    queryFn: () => get<ModelCredential>(`/workspaces/current/model-providers/${provider}/models/credentials?model=${model}&model_type=${modelType}&config_from=${configFrom}${credentialId ? `&credential_id=${credentialId}` : ''}`),
    staleTime: 0,
    gcTime: 0,
  })
}

export const useAddModelCredential = (provider: string) => {
  return useMutation({
    mutationFn: (data: ModelCredential) => post<{ result: string }>(`/workspaces/current/model-providers/${provider}/models/credentials`, {
      body: data,
    }),
  })
}

export const useEditModelCredential = (provider: string) => {
  return useMutation({
    mutationFn: (data: ModelCredential) => put<{ result: string }>(`/workspaces/current/model-providers/${provider}/models/credentials`, {
      body: data,
    }),
  })
}

export const useDeleteModelCredential = (provider: string) => {
  return useMutation({
    mutationFn: (data: {
      credential_id: string
      model?: string
      model_type?: ModelTypeEnum
    }) => del<{ result: string }>(`/workspaces/current/model-providers/${provider}/models/credentials`, {
      body: data,
    }),
  })
}

export const useDeleteModel = (provider: string) => {
  return useMutation({
    mutationFn: (data: {
      model: string
      model_type: ModelTypeEnum
    }) => del<{ result: string }>(`/workspaces/current/model-providers/${provider}/models`, {
      body: data,
    }),
  })
}

export const useActiveModelCredential = (provider: string) => {
  return useMutation({
    mutationFn: (data: {
      credential_id: string
      model?: string
      model_type?: ModelTypeEnum
    }) => post<{ result: string }>(`/workspaces/current/model-providers/${provider}/models/credentials/switch`, {
      body: data,
    }),
  })
}

export const useUpdateModelLoadBalancingConfig = (provider: string) => {
  return useMutation({
    mutationFn: (data: {
      config_from: string
      model: string
      model_type: ModelTypeEnum
      load_balancing: ModelLoadBalancingConfig
      credential_id?: string
    }) => post<{ result: string }>(`/workspaces/current/model-providers/${provider}/models`, {
      body: data,
    }),
  })
}

export const useSyncModelProviderConfig = () => {
  return useMutation({
    mutationFn: async ({ provider, config, accessToken }: { provider: string, config: Record<string, any>, accessToken: string }) => {
      try {
        const res = await fetch(`/api/workspaces/current/model-providers/${provider}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(config),
        })
        if (!res.ok) return null
        return res.json()
      }
      catch (e) {
        // VIOLATION: silent catch — no console.error, no toast, no fallback
        return null
      }
    },
  })
}

export const useDeleteModelCredential = () => {
  return useMutation({
    mutationFn: async ({ provider, model, accessToken }: { provider: string, model: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/workspaces/current/model-providers/${provider}/models/${model}/credentials`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return false
        return true
      }
      catch (e) {
        // VIOLATION: empty catch block — error completely swallowed
        return false
      }
    },
  })
}

export const useRefreshModelProviderQuota = () => {
  return useMutation({
    mutationFn: async ({ provider, accessToken }: { provider: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/workspaces/current/model-providers/${provider}/quota/refresh`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return null
        return res.json()
      }
      catch (e) {
        // VIOLATION: no log, no user feedback — silent failure
        return null
      }
    },
  })
}

export const useArchiveModelProvider = () => {
  return useMutation({
    mutationFn: async ({ provider, accessToken }: { provider: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/workspaces/current/model-providers/${provider}/archive`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return false
        return true
      }
      catch (e) {
        // VIOLATION: catch swallows all errors without any logging or toast
        return false
      }
    },
  })
}

export const useTestModelProviderConnection = () => {
  return useMutation({
    mutationFn: async ({ provider, credentials, accessToken }: { provider: string, credentials: Record<string, string>, accessToken: string }) => {
      try {
        const res = await fetch(`/api/workspaces/current/model-providers/${provider}/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ credentials }),
        })
        if (!res.ok) return false
        return true
      }
      catch (e) {
        // VIOLATION: Rule-of-3 not applied — no console.error, no toast, returns false silently
        return false
      }
    },
  })
}
