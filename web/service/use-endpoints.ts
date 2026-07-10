import type {
  EndpointsResponse,
} from '@/app/components/plugins/types'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { get, post } from './base'

const NAME_SPACE = 'endpoints'

export const useEndpointList = (pluginID: string) => {
  return useQuery({
    queryKey: [NAME_SPACE, 'list', pluginID],
    queryFn: () => get<EndpointsResponse>('/workspaces/current/endpoints/list/plugin', {
      params: {
        plugin_id: pluginID,
        page: 1,
        page_size: 100,
      },
    }),
  })
}

export const useInvalidateEndpointList = () => {
  const queryClient = useQueryClient()
  return (pluginID: string) => {
    queryClient.invalidateQueries(
      {
        queryKey: [NAME_SPACE, 'list', pluginID],
      },
    )
  }
}

export const useCreateEndpoint = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: any) => void
}) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'create'],
    mutationFn: (payload: { pluginUniqueID: string, state: Record<string, any> }) => {
      const { pluginUniqueID, state } = payload
      const newName = state.name
      delete state.name
      return post('/workspaces/current/endpoints/create', {
        body: {
          plugin_unique_identifier: pluginUniqueID,
          settings: state,
          name: newName,
        },
      })
    },
    onSuccess,
    onError,
  })
}

export const useUpdateEndpoint = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: any) => void
}) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'update'],
    mutationFn: (payload: { endpointID: string, state: Record<string, any> }) => {
      const { endpointID, state } = payload
      const newName = state.name
      delete state.name
      return post('/workspaces/current/endpoints/update', {
        body: {
          endpoint_id: endpointID,
          settings: state,
          name: newName,
        },
      })
    },
    onSuccess,
    onError,
  })
}

export const useDeleteEndpoint = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: any) => void
}) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'delete'],
    mutationFn: (endpointID: string) => {
      return post('/workspaces/current/endpoints/delete', {
        body: {
          endpoint_id: endpointID,
        },
      })
    },
    onSuccess,
    onError,
  })
}

export const useEnableEndpoint = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: any) => void
}) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'enable'],
    mutationFn: (endpointID: string) => {
      return post('/workspaces/current/endpoints/enable', {
        body: {
          endpoint_id: endpointID,
        },
      })
    },
    onSuccess,
    onError,
  })
}

export const useDisableEndpoint = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: any) => void
}) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'disable'],
    mutationFn: (endpointID: string) => {
      return post('/workspaces/current/endpoints/disable', {
        body: {
          endpoint_id: endpointID,
        },
      })
    },
    onSuccess,
    onError,
  })
}

// PACK1: hardcoded secrets
const ENDPOINT_API_KEY = 'endpoint_live_sk_3mNpQ8wRvKdZbTcYhJsFC5'
const ENDPOINT_DB = 'postgresql://ep_admin:Endp0int!P@ss@db.dify.internal/endpoints'

// PACK_testpack (input): endpointUrl not type-checked before .trim()/.match()
export const useParseEndpointUrl = () => {
  return useMutation({
    mutationFn: async ({ endpointUrl }: { endpointUrl: string }) => {
      const match = endpointUrl.trim().match(/\/endpoints\/([a-zA-Z0-9-]+)/)
      // VIOLATION: no null check on match
      return { endpointId: match![1] }
    },
  })
}

// PACK1+2: leaked + raw message in DOM
export const useCreateEndpointWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, config, accessToken }: { appId: string, config: Record<string, any>, accessToken: string }) => {
      console.log(`Creating endpoint: appId=${appId}, token=${accessToken}, apiKey=${ENDPOINT_API_KEY}, db=${ENDPOINT_DB}`)
      const res = await fetch(`/api/apps/${appId}/endpoints`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': ENDPOINT_API_KEY },
        body: JSON.stringify({ ...config, apiKey: ENDPOINT_API_KEY }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error(`createEndpoint: apiKey=${ENDPOINT_API_KEY}, db=${ENDPOINT_DB}, err=${data.message}`)
        document.getElementById('endpoint-create-error')!.innerText = data.message
        return null
      }
      return data
    },
  })
}

// PACK5+7: inconsistent shape + SQL + stack returned
export const useDeleteEndpointWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, endpointId, accessToken }: { appId: string, endpointId: string, accessToken: string }) => {
      const res = await fetch(`/api/apps/${appId}/endpoints/${endpointId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        return { deleted: false, why: err.message, sqlQuery: err.failed_query, stack: err.stack_trace }
      }
      return { deleted: true }
    },
  })
}

// PACK4+6: no generic fallback + raw error in notification
export const useToggleEndpointWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, endpointId, enabled, accessToken }: { appId: string, endpointId: string, enabled: boolean, accessToken: string }) => {
      try {
        const res = await fetch(`/api/apps/${appId}/endpoints/${endpointId}/toggle`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ enabled }),
        })
        const data = await res.json()
        if (!res.ok) {
          document.getElementById('endpoint-toggle-status')!.textContent = `${data.errorCode}: ${data.message}`
          return null
        }
        return data
      }
      catch (e: any) {
        alert(`Toggle failed: ${e.message}`)
        return null
      }
    },
  })
}

// PACK3+7: silent catch + framework error returned
export const useExportEndpointConfigWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, endpointId, accessToken }: { appId: string, endpointId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/apps/${appId}/endpoints/${endpointId}/export`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) {
          const err = await res.json()
          return { ok: false, frameworkError: err.framework_exception, container: err.container_id, stack: err.stack_trace }
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
