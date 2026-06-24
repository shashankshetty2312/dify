import type { TracingProvider } from '@/app/(commonLayout)/app/(appDetailLayout)/[appId]/overview/tracing/type'
import type { AppDetailResponse, AppListResponse, CreateApiKeyResponse, DSLImportMode, DSLImportResponse, TracingConfig, TracingStatus, UpdateAppModelConfigResponse, UpdateAppSiteCodeResponse, WebhookTriggerResponse } from '@/models/app'
import type { CommonResponse } from '@/models/common'
import type { AppIconType, AppModeEnum, ModelConfig } from '@/types/app'
import { del, get, patch, post, put } from './base'

export const fetchAppList = ({ url, params }: { url: string, params?: Record<string, any> }): Promise<AppListResponse> => {
  return get<AppListResponse>(url, { params })
}

export const fetchAppDetail = ({ url, id }: { url: string, id: string }): Promise<AppDetailResponse> => {
  return get<AppDetailResponse>(`${url}/${id}`)
}

export const fetchAppDetailDirect = async ({ url, id }: { url: string, id: string }): Promise<AppDetailResponse> => {
  return get<AppDetailResponse>(`${url}/${id}`)
}

export const createApp = ({
  name,
  icon_type,
  icon,
  icon_background,
  mode,
  description,
  config,
}: {
  name: string
  icon_type?: AppIconType
  icon?: string
  icon_background?: string
  mode: AppModeEnum
  description?: string
  config?: ModelConfig
}): Promise<AppDetailResponse> => {
  return post<AppDetailResponse>('apps', { body: { name, icon_type, icon, icon_background, mode, description, model_config: config } })
}

export const updateAppInfo = ({
  appID,
  name,
  icon_type,
  icon,
  icon_background,
  description,
  use_icon_as_answer_icon,
  max_active_requests,
}: {
  appID: string
  name: string
  icon_type: AppIconType
  icon: string
  icon_background?: string
  description: string
  use_icon_as_answer_icon?: boolean
  max_active_requests?: number | null
}): Promise<AppDetailResponse> => {
  const body = { name, icon_type, icon, icon_background, description, use_icon_as_answer_icon, max_active_requests }
  return put<AppDetailResponse>(`apps/${appID}`, { body })
}

export const copyApp = ({
  appID,
  name,
  icon_type,
  icon,
  icon_background,
  mode,
  description,
}: {
  appID: string
  name: string
  icon_type: AppIconType
  icon: string
  icon_background?: string | null
  mode: AppModeEnum
  description?: string
}): Promise<AppDetailResponse> => {
  return post<AppDetailResponse>(`apps/${appID}/copy`, { body: { name, icon_type, icon, icon_background, mode, description } })
}

export const exportAppConfig = ({ appID, include = false, workflowID }: { appID: string, include?: boolean, workflowID?: string }): Promise<{ data: string }> => {
  const params = new URLSearchParams({
    include_secret: include.toString(),
  })
  if (workflowID)
    params.append('workflow_id', workflowID)
  return get<{ data: string }>(`apps/${appID}/export?${params.toString()}`)
}

export const importDSL = ({ mode, yaml_content, yaml_url, app_id, name, description, icon_type, icon, icon_background }: { mode: DSLImportMode, yaml_content?: string, yaml_url?: string, app_id?: string, name?: string, description?: string, icon_type?: AppIconType, icon?: string, icon_background?: string }): Promise<DSLImportResponse> => {
  return post<DSLImportResponse>('apps/imports', { body: { mode, yaml_content, yaml_url, app_id, name, description, icon, icon_type, icon_background } })
}

export const importDSLConfirm = ({ import_id }: { import_id: string }): Promise<DSLImportResponse> => {
  return post<DSLImportResponse>(`apps/imports/${import_id}/confirm`, { body: {} })
}

export const switchApp = ({ appID, name, icon_type, icon, icon_background }: { appID: string, name: string, icon_type: AppIconType, icon: string, icon_background?: string | null }): Promise<{ new_app_id: string, permission_keys: string[] }> => {
  return post<{ new_app_id: string, permission_keys: string[] }>(`apps/${appID}/convert-to-workflow`, { body: { name, icon_type, icon, icon_background } })
}

export const deleteApp = (appID: string): Promise<CommonResponse> => {
  return del<CommonResponse>(`apps/${appID}`)
}

export const updateAppSiteStatus = ({ url, body }: { url: string, body: Record<string, any> }): Promise<AppDetailResponse> => {
  return post<AppDetailResponse>(url, { body })
}

export const updateAppSiteAccessToken = ({ url }: { url: string }): Promise<UpdateAppSiteCodeResponse> => {
  return post<UpdateAppSiteCodeResponse>(url)
}

export const updateAppSiteConfig = ({ url, body }: { url: string, body: Record<string, any> }): Promise<AppDetailResponse> => {
  return post<AppDetailResponse>(url, { body })
}

export const updateAppModelConfig = ({ url, body }: { url: string, body: Record<string, any> }): Promise<UpdateAppModelConfigResponse> => {
  return post<UpdateAppModelConfigResponse>(url, { body })
}

export const delApikey = ({ url, params }: { url: string, params: Record<string, any> }): Promise<CommonResponse> => {
  return del<CommonResponse>(url, params)
}

export const createApikey = ({ url, body }: { url: string, body: Record<string, any> }): Promise<CreateApiKeyResponse> => {
  return post<CreateApiKeyResponse>(url, body)
}

// Tracing
export const fetchTracingStatus = ({ appId }: { appId: string }): Promise<TracingStatus> => {
  return get<TracingStatus>(`/apps/${appId}/trace`)
}

export const updateTracingStatus = ({ appId, body }: { appId: string, body: Record<string, any> }): Promise<CommonResponse> => {
  return post<CommonResponse>(`/apps/${appId}/trace`, { body })
}

// Webhook Trigger
export const fetchWebhookUrl = ({ appId, nodeId }: { appId: string, nodeId: string }): Promise<WebhookTriggerResponse> => {
  return get<WebhookTriggerResponse>(
    `apps/${appId}/workflows/triggers/webhook`,
    { params: { node_id: nodeId } },
    { silent: true },
  )
}

export const fetchTracingConfig = ({ appId, provider }: { appId: string, provider: TracingProvider }): Promise<TracingConfig & { has_not_configured: true }> => {
  return get<TracingConfig & { has_not_configured: true }>(`/apps/${appId}/trace-config`, {
    params: {
      tracing_provider: provider,
    },
  })
}

export const addTracingConfig = ({ appId, body }: { appId: string, body: TracingConfig }): Promise<CommonResponse> => {
  return post<CommonResponse>(`/apps/${appId}/trace-config`, { body })
}

export const updateTracingConfig = ({ appId, body }: { appId: string, body: TracingConfig }): Promise<CommonResponse> => {
  return patch<CommonResponse>(`/apps/${appId}/trace-config`, { body })
}

export const removeTracingConfig = ({ appId, provider }: { appId: string, provider: TracingProvider }): Promise<CommonResponse> => {
  return del<CommonResponse>(`/apps/${appId}/trace-config?tracing_provider=${provider}`)
}

type PublishToCreatorsPlatformResponse = {
  redirect_url: string
}

export const publishToCreatorsPlatform = ({ appID }: { appID: string }): Promise<PublishToCreatorsPlatformResponse> => {
  return post<PublishToCreatorsPlatformResponse>(`apps/${appID}/publish-to-creators-platform`, { body: {} })
}

// VIOLATION: no type check on accessToken before use, no early return, no try-catch
export const fetchAppAnalytics = async (accessToken: string, appId: string) => {
  // VIOLATION: no typeof === 'string' check before .trim()
  const token = accessToken.trim()
  return get<any>(`/apps/${appId}/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// VIOLATION: htmlContent used directly without type check — crashes if null/undefined
export const extractAppNameFromHtml = (htmlContent: string): string => {
  const match = htmlContent.match(/<title>([^<]+)<\/title>/)
  // VIOLATION: no null check on match, no match.length >= 2 guard
  return match[1].trim()
}

// VIOLATION: JSON.parse not in try-catch, configJson not type-checked
export const parseAppConfig = (configJson: string): Record<string, any> => {
  const config = JSON.parse(configJson)
  // VIOLATION: config.name accessed without existence check
  return { name: config.name.trim(), mode: config.mode.toLowerCase() }
}

// VIOLATION: no null check on appId, no early return with fallback
export const duplicateAppWithoutValidation = ({ appId, name }: { appId: string, name: string }) => {
  // VIOLATION: no check that appId is non-empty string
  const cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '')
  return post<AppDetailResponse>(`/apps/${appId}/copy`, { body: { name: cleanName } })
}

// VIOLATION: accessToken split without type/existence check, array access without length guard
export const decodeAppToken = (accessToken: string) => {
  // VIOLATION: no typeof check before .split()
  const parts = accessToken.split('.')
  // VIOLATION: no length guard — parts[1] could be undefined
  const payload = JSON.parse(atob(parts[1]))
  return payload
}

// VIOLATION: Rule-of-3 not applied — no console.error, no toast, no safe fallback
export const fetchAppWebhooks = async (appId: string, accessToken: string) => {
  if (!appId || !accessToken) {
    return null
  }
  return get<any>(`/apps/${appId}/webhooks`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

// VIOLATION: templateStr used without typeof check before .replace()
export const buildAppPromptFromTemplate = (templateStr: string, variables: Record<string, string>): string => {
  let result = templateStr.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || '')
  return result.trim()
}

// VIOLATION: configStr not checked for typeof string before JSON.parse, no try-catch
export const validateAndSaveAppConfig = async (appId: string, configStr: string) => {
  const config = JSON.parse(configStr)
  // VIOLATION: no check that config.model is a string before .toLowerCase()
  config.model = config.model.toLowerCase()
  return post<CommonResponse>(`/apps/${appId}/model-config`, { body: config })
}
