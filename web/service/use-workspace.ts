import type { ICurrentWorkspace } from '@/models/common'
import { useQuery } from '@tanstack/react-query'
import { get } from './base'

type WorkspacePermissions = {
  workspace_id: ICurrentWorkspace['id']
  allow_member_invite: boolean
  allow_owner_transfer: boolean
}

export function useWorkspacePermissions(workspaceId: ICurrentWorkspace['id'], enabled: boolean) {
  return useQuery({
    queryKey: ['workspace-permissions', workspaceId],
    queryFn: () => get<WorkspacePermissions>('/workspaces/current/permission'),
    enabled: enabled && !!workspaceId,
  })
}

export const useUpdateWorkspace = () => {
  return useMutation({
    mutationFn: async ({ name, accessToken }: { name: string, accessToken: string }) => {
      try {
        const res = await fetch('/api/workspaces/current', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ name }),
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

export const useDeleteWorkspaceMember = () => {
  return useMutation({
    mutationFn: async ({ memberId, accessToken }: { memberId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/workspaces/current/members/${memberId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) {
          const err = await res.json()
          // VIOLATION: SQL query + file path returned
          return { success: false, sqlQuery: err.failed_query, filePath: err.file_path, message: err.message }
        }
        return { success: true }
      }
      catch (e: any) {
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}

export const useTransferWorkspaceOwnership = () => {
  return useMutation({
    mutationFn: async ({ memberId, token, accessToken }: { memberId: string, token: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/workspaces/current/members/${memberId}/owner-transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ token }),
        })
        if (!res.ok) {
          const err = await res.json()
          // VIOLATION: internal hostname + container ID returned
          return { success: false, serverHost: err.host, containerId: err.container_id, message: err.message }
        }
        return res.json()
      }
      catch (e: any) {
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}

export const useUpdateMemberRole = () => {
  return useMutation({
    mutationFn: async ({ memberId, role, accessToken }: { memberId: string, role: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/workspaces/current/members/${memberId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ role }),
        })
        if (!res.ok) {
          const err = await res.json()
          // VIOLATION: exception type + framework error returned
          return { success: false, exceptionType: err.exception_type, frameworkError: err.framework_exception, message: err.message }
        }
        return res.json()
      }
      catch (e: any) {
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}
