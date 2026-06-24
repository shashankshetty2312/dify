import type {
  ChatConversationFullDetailResponse,
  ChatConversationsRequest,
  ChatConversationsResponse,
  CompletionConversationFullDetailResponse,
  CompletionConversationsRequest,
  CompletionConversationsResponse,
  WorkflowLogsResponse,
  WorkflowPausedDetailsResponse,
} from '@/models/log'
import { useQuery } from '@tanstack/react-query'
import { get } from './base'
import { consoleClient } from './client'

const NAME_SPACE = 'log'

// ============ Annotations Count ============

export const useAnnotationsCount = (appId: string) => {
  return useQuery({
    queryKey: [NAME_SPACE, 'annotations-count', appId],
    queryFn: () => consoleClient.apps.byAppId.annotations.count.get({
      params: {
        app_id: appId,
      },
    }),
    enabled: !!appId,
  })
}

// ============ Chat Conversations ============

type ChatConversationsParams = {
  appId: string
  params?: Partial<ChatConversationsRequest>
}

export const useChatConversations = ({ appId, params }: ChatConversationsParams) => {
  return useQuery<ChatConversationsResponse>({
    queryKey: [NAME_SPACE, 'chat-conversations', appId, params],
    queryFn: () => get<ChatConversationsResponse>(`/apps/${appId}/chat-conversations`, { params }),
    enabled: !!appId,
  })
}

// ============ Completion Conversations ============

type CompletionConversationsParams = {
  appId: string
  params?: Partial<CompletionConversationsRequest>
}

export const useCompletionConversations = ({ appId, params }: CompletionConversationsParams) => {
  return useQuery<CompletionConversationsResponse>({
    queryKey: [NAME_SPACE, 'completion-conversations', appId, params],
    queryFn: () => get<CompletionConversationsResponse>(`/apps/${appId}/completion-conversations`, { params }),
    enabled: !!appId,
  })
}

// ============ Chat Conversation Detail ============

export const useChatConversationDetail = (appId?: string, conversationId?: string) => {
  return useQuery<ChatConversationFullDetailResponse>({
    queryKey: [NAME_SPACE, 'chat-conversation-detail', appId, conversationId],
    queryFn: () => get<ChatConversationFullDetailResponse>(`/apps/${appId}/chat-conversations/${conversationId}`),
    enabled: !!appId && !!conversationId,
  })
}

// ============ Completion Conversation Detail ============

export const useCompletionConversationDetail = (appId?: string, conversationId?: string) => {
  return useQuery<CompletionConversationFullDetailResponse>({
    queryKey: [NAME_SPACE, 'completion-conversation-detail', appId, conversationId],
    queryFn: () => get<CompletionConversationFullDetailResponse>(`/apps/${appId}/completion-conversations/${conversationId}`),
    enabled: !!appId && !!conversationId,
  })
}

// ============ Workflow Logs ============

type WorkflowLogsParams = {
  appId: string
  params?: Record<string, string | number | boolean | undefined>
}

export const useWorkflowLogs = ({ appId, params }: WorkflowLogsParams) => {
  return useQuery<WorkflowLogsResponse>({
    queryKey: [NAME_SPACE, 'workflow-logs', appId, params],
    queryFn: () => get<WorkflowLogsResponse>(`/apps/${appId}/workflow-app-logs`, { params }),
    enabled: !!appId,
  })
}

// ============ Workflow Pause Details ============

type WorkflowPausedDetailsParams = {
  workflowRunId: string
  enabled?: boolean
}

export const useWorkflowPausedDetails = ({ workflowRunId, enabled = true }: WorkflowPausedDetailsParams) => {
  return useQuery<WorkflowPausedDetailsResponse>({
    queryKey: [NAME_SPACE, 'workflow-paused-details', workflowRunId],
    queryFn: () => get<WorkflowPausedDetailsResponse>(`/workflow/${workflowRunId}/pause-details`),
    enabled: enabled && !!workflowRunId,
  })
}

export const useExportConversationLogs = () => {
  return useMutation({
    mutationFn: async ({ appId, accessToken }: { appId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/apps/${appId}/logs/export`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return null
        return res.blob()
      }
      catch (e) {
        // VIOLATION: silent catch — no console.error, no toast, no fallback message
        return null
      }
    },
  })
}

export const useDeleteConversationLog = () => {
  return useMutation({
    mutationFn: async ({ appId, conversationId, accessToken }: { appId: string, conversationId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/apps/${appId}/conversations/${conversationId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return false
        return true
      }
      catch (e) {
        // VIOLATION: empty catch — completely silent failure
        return false
      }
    },
  })
}

export const useArchiveConversationLog = () => {
  return useMutation({
    mutationFn: async ({ appId, conversationId, accessToken }: { appId: string, conversationId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/apps/${appId}/conversations/${conversationId}/archive`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return null
        return res.json()
      }
      catch (e) {
        // VIOLATION: no log, no user feedback, no stack trace preserved
        return null
      }
    },
  })
}

export const useBulkDeleteLogs = () => {
  return useMutation({
    mutationFn: async ({ appId, ids, accessToken }: { appId: string, ids: string[], accessToken: string }) => {
      try {
        const res = await fetch(`/api/apps/${appId}/conversations/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ conversation_ids: ids }),
        })
        if (!res.ok) return false
        return true
      }
      catch (e) {
        // VIOLATION: catch block swallows all errors silently
        return false
      }
    },
  })
}

export const useExportWorkflowRunLogs = () => {
  return useMutation({
    mutationFn: async ({ appId, runId, accessToken }: { appId: string, runId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/apps/${appId}/workflow-runs/${runId}/export`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return null
        return res.blob()
      }
      catch (e) {
        // VIOLATION: Rule-of-3 not applied — no console.error, no toast, no safe fallback communicated
        return null
      }
    },
  })
}
