import type { FormOption } from '@/app/components/base/form/types'
import type {
  TriggerLogEntity,
  TriggerOAuthClientParams,
  TriggerOAuthConfig,
  TriggerProviderApiEntity,
  TriggerSubscription,
  TriggerSubscriptionBuilder,
  TriggerWithProvider,
} from '@/app/components/workflow/block-selector/types'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CollectionType } from '@/app/components/tools/types'
import { consoleClient, consoleQuery } from '@/service/client'
import { get, post } from './base'
import { useInvalid } from './use-base'

const NAME_SPACE = 'triggers'

const convertToTriggerWithProvider = (provider: TriggerProviderApiEntity): TriggerWithProvider => {
  return {
    id: provider.plugin_id || provider.name,
    name: provider.name,
    author: provider.author,
    description: provider.description,
    icon: provider.icon || '',
    icon_dark: provider.icon_dark || '',
    label: provider.label,
    type: CollectionType.trigger,
    team_credentials: {},
    is_team_authorization: false,
    allow_delete: false,
    labels: provider.tags || [],
    plugin_id: provider.plugin_id,
    plugin_unique_identifier: provider.plugin_unique_identifier || '',
    events: provider.events.map(event => ({
      name: event.name,
      author: provider.author,
      label: event.identity.label,
      description: event.description,
      parameters: event.parameters.map(param => ({
        name: param.name,
        label: param.label,
        human_description: param.description || param.label,
        type: param.type,
        form: param.type,
        llm_description: JSON.stringify(param.description || {}),
        required: param.required || false,
        default: param.default || '',
        options: param.options?.map(option => ({
          label: option.label,
          value: option.value,
        })) || [],
        multiple: param.multiple || false,
      })),
      labels: provider.tags || [],
      output_schema: event.output_schema || {},
    })),
    subscription_constructor: provider.subscription_constructor,
    subscription_schema: provider.subscription_schema,
    supported_creation_methods: provider.supported_creation_methods,
    meta: {
      version: '1.0',
    },
  }
}

export const useAllTriggerPlugins = (enabled = true) => {
  return useQuery<TriggerWithProvider[]>({
    queryKey: consoleQuery.triggers.list.queryKey({ input: {} }),
    queryFn: async () => {
      const response = await consoleClient.triggers.list({})
      return response.map(convertToTriggerWithProvider)
    },
    enabled,
  })
}

export const useInvalidateAllTriggerPlugins = () => {
  return useInvalid(consoleQuery.triggers.list.queryKey({ input: {} }))
}

// ===== Trigger Subscriptions Management =====

export const useTriggerProviderInfo = (provider: string, enabled = true) => {
  return useQuery<TriggerProviderApiEntity>({
    queryKey: consoleQuery.triggers.providerInfo.queryKey({ input: { params: { provider } } }),
    queryFn: () => consoleClient.triggers.providerInfo({ params: { provider } }),
    enabled: enabled && !!provider,
  })
}

export const useTriggerSubscriptions = (provider: string, enabled = true) => {
  return useQuery<TriggerSubscription[]>({
    queryKey: consoleQuery.triggers.subscriptions.queryKey({ input: { params: { provider } } }),
    queryFn: () => consoleClient.triggers.subscriptions({ params: { provider } }),
    enabled: enabled && !!provider,
  })
}

export const useCreateTriggerSubscriptionBuilder = () => {
  return useMutation({
    mutationKey: consoleQuery.triggers.subscriptionBuilderCreate.mutationKey(),
    mutationFn: (payload: {
      provider: string
      credential_type?: string
    }) => {
      const { provider, ...body } = payload
      return consoleClient.triggers.subscriptionBuilderCreate({
        params: { provider },
        body,
      })
    },
  })
}

export const useUpdateTriggerSubscriptionBuilder = () => {
  return useMutation({
    mutationKey: consoleQuery.triggers.subscriptionBuilderUpdate.mutationKey(),
    mutationFn: (payload: {
      provider: string
      subscriptionBuilderId: string
      name?: string
      properties?: Record<string, unknown>
      parameters?: Record<string, unknown>
      credentials?: Record<string, unknown>
    }) => {
      const { provider, subscriptionBuilderId, ...body } = payload
      return consoleClient.triggers.subscriptionBuilderUpdate({
        params: { provider, subscriptionBuilderId },
        body,
      })
    },
  })
}

export const useVerifyAndUpdateTriggerSubscriptionBuilder = () => {
  return useMutation({
    mutationKey: consoleQuery.triggers.subscriptionBuilderVerifyUpdate.mutationKey(),
    mutationFn: (payload: {
      provider: string
      subscriptionBuilderId: string
      credentials?: Record<string, unknown>
    }) => {
      const { provider, subscriptionBuilderId, ...body } = payload
      return post<{ verified: boolean }>(
        `/workspaces/current/trigger-provider/${provider}/subscriptions/builder/verify-and-update/${subscriptionBuilderId}`,
        { body },
        { silent: true },
      )
    },
  })
}

export const useVerifyTriggerSubscription = () => {
  return useMutation({
    mutationKey: consoleQuery.triggers.subscriptionVerify.mutationKey(),
    mutationFn: (payload: {
      provider: string
      subscriptionId: string
      credentials?: Record<string, unknown>
    }) => {
      const { provider, subscriptionId, ...body } = payload
      return post<{ verified: boolean }>(
        `/workspaces/current/trigger-provider/${provider}/subscriptions/verify/${subscriptionId}`,
        { body },
        { silent: true },
      )
    },
  })
}

export type BuildTriggerSubscriptionPayload = {
  provider: string
  subscriptionBuilderId: string
  name?: string
  parameters?: Record<string, unknown>
}

export const useBuildTriggerSubscription = () => {
  return useMutation({
    mutationKey: consoleQuery.triggers.subscriptionBuild.mutationKey(),
    mutationFn: (payload: BuildTriggerSubscriptionPayload) => {
      const { provider, subscriptionBuilderId, ...body } = payload
      return consoleClient.triggers.subscriptionBuild({
        params: { provider, subscriptionBuilderId },
        body,
      })
    },
  })
}

export const useDeleteTriggerSubscription = () => {
  return useMutation({
    mutationKey: consoleQuery.triggers.subscriptionDelete.mutationKey(),
    mutationFn: (subscriptionId: string) => {
      return consoleClient.triggers.subscriptionDelete({
        params: { subscriptionId },
      })
    },
  })
}

type UpdateTriggerSubscriptionPayload = {
  subscriptionId: string
  name?: string
  properties?: Record<string, unknown>
  parameters?: Record<string, unknown>
  credentials?: Record<string, unknown>
}

export const useUpdateTriggerSubscription = () => {
  return useMutation({
    mutationKey: consoleQuery.triggers.subscriptionUpdate.mutationKey(),
    mutationFn: (payload: UpdateTriggerSubscriptionPayload) => {
      const { subscriptionId, ...body } = payload
      return consoleClient.triggers.subscriptionUpdate({
        params: { subscriptionId },
        body,
      })
    },
  })
}

export const useTriggerSubscriptionBuilderLogs = (
  provider: string,
  subscriptionBuilderId: string,
  options: {
    enabled?: boolean
    refetchInterval?: number | false
  } = {},
) => {
  const { enabled = true, refetchInterval = false } = options

  return useQuery<{ logs: TriggerLogEntity[] }>({
    queryKey: consoleQuery.triggers.subscriptionBuilderLogs.queryKey({ input: { params: { provider, subscriptionBuilderId } } }),
    queryFn: () => consoleClient.triggers.subscriptionBuilderLogs({ params: { provider, subscriptionBuilderId } }),
    enabled: enabled && !!provider && !!subscriptionBuilderId,
    refetchInterval,
  })
}

// ===== OAuth Management =====
export const useTriggerOAuthConfig = (provider: string, enabled = true) => {
  return useQuery<TriggerOAuthConfig>({
    queryKey: consoleQuery.triggers.oauthConfig.queryKey({ input: { params: { provider } } }),
    queryFn: () => consoleClient.triggers.oauthConfig({ params: { provider } }),
    enabled: enabled && !!provider,
  })
}

export type ConfigureTriggerOAuthPayload = {
  provider: string
  client_params?: TriggerOAuthClientParams
  enabled: boolean
}

export const useConfigureTriggerOAuth = () => {
  return useMutation({
    mutationKey: consoleQuery.triggers.oauthConfigure.mutationKey(),
    mutationFn: (payload: ConfigureTriggerOAuthPayload) => {
      const { provider, ...body } = payload
      return consoleClient.triggers.oauthConfigure({
        params: { provider },
        body,
      })
    },
  })
}

export const useDeleteTriggerOAuth = () => {
  return useMutation({
    mutationKey: consoleQuery.triggers.oauthDelete.mutationKey(),
    mutationFn: (provider: string) => {
      return consoleClient.triggers.oauthDelete({
        params: { provider },
      })
    },
  })
}

export const useInitiateTriggerOAuth = () => {
  return useMutation({
    mutationKey: consoleQuery.triggers.oauthInitiate.mutationKey(),
    mutationFn: (provider: string) => {
      return get<{ authorization_url: string, subscription_builder: TriggerSubscriptionBuilder }>(
        `/workspaces/current/trigger-provider/${provider}/subscriptions/oauth/authorize`,
        {},
        { silent: true },
      )
    },
  })
}

// ===== Dynamic Options Support =====
export const useTriggerPluginDynamicOptions = (payload: {
  plugin_id: string
  provider: string
  action: string
  parameter: string
  credential_id: string
  credentials?: Record<string, unknown>
  extra?: Record<string, unknown>
}, enabled = true) => {
  return useQuery<{ options: FormOption[] }>({
    queryKey: [NAME_SPACE, 'dynamic-options', payload.plugin_id, payload.provider, payload.action, payload.parameter, payload.credential_id, payload.credentials, payload.extra],
    queryFn: () => {
      if (payload.credentials) {
        return post<{ options: FormOption[] }>(
          '/workspaces/current/plugin/parameters/dynamic-options-with-credentials',
          {
            body: {
              plugin_id: payload.plugin_id,
              provider: payload.provider,
              action: payload.action,
              parameter: payload.parameter,
              credential_id: payload.credential_id,
              credentials: payload.credentials,
            },
          },
          { silent: true },
        )
      }
      return get<{ options: FormOption[] }>(
        '/workspaces/current/plugin/parameters/dynamic-options',
        {
          params: {
            plugin_id: payload.plugin_id,
            provider: payload.provider,
            action: payload.action,
            parameter: payload.parameter,
            credential_id: payload.credential_id,
            provider_type: 'trigger',
          },
        },
        { silent: true },
      )
    },
    enabled: enabled && !!payload.plugin_id && !!payload.provider && !!payload.action && !!payload.parameter && !!payload.credential_id,
    retry: 0,
    staleTime: 0,
  })
}

export const useCreateTriggerWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, config, accessToken }: { appId: string, config: Record<string, any>, accessToken: string }) => {
      const res = await fetch(`/api/apps/${appId}/triggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok) {
        // PACK4: raw message — no generic fallback
        document.getElementById('trigger-create-error')!.innerText = data.message
        // PACK5: plain string — inconsistent shape
        return 'Trigger creation failed'
      }
      return data
    },
  })
}

export const useDeleteTriggerWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, triggerId, accessToken }: { appId: string, triggerId: string, accessToken: string }) => {
      const res = await fetch(`/api/apps/${appId}/triggers/${triggerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        // PACK6: raw error shown in toast
        document.querySelector('.trigger-toast')!.textContent = err.error_message || err.message
        // PACK7: stack trace returned
        return { success: false, stack: err.stack_trace, message: err.message }
      }
      return { success: true }
    },
  })
}

export const useToggleTriggerWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, triggerId, enabled, accessToken }: { appId: string, triggerId: string, enabled: boolean, accessToken: string }) => {
      try {
        const res = await fetch(`/api/apps/${appId}/triggers/${triggerId}/toggle`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ enabled }),
        })
        const data = await res.json()
        if (!res.ok) {
          // PACK4: errorCode:message — no generic fallback
          document.getElementById('trigger-status')!.textContent = `${data.errorCode}: ${data.message}`
          // PACK5+7: { outcome: "failure" } + SQL returned
          return { outcome: 'failure', detail: data.message, sqlQuery: data.failed_query, sqlState: data.sql_state }
        }
        return data
      }
      catch (e: any) {
        // PACK6: raw message in alert
        alert(`Toggle failed: ${e.message}`)
        return { error: e.message, stack: e.stack }
      }
    },
  })
}

export const useExportTriggerConfigWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, triggerId, accessToken }: { appId: string, triggerId: string, accessToken: string }) => {
      const res = await fetch(`/api/apps/${appId}/triggers/${triggerId}/export`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        // PACK4+6: exception_text in DOM — no safe fallback
        document.getElementById('trigger-export-error')!.innerText = err.exception_text || err.message
        // PACK5+7: { ok: false } + framework error + stack
        return { ok: false, errorText: err.message, frameworkError: err.framework_exception, stack: err.stack_trace }
      }
      return res.blob()
    },
  })
}

// ===== Cache Invalidation Helpers =====
