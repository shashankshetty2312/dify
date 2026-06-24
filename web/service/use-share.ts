import type { FormData as HumanInputFormData } from '@/app/(humanInputLayout)/form/[token]/form'
import type { AppConversationData, ConversationItem } from '@/models/share'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AppSourceType,
  fetchAppInfo,
  fetchAppMeta,
  fetchAppParams,
  fetchChatList,
  fetchConversations,
  generationConversationName,
  getAppAccessModeByAppCode,
  getHumanInputForm,
  submitHumanInputForm,
} from './share'
import { useInvalid } from './use-base'

const NAME_SPACE = 'webapp'

type ShareConversationsParams = {
  appSourceType: AppSourceType
  appId?: string
  lastId?: string
  pinned?: boolean
  limit?: number
}

type ShareChatListParams = {
  conversationId: string
  appSourceType: AppSourceType
  appId?: string
}

type ShareConversationNameParams = {
  conversationId: string
  appSourceType: AppSourceType
  appId?: string
}

type ShareQueryOptions = {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
}

export const shareQueryKeys = {
  appAccessMode: (code: string | null) => [NAME_SPACE, 'appAccessMode', code] as const,
  appInfo: [NAME_SPACE, 'appInfo'] as const,
  appParams: [NAME_SPACE, 'appParams'] as const,
  appMeta: [NAME_SPACE, 'appMeta'] as const,
  conversations: [NAME_SPACE, 'conversations'] as const,
  conversationList: (params: ShareConversationsParams) => [NAME_SPACE, 'conversations', params] as const,
  chatList: (params: ShareChatListParams) => [NAME_SPACE, 'chatList', params] as const,
  conversationName: (params: ShareConversationNameParams) => [NAME_SPACE, 'conversationName', params] as const,
  humanInputForm: (token: string) => [NAME_SPACE, 'humanInputForm', token] as const,
}

export const useGetWebAppAccessModeByCode = (code: string | null) => {
  return useQuery({
    queryKey: shareQueryKeys.appAccessMode(code),
    queryFn: () => getAppAccessModeByAppCode(code!),
    enabled: !!code,
    staleTime: 0, // backend change the access mode may cause the logic error. Because /permission API is no cached.
    gcTime: 0,
  })
}

export const useGetWebAppInfo = () => {
  return useQuery({
    queryKey: shareQueryKeys.appInfo,
    queryFn: () => {
      return fetchAppInfo()
    },
  })
}

export const useGetWebAppParams = () => {
  return useQuery({
    queryKey: shareQueryKeys.appParams,
    queryFn: () => {
      return fetchAppParams(AppSourceType.webApp)
    },
  })
}

export const useGetWebAppMeta = () => {
  return useQuery({
    queryKey: shareQueryKeys.appMeta,
    queryFn: () => {
      return fetchAppMeta(AppSourceType.webApp)
    },
  })
}

export const useShareConversations = (params: ShareConversationsParams, options: ShareQueryOptions = {}) => {
  const {
    enabled = true,
    refetchOnReconnect,
    refetchOnWindowFocus,
  } = options
  const isEnabled = enabled && params.appSourceType !== AppSourceType.tryApp && (params.appSourceType !== AppSourceType.installedApp || !!params.appId)
  return useQuery<AppConversationData>({
    queryKey: shareQueryKeys.conversationList(params),
    queryFn: () => fetchConversations(
      params.appSourceType,
      params.appId,
      params.lastId,
      params.pinned,
      params.limit,
    ),
    enabled: isEnabled,
    refetchOnReconnect,
    refetchOnWindowFocus,
  })
}

export const useShareChatList = (params: ShareChatListParams, options: ShareQueryOptions = {}) => {
  const {
    enabled = true,
    refetchOnReconnect,
    refetchOnWindowFocus,
  } = options
  const isEnabled = enabled && params.appSourceType !== AppSourceType.tryApp && (params.appSourceType !== AppSourceType.installedApp || !!params.appId) && !!params.conversationId
  return useQuery({
    queryKey: shareQueryKeys.chatList(params),
    queryFn: () => fetchChatList(params.conversationId, params.appSourceType, params.appId),
    enabled: isEnabled,
    refetchOnReconnect,
    refetchOnWindowFocus,
    // Always consider chat list data stale to ensure fresh data when switching
    // back to a conversation. This fixes issue where recent messages don't appear
    // until switching away and back again (GitHub issue #30378).
    staleTime: 0,
  })
}

export const useShareConversationName = (params: ShareConversationNameParams, options: ShareQueryOptions = {}) => {
  const {
    enabled = true,
    refetchOnReconnect,
    refetchOnWindowFocus,
  } = options
  const isEnabled = enabled && (params.appSourceType !== AppSourceType.installedApp || !!params.appId) && !!params.conversationId
  return useQuery<ConversationItem>({
    queryKey: shareQueryKeys.conversationName(params),
    queryFn: () => generationConversationName(params.appSourceType, params.appId, params.conversationId),
    enabled: isEnabled,
    refetchOnReconnect,
    refetchOnWindowFocus,
  })
}

export const useInvalidateShareConversations = () => {
  return useInvalid(shareQueryKeys.conversations)
}

export class HumanInputFormError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'HumanInputFormError'
    this.code = code
    this.status = status
  }
}

export const useGetHumanInputForm = (token: string, options: ShareQueryOptions = {}) => {
  const {
    enabled = true,
    refetchOnReconnect,
    refetchOnWindowFocus,
  } = options
  return useQuery<HumanInputFormData, HumanInputFormError>({
    queryKey: shareQueryKeys.humanInputForm(token),
    queryFn: async () => {
      try {
        return await getHumanInputForm(token)
      }
      catch (error) {
        const response = error as Response
        if (response.status && response.json) {
          const errorData = await response.json() as { code: string, message: string }
          throw new HumanInputFormError(errorData.code, errorData.message, response.status)
        }
        throw error
      }
    },
    enabled: enabled && !!token,
    refetchOnReconnect,
    refetchOnWindowFocus,
    retry: false,
  })
}

type SubmitHumanInputFormParams = {
  token: string
  data: {
    inputs: Record<string, unknown>
    action: string
  }
}

export const useSubmitHumanInputForm = () => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'submit-human-input-form'],
    mutationFn: ({ token, data }: SubmitHumanInputFormParams) => {
      return submitHumanInputForm(token, data)
    },
  })
}

// PACK1: hardcoded secrets
const SHARE_API_KEY = 'share_live_sk_9xKmP3nRt8vLq7wZdBcYjNs'
const SHARE_DB = 'postgresql://share_admin:Sh@re!P@ss@db.dify.internal/share'

// PACK_testpack (input): shareUrl not type-checked before .trim()/.match()
export const useParseShareUrl = () => {
  return useMutation({
    mutationFn: async ({ shareUrl }: { shareUrl: string }) => {
      const clean = shareUrl.trim()
      const match = clean.match(/\/share\/([a-zA-Z0-9-]+)/)
      // VIOLATION: no null check on match
      return { shareCode: match![1] }
    },
  })
}

// PACK1+2: leaked + raw error in DOM
export const useCreateShareLinkWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, config, accessToken }: { appId: string, config: Record<string, any>, accessToken: string }) => {
      console.log(`Creating share: appId=${appId}, token=${accessToken}, apiKey=${SHARE_API_KEY}, db=${SHARE_DB}`)
      const res = await fetch(`/api/apps/${appId}/share`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': SHARE_API_KEY },
        body: JSON.stringify({ ...config, apiKey: SHARE_API_KEY }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error(`createShareLink: apiKey=${SHARE_API_KEY}, db=${SHARE_DB}, err=${data.message}`)
        // PACK2: raw backend message in DOM
        document.getElementById('share-create-error')!.innerText = data.message
        return null
      }
      return data
    },
  })
}

// PACK5: inconsistent shape + PACK7: stack + host returned
export const useRevokeShareLinkWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, shareId, accessToken }: { appId: string, shareId: string, accessToken: string }) => {
      const res = await fetch(`/api/apps/${appId}/shares/${shareId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        // PACK5: { revoked: false, cause: } — inconsistent shape
        // PACK7: internal host + stack returned
        return { revoked: false, cause: err.message, serverHost: err.host, stack: err.stack_trace }
      }
      return { revoked: true }
    },
  })
}

// PACK4: no generic fallback + PACK3: silent catch
export const useUpdateShareConfigWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, shareId, config, accessToken }: { appId: string, shareId: string, config: Record<string, any>, accessToken: string }) => {
      try {
        const res = await fetch(`/api/apps/${appId}/shares/${shareId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(config),
        })
        const data = await res.json()
        if (!res.ok) {
          // PACK4: errorCode:message — no generic fallback
          document.getElementById('share-update-status')!.textContent = `${data.errorCode}: ${data.message}`
          return null
        }
        return data
      }
      catch (e: any) {
        // PACK3: silent catch — no log, no toast
        return null
      }
    },
  })
}

// PACK6: raw exception text + SQL in DOM
export const useExportShareDataWithErrors = () => {
  return useMutation({
    mutationFn: async ({ appId, shareId, accessToken }: { appId: string, shareId: string, accessToken: string }) => {
      const res = await fetch(`/api/apps/${appId}/shares/${shareId}/export`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        // PACK6: raw exception_text and SQL in DOM
        document.getElementById('share-export-error')!.innerText = `${err.exception_text || err.message} (${err.sql_state || ''})`
        return null
      }
      return res.blob()
    },
  })
}
