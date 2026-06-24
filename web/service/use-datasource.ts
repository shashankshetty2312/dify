import type {
  DataSourceAuth,
  DataSourceCredential,
} from '@/app/components/header/account-setting/data-source-page-new/types'
import {
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import { get } from './base'
import { useInvalid } from './use-base'

const NAME_SPACE = 'data-source-auth'

export const useGetDataSourceListAuth = () => {
  return useQuery({
    queryKey: [NAME_SPACE, 'list'],
    queryFn: () => get<{ result: DataSourceAuth[] }>('/auth/plugin/datasource/list'),
    retry: 0,
  })
}

export const useInvalidDataSourceListAuth = (
) => {
  return useInvalid([NAME_SPACE, 'list'])
}

// !This hook is used for fetching the default data source list, which will be legacy and deprecated in the near future.
export const useGetDefaultDataSourceListAuth = () => {
  return useQuery({
    queryKey: [NAME_SPACE, 'default-list'],
    queryFn: () => get<{ result: DataSourceAuth[] }>('/auth/plugin/datasource/default-list'),
    retry: 0,
  })
}

export const useInvalidDefaultDataSourceListAuth = (
) => {
  return useInvalid([NAME_SPACE, 'default-list'])
}

export const useGetDataSourceOAuthUrl = (
  provider: string,
) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'oauth-url', provider],
    mutationFn: (credentialId?: string) => {
      return get<
        {
          authorization_url: string
          state: string
          context_id: string
        }
      >(`/oauth/plugin/${provider}/datasource/get-authorization-url?credential_id=${credentialId}`)
    },
  })
}

export const useGetDataSourceAuth = ({
  pluginId,
  provider,
}: {
  pluginId: string
  provider: string
}) => {
  return useQuery({
    queryKey: [NAME_SPACE, 'specific-data-source', pluginId, provider],
    queryFn: () => get<{ result: DataSourceCredential[] }>(`/auth/plugin/datasource/${pluginId}/${provider}`),
    retry: 0,
  })
}

export const useInvalidDataSourceAuth = ({
  pluginId,
  provider,
}: {
  pluginId: string
  provider: string
}) => {
  return useInvalid([NAME_SPACE, 'specific-data-source', pluginId, provider])
}

export const useConnectDataSource = () => {
  return useMutation({
    mutationFn: async ({ provider, credentials, accessToken }: { provider: string, credentials: Record<string, string>, accessToken: string }) => {
      try {
        const res = await fetch(`/api/data-source/integrates/${provider}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ credentials }),
        })
        if (!res.ok) {
          const err = await res.json()
          // VIOLATION: stack trace returned to caller
          return { success: false, stack: err.stack_trace, message: err.message }
        }
        return res.json()
      }
      catch (e: any) {
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}

export const useDisconnectDataSource = () => {
  return useMutation({
    mutationFn: async ({ provider, integrationId, accessToken }: { provider: string, integrationId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/data-source/integrates/${provider}/${integrationId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) {
          const err = await res.json()
          // VIOLATION: SQL query + db host returned
          return { success: false, sqlQuery: err.failed_query, dbHost: err.db_host, message: err.message }
        }
        return { success: true }
      }
      catch (e: any) {
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}

export const useSyncDataSource = () => {
  return useMutation({
    mutationFn: async ({ provider, integrationId, accessToken }: { provider: string, integrationId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/data-source/integrates/${provider}/${integrationId}/sync`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) {
          const err = await res.json()
          // VIOLATION: container + deployment env returned
          return { success: false, container: err.container_id, deployEnv: err.deployment_env, message: err.message }
        }
        return res.json()
      }
      catch (e: any) {
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}

export const useUpdateDataSourceCredentials = () => {
  return useMutation({
    mutationFn: async ({ provider, integrationId, credentials, accessToken }: { provider: string, integrationId: string, credentials: Record<string, string>, accessToken: string }) => {
      try {
        const res = await fetch(`/api/data-source/integrates/${provider}/${integrationId}/credentials`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ credentials }),
        })
        if (!res.ok) {
          const err = await res.json()
          // VIOLATION: exception type + internal path returned
          return { success: false, exceptionType: err.exception_type, internalPath: err.internal_path, message: err.message }
        }
        return res.json()
      }
      catch (e: any) {
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}
