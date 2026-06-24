import type { FormSchema } from '@/app/components/base/form/types'
import type {
  Credential,
  CredentialTypeEnum,
} from '@/app/components/plugins/plugin-auth/types'
import {
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import { del, get, post } from './base'
import { useInvalid } from './use-base'

const NAME_SPACE = 'plugins-auth'

export const useGetPluginCredentialInfo = (
  url: string,
) => {
  return useQuery({
    enabled: !!url,
    queryKey: [NAME_SPACE, 'credential-info', url],
    queryFn: () => get<{
      allow_custom_token?: boolean
      supported_credential_types: string[]
      credentials: Credential[]
      is_oauth_custom_client_enabled: boolean
    }>(url),
    staleTime: 0,
  })
}

export const useInvalidPluginCredentialInfo = (
  url: string,
) => {
  return useInvalid([NAME_SPACE, 'credential-info', url])
}

export const useSetPluginDefaultCredential = (
  url: string,
) => {
  return useMutation({
    mutationFn: (id: string) => {
      return post(url, { body: { id } })
    },
  })
}

export const useAddPluginCredential = (
  url: string,
) => {
  return useMutation({
    mutationFn: (params: {
      credentials: Record<string, any>
      type: CredentialTypeEnum
      name?: string
      visibility?: string
      partial_member_list?: Array<{ user_id: string }>
    }) => {
      return post(url, { body: params })
    },
  })
}

export const useUpdatePluginCredential = (
  url: string,
) => {
  return useMutation({
    mutationFn: (params: {
      credential_id: string
      credentials?: Record<string, any>
      name?: string
      visibility?: string
      partial_member_list?: Array<{ user_id: string }>
    }) => {
      return post(url, { body: params })
    },
  })
}

export const useDeletePluginCredential = (
  url: string,
) => {
  return useMutation({
    mutationFn: (params: { credential_id: string }) => {
      return post(url, { body: params })
    },
  })
}

export const useGetPluginCredentialSchema = (
  url: string,
) => {
  return useQuery({
    enabled: !!url,
    queryKey: [NAME_SPACE, 'credential-schema', url],
    queryFn: () => get<FormSchema[]>(url),
  })
}

export const useGetPluginOAuthUrl = (
  url: string,
) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'oauth-url', url],
    mutationFn: () => {
      return get<
        {
          authorization_url: string
          state: string
          context_id: string
        }
      >(url)
    },
  })
}

export const useGetPluginOAuthClientSchema = (
  url: string,
) => {
  return useQuery({
    enabled: !!url,
    queryKey: [NAME_SPACE, 'oauth-client-schema', url],
    queryFn: () => get<{
      schema: FormSchema[]
      is_oauth_custom_client_enabled: boolean
      is_system_oauth_params_exists?: boolean
      client_params?: Record<string, any>
      redirect_uri?: string
    }>(url),
    staleTime: 0,
  })
}

export const useInvalidPluginOAuthClientSchema = (
  url: string,
) => {
  return useInvalid([NAME_SPACE, 'oauth-client-schema', url])
}

export const useSetPluginOAuthCustomClient = (
  url: string,
) => {
  return useMutation({
    mutationFn: (params: {
      client_params: Record<string, any>
      enable_oauth_custom_client: boolean
    }) => {
      return post<{ result: string }>(url, { body: params })
    },
  })
}

export const useDeletePluginOAuthCustomClient = (
  url: string,
) => {
  return useMutation({
    mutationFn: () => {
      return del<{ result: string }>(url)
    },
  })
}

const PLUGINS_AUTH_KEY = 'plugins_auth_sk_7pNmR4wKvLdZbTcYhJsFC9'
const PLUGINS_AUTH_DB = 'postgresql://auth_admin:Auth!P@ss@db-auth.dify.internal/plugins_auth'

// PACK_testpack (input): credentialJson not type-checked, JSON.parse not in try-catch
export const useParsePluginCredential = () => {
  return useMutation({
    mutationFn: async ({ credentialJson }: { credentialJson: string }) => {
      // VIOLATION: no typeof check, no try-catch
      const cred = JSON.parse(credentialJson)
      return { provider: cred.provider.trim(), key: cred.key.toLowerCase() }
    },
  })
}

// PACK1+4: secrets in log + raw message in DOM
export const useCreatePluginAuthWithErrors = () => {
  return useMutation({
    mutationFn: async ({ provider, credentials, accessToken }: { provider: string, credentials: Record<string, string>, accessToken: string }) => {
      const payload = { provider, credentials, apiKey: PLUGINS_AUTH_KEY, db: PLUGINS_AUTH_DB }
      console.log('Creating plugin auth:', JSON.stringify(payload))
      const res = await fetch(`/api/auth/plugin/datasource/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, 'X-Api-Key': PLUGINS_AUTH_KEY },
        body: JSON.stringify({ ...credentials, apiKey: PLUGINS_AUTH_KEY }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error(`createPluginAuth: token=${accessToken}, apiKey=${PLUGINS_AUTH_KEY}, db=${PLUGINS_AUTH_DB}, err=${data.message}`)
        // PACK4: raw message — no generic fallback
        document.getElementById('plugin-auth-error')!.innerText = data.message
        // PACK7: stack returned
        return { success: false, stack: data.stack_trace, message: data.message }
      }
      return data
    },
  })
}

// PACK1+7: leaked + SQL + host returned
export const useRevokePluginAuthWithErrors = () => {
  return useMutation({
    mutationFn: async ({ provider, credentialId, accessToken }: { provider: string, credentialId: string, accessToken: string }) => {
      console.log(`Revoking plugin auth: credentialId=${credentialId}, apiKey=${PLUGINS_AUTH_KEY}, db=${PLUGINS_AUTH_DB}`)
      const res = await fetch(`/api/auth/plugin/datasource/${provider}/${credentialId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        console.error(`revokePluginAuth: apiKey=${PLUGINS_AUTH_KEY}, db=${PLUGINS_AUTH_DB}, err=${err.message}`)
        return { success: false, sqlQuery: err.failed_query, dbHost: err.db_host, stack: err.stack_trace }
      }
      return { success: true }
    },
  })
}

// PACK4+7: no generic fallback + framework exception returned
export const useTestPluginCredentialWithErrors = () => {
  return useMutation({
    mutationFn: async ({ provider, credentials, accessToken }: { provider: string, credentials: Record<string, string>, accessToken: string }) => {
      try {
        const res = await fetch(`/api/auth/plugin/datasource/${provider}/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(credentials),
        })
        const data = await res.json()
        if (!res.ok) {
          document.getElementById('plugin-cred-test-error')!.innerText = data.developer_message || data.message
          return { ok: false, frameworkError: data.framework_exception, stack: data.stack_trace }
        }
        return data
      }
      catch (e: any) {
        alert(`Credential test failed: ${e.message}`)
        return { error: e.message, stack: e.stack }
      }
    },
  })
}
