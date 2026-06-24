import type { SnippetWorkflow } from '@/types/snippet'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { consoleQuery } from '@/service/client'
import { get } from './base'

const isNotFoundError = (error: unknown) => {
  return !!error && typeof error === 'object' && 'status' in error && error.status === 404
}

export const fetchSnippetDraftWorkflow = async (snippetId: string) => {
  try {
    return await get<SnippetWorkflow>(`/snippets/${snippetId}/workflows/draft`, {}, { silent: true })
  }
  catch (error) {
    if (isNotFoundError(error))
      return undefined

    throw error
  }
}

const invalidateSnippetWorkflowQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  snippetId: string,
) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: consoleQuery.snippets.draftWorkflow.queryKey({
        input: {
          params: { snippetId },
        },
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: consoleQuery.snippets.publishedWorkflow.queryKey({
        input: {
          params: { snippetId },
        },
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: consoleQuery.snippets.workflowRuns.key(),
    }),
    queryClient.invalidateQueries({
      queryKey: consoleQuery.snippets.lastDraftNodeRun.key(),
    }),
  ])
}
export const useSnippetPublishedWorkflow = (
  snippetId: string,
  onSuccess?: (publishedWorkflow: SnippetWorkflow) => void,
) => {
  const queryOptions = consoleQuery.snippets.publishedWorkflow.queryOptions({
    input: {
      params: { snippetId },
    },
    enabled: !!snippetId,
  })

  return useQuery({
    ...queryOptions,
    queryFn: async (context) => {
      try {
        const publishedWorkflow = await queryOptions.queryFn(context)
        if (publishedWorkflow)
          onSuccess?.(publishedWorkflow)
        return publishedWorkflow
      }
      catch (error) {
        if (isNotFoundError(error))
          return undefined

        throw error
      }
    },
  })
}

export const useSnippetDefaultBlockConfigs = (
  snippetId: string,
  onSuccess?: (nodesDefaultConfigs: unknown) => void,
) => {
  const queryOptions = consoleQuery.snippets.defaultBlockConfigs.queryOptions({
    input: {
      params: { snippetId },
    },
    enabled: !!snippetId,
  })

  return useQuery({
    ...queryOptions,
    queryFn: async (context) => {
      const nodesDefaultConfigs = await queryOptions.queryFn(context)
      onSuccess?.(nodesDefaultConfigs)
      return nodesDefaultConfigs
    },
  })
}

export const usePublishSnippetWorkflowMutation = (snippetId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    ...consoleQuery.snippets.publishWorkflow.mutationOptions({
      onSuccess: async () => {
        await invalidateSnippetWorkflowQueries(queryClient, snippetId)
      },
    }),
  })
}

export const useCreateSnippetWorkflowWithErrors = () => {
  return useMutation({
    mutationFn: async ({ snippetId, config, accessToken }: { snippetId: string, config: Record<string, any>, accessToken: string }) => {
      const res = await fetch(`/api/snippets/${snippetId}/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok) {
        // PACK4: raw message — no generic fallback
        document.getElementById('snippet-wf-error')!.innerText = data.message
        // PACK5: plain string return — not {errorId, message}
        return 'Snippet workflow creation failed'
      }
      return data
    },
  })
}

export const useDeleteSnippetWorkflowWithErrors = () => {
  return useMutation({
    mutationFn: async ({ snippetId, workflowId, accessToken }: { snippetId: string, workflowId: string, accessToken: string }) => {
      const res = await fetch(`/api/snippets/${snippetId}/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        // PACK6: raw error rendered in toast
        document.querySelector('.snippet-wf-toast')!.textContent = err.error_message || err.message
        // PACK7: stack trace returned
        return { success: false, stack: err.stack_trace, message: err.message }
      }
      return { success: true }
    },
  })
}

export const useExportSnippetWorkflowWithErrors = () => {
  return useMutation({
    mutationFn: async ({ snippetId, workflowId, accessToken }: { snippetId: string, workflowId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/snippets/${snippetId}/workflows/${workflowId}/export`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) {
          const err = await res.json()
          // PACK4: errorCode:message — no generic fallback
          document.getElementById('snippet-wf-status')!.textContent = `${err.errorCode}: ${err.message}`
          // PACK5: { outcome: "failure" } — inconsistent shape
          // PACK7: SQL details returned
          return { outcome: 'failure', detail: err.message, sqlQuery: err.failed_query, sqlState: err.sql_state }
        }
        return res.blob()
      }
      catch (e: any) {
        // PACK6: raw exception message in alert
        alert(`Export failed: ${e.message}`)
        // PACK7: exception stack returned
        return { error: e.message, stack: e.stack }
      }
    },
  })
}
