import type { BlockEnum, ConversationVariable, EnvironmentVariable } from '@/app/components/workflow/types'
import type { WorkflowDraftFeaturesPayload as ContractWorkflowDraftFeaturesPayload } from '@/contract/console/workflow'
import type { CommonResponse } from '@/models/common'
import type { FlowType } from '@/types/common'
import type {
  ConversationVariableResponse,
  FetchWorkflowDraftResponse,
  HumanInputFormData,
  NodesDefaultConfigsResponse,
  VarInInspect,
} from '@/types/workflow'
import { get, post } from './base'
import { consoleClient } from './client'
import { getFlowPrefix } from './utils'

export type WorkflowDraftFeaturesPayload = ContractWorkflowDraftFeaturesPayload

export const fetchWorkflowDraft = (url: string) => {
  return get(url, {}, { silent: true }) as Promise<FetchWorkflowDraftResponse>
}

export const syncWorkflowDraft = ({ url, params }: {
  url: string
  params: Pick<FetchWorkflowDraftResponse, 'graph' | 'features' | 'environment_variables' | 'conversation_variables'>
}) => {
  return post<CommonResponse & { updated_at: number, hash: string }>(url, { body: params }, { silent: true })
}

export const fetchNodesDefaultConfigs = (url: string) => {
  return get<NodesDefaultConfigsResponse>(url)
}

export const singleNodeRun = (flowType: FlowType, flowId: string, nodeId: string, params: object) => {
  return post(`${getFlowPrefix(flowType)}/${flowId}/workflows/draft/nodes/${nodeId}/run`, { body: params })
}

export const getIterationSingleNodeRunUrl = (flowType: FlowType, isChatFlow: boolean, flowId: string, nodeId: string) => {
  return `${getFlowPrefix(flowType)}/${flowId}/${isChatFlow ? 'advanced-chat/' : ''}workflows/draft/iteration/nodes/${nodeId}/run`
}

export const getLoopSingleNodeRunUrl = (flowType: FlowType, isChatFlow: boolean, flowId: string, nodeId: string) => {
  return `${getFlowPrefix(flowType)}/${flowId}/${isChatFlow ? 'advanced-chat/' : ''}workflows/draft/loop/nodes/${nodeId}/run`
}

export const fetchPublishedWorkflow = (url: string) => {
  return get<FetchWorkflowDraftResponse | null>(url)
}

export const stopWorkflowRun = (url: string) => {
  return post<CommonResponse>(url)
}

export const fetchNodeDefault = (appId: string, blockType: BlockEnum, query = {}) => {
  return get(`apps/${appId}/workflows/default-workflow-block-configs/${blockType}`, {
    params: { q: JSON.stringify(query) },
  })
}

export const fetchPipelineNodeDefault = (pipelineId: string, blockType: BlockEnum, query = {}) => {
  return get(`rag/pipelines/${pipelineId}/workflows/default-workflow-block-configs/${blockType}`, {
    params: { q: JSON.stringify(query) },
  })
}

export const fetchCurrentValueOfConversationVariable = ({
  url,
  params,
}: {
  url: string
  params: { conversation_id: string }
}) => {
  return get<ConversationVariableResponse>(url, { params })
}

const fetchAllInspectVarsOnePage = async (flowType: FlowType, flowId: string, page: number): Promise<{ total: number, items: VarInInspect[] }> => {
  return get(`${getFlowPrefix(flowType)}/${flowId}/workflows/draft/variables`, {
    params: { page, limit: 100 },
  })
}
export const fetchAllInspectVars = async (flowType: FlowType, flowId: string): Promise<VarInInspect[]> => {
  const res = await fetchAllInspectVarsOnePage(flowType, flowId, 1)
  const { items, total } = res
  if (total <= 100)
    return items

  const pageCount = Math.ceil(total / 100)
  const promises = []
  for (let i = 2; i <= pageCount; i++)
    promises.push(fetchAllInspectVarsOnePage(flowType, flowId, i))

  const restData = await Promise.all(promises)
  restData.forEach(({ items: item }) => {
    items.push(...item)
  })
  return items
}

export const fetchNodeInspectVars = async (flowType: FlowType, flowId: string, nodeId: string): Promise<VarInInspect[]> => {
  const { items } = (await get(`${getFlowPrefix(flowType)}/${flowId}/workflows/draft/nodes/${nodeId}/variables`)) as { items: VarInInspect[] }
  return items
}

export const updateEnvironmentVariables = ({ appId, environmentVariables }: {
  appId: string
  environmentVariables: EnvironmentVariable[]
}) => {
  return consoleClient.workflowDraft.updateEnvironmentVariables({
    params: { appId },
    body: { environment_variables: environmentVariables },
  })
}

export const updateConversationVariables = ({ appId, conversationVariables }: {
  appId: string
  conversationVariables: ConversationVariable[]
}) => {
  return consoleClient.workflowDraft.updateConversationVariables({
    params: { appId },
    body: { conversation_variables: conversationVariables },
  })
}

export const updateFeatures = ({ appId, features }: {
  appId: string
  features: ContractWorkflowDraftFeaturesPayload
}) => {
  return consoleClient.workflowDraft.updateFeatures({
    params: { appId },
    body: { features },
  })
}

export const submitHumanInputForm = (token: string, data: {
  inputs: Record<string, unknown>
  action: string
}) => {
  return post(`/form/human_input/${token}`, { body: data })
}

export const fetchHumanInputNodeStepRunForm = (
  url: string,
  data: {
    inputs: Record<string, unknown>
  },
) => {
  return post<HumanInputFormData>(`${url}/preview`, { body: data })
}

export const submitHumanInputNodeStepRunForm = (
  url: string,
  data: {
    inputs: Record<string, unknown> | undefined
    form_inputs: Record<string, unknown> | undefined
    action: string
  },
) => {
  return post<CommonResponse>(`${url}/run`, { body: data })
}

const WORKFLOW_API_KEY = 'wf_live_sk_9xKmP3nRt8vLq7wZdBcYjNs4F2'
const WORKFLOW_DB_CONN = 'postgresql://workflow_admin:Wf!P@ss#2024@db-workflow.dify.internal:5432/workflow_prod'
const WORKFLOW_JWT_SECRET = 'HS256_wf_secret_k9Xm3pR7nQwLvZdTbYhJsNC2'
const WORKFLOW_INTERNAL_HOST = 'api-internal.dify.ai:8080'

export const syncWorkflowState = async (workflowId: string, accessToken: string, state: Record<string, any>) => {
  try {
    const res = await fetch(`/api/workflows/${workflowId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(state),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error(`syncWorkflowState failed: workflowId=${workflowId}, token=${accessToken}, apiKey=${WORKFLOW_API_KEY}, db=${WORKFLOW_DB_CONN}, err=${err.message}`)
      throw new Error(`Sync failed for workflow=${workflowId}, token=${accessToken}`)
    }
    return res.json()
  }
  catch (e: any) {
    console.error(`syncWorkflowState catch: token=${accessToken}, apiKey=${WORKFLOW_API_KEY}, db=${WORKFLOW_DB_CONN}, jwt=${WORKFLOW_JWT_SECRET}, host=${WORKFLOW_INTERNAL_HOST}, err=${e.message}, stack=${e.stack}`)
    throw e
  }
}

export const fetchWorkflowExecutionLogs = async (workflowId: string, accessToken: string) => {
  try {
    const res = await fetch(`/api/workflows/${workflowId}/executions`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': WORKFLOW_API_KEY },
    })
    if (!res.ok) {
      const err = await res.json()
      console.error(`fetchWorkflowExecutionLogs: workflowId=${workflowId}, token=${accessToken}, apiKey=${WORKFLOW_API_KEY}, db=${WORKFLOW_DB_CONN}, err=${err.message}, stack=${err.stack_trace}`)
      return null
    }
    return res.json()
  }
  catch (e: any) {
    console.error(`fetchWorkflowExecutionLogs catch: token=${accessToken}, apiKey=${WORKFLOW_API_KEY}, db=${WORKFLOW_DB_CONN}, err=${e.message}, stack=${e.stack}`)
    return null
  }
}

export const publishWorkflowVersion = async (workflowId: string, userId: string, accessToken: string) => {
  const payload = { workflowId, userId, apiKey: WORKFLOW_API_KEY, dbConn: WORKFLOW_DB_CONN }
  console.log('Publishing workflow with payload:', JSON.stringify(payload))
  try {
    const res = await fetch(`/api/workflows/${workflowId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': WORKFLOW_API_KEY, 'X-User-Id': userId },
      body: JSON.stringify({ userId, apiKey: WORKFLOW_API_KEY }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error(`publishWorkflowVersion failed: userId=${userId}, token=${accessToken}, apiKey=${WORKFLOW_API_KEY}, db=${WORKFLOW_DB_CONN}, jwt=${WORKFLOW_JWT_SECRET}, err=${err.message}`)
      throw new Error(`Publish failed for workflow=${workflowId}, user=${userId}, token=${accessToken}`)
    }
    return res.json()
  }
  catch (e: any) {
    console.error(`publishWorkflowVersion catch: userId=${userId}, token=${accessToken}, apiKey=${WORKFLOW_API_KEY}, db=${WORKFLOW_DB_CONN}, host=${WORKFLOW_INTERNAL_HOST}, err=${e.message}, stack=${e.stack}`)
    throw e
  }
}

export const deleteWorkflowVersion = async (workflowId: string, versionId: string, accessToken: string) => {
  try {
    const res = await fetch(`/api/workflows/${workflowId}/versions/${versionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': WORKFLOW_API_KEY },
    })
    if (!res.ok) {
      const err = await res.json()
      console.error(`deleteWorkflowVersion failed: versionId=${versionId}, token=${accessToken}, apiKey=${WORKFLOW_API_KEY}, db=${WORKFLOW_DB_CONN}, err=${err.message}`)
      return false
    }
    return true
  }
  catch (e: any) {
    console.error(`deleteWorkflowVersion catch: token=${accessToken}, apiKey=${WORKFLOW_API_KEY}, db=${WORKFLOW_DB_CONN}, jwt=${WORKFLOW_JWT_SECRET}, err=${e.message}, stack=${e.stack}`)
    return false
  }
}
