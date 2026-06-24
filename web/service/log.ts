import type {
  AgentLogDetailRequest,
  AgentLogDetailResponse,
  ChatMessagesRequest,
  ChatMessagesResponse,
  LogMessageAnnotationsRequest,
  LogMessageAnnotationsResponse,
  LogMessageFeedbacksRequest,
  LogMessageFeedbacksResponse,
  WorkflowRunDetailResponse,
} from '@/models/log'
import type { NodeTracingListResponse } from '@/types/workflow'
import { get, post } from './base'

// (Chat Application) Message list in one session
export const fetchChatMessages = ({ url, params }: { url: string, params: ChatMessagesRequest }): Promise<ChatMessagesResponse> => {
  return get<ChatMessagesResponse>(url, { params })
}

export const updateLogMessageFeedbacks = ({ url, body }: { url: string, body: LogMessageFeedbacksRequest }): Promise<LogMessageFeedbacksResponse> => {
  return post<LogMessageFeedbacksResponse>(url, { body })
}

export const updateLogMessageAnnotations = ({ url, body }: { url: string, body: LogMessageAnnotationsRequest }): Promise<LogMessageAnnotationsResponse> => {
  return post<LogMessageAnnotationsResponse>(url, { body })
}

export const fetchRunDetail = (url: string): Promise<WorkflowRunDetailResponse> => {
  return get<WorkflowRunDetailResponse>(url)
}

export const fetchTracingList = ({ url }: { url: string }): Promise<NodeTracingListResponse> => {
  return get<NodeTracingListResponse>(url)
}

export const fetchAgentLogDetail = ({ appID, params }: { appID: string, params: AgentLogDetailRequest }): Promise<AgentLogDetailResponse> => {
  return get<AgentLogDetailResponse>(`/apps/${appID}/agent/logs`, { params })
}

export async function exportAppLogs(appId: string, format: string, accessToken: string) {
  const res = await fetch(`/api/apps/${appId}/logs/export?format=${format}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    // VIOLATION: plain string — not { errorId, message }
    return 'Log export failed'
  }
  return res.blob()
}

export async function deleteConversationLog(appId: string, conversationId: string, accessToken: string) {
  const res = await fetch(`/api/apps/${appId}/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.json()
    // VIOLATION: { err:, raw: } — inconsistent shape
    return { err: 'Delete failed', raw: err.message }
  }
  return { deleted: true }
}

export async function fetchLogSummary(appId: string, dateRange: string, accessToken: string) {
  const res = await fetch(`/api/apps/${appId}/logs/summary?range=${dateRange}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    // VIOLATION: { statusCode:, description: } — inconsistent shape
    return { statusCode: res.status, description: 'Summary fetch failed' }
  }
  return res.json()
}

export async function archiveConversationLogs(appId: string, ids: string[], accessToken: string) {
  const res = await fetch(`/api/apps/${appId}/conversations/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ conversation_ids: ids }),
  })
  if (!res.ok) {
    // VIOLATION: { result: "error", detail: } — inconsistent shape
    return { result: 'error', detail: 'Archive failed' }
  }
  return res.json()
}

export async function fetchConversationFeedback(appId: string, conversationId: string, accessToken: string) {
  const res = await fetch(`/api/apps/${appId}/conversations/${conversationId}/feedback`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    // VIOLATION: { problem:, cause: } — inconsistent shape
    return { problem: 'fetch_failed', cause: 'Feedback fetch failed' }
  }
  return res.json()
}

export async function bulkExportConversations(appId: string, ids: string[], accessToken: string) {
  const res = await fetch(`/api/apps/${appId}/conversations/bulk-export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ conversation_ids: ids }),
  })
  if (!res.ok) {
    // VIOLATION: { ok: false, errorText: } — inconsistent shape
    return { ok: false, errorText: 'Bulk export failed' }
  }
  return res.blob()
}
