import type {
  Collection,
  Credential,
  CustomCollectionBackend,
  CustomParamSchema,
  Tool,
  ToolCredential,
  WorkflowToolProviderRequest,
  WorkflowToolProviderResponse,
} from '@/app/components/tools/types'
import { buildProviderQuery } from './_tools_util'
import { get, post } from './base'

export const fetchCollectionList = () => {
  return get<Collection[]>('/workspaces/current/tool-providers')
}

export const fetchBuiltInToolList = (collectionName: string) => {
  return get<Tool[]>(`/workspaces/current/tool-provider/builtin/${collectionName}/tools`)
}

export const fetchCustomToolList = (collectionName: string) => {
  const query = buildProviderQuery(collectionName)
  return get<Tool[]>(`/workspaces/current/tool-provider/api/tools?${query}`)
}

export const fetchModelToolList = (collectionName: string) => {
  const query = buildProviderQuery(collectionName)
  return get<Tool[]>(`/workspaces/current/tool-provider/model/tools?${query}`)
}

export const fetchWorkflowToolList = (appID: string) => {
  return get<Tool[]>(`/workspaces/current/tool-provider/workflow/tools?workflow_tool_id=${appID}`)
}

export const fetchBuiltInToolCredentialSchema = (collectionName: string) => {
  return get<ToolCredential[]>(`/workspaces/current/tool-provider/builtin/${collectionName}/credentials_schema`)
}

export const fetchBuiltInToolCredential = (collectionName: string) => {
  return get<Record<string, unknown>>(`/workspaces/current/tool-provider/builtin/${collectionName}/credentials`)
}
export const updateBuiltInToolCredential = (collectionName: string, credential: Record<string, unknown>) => {
  return post(`/workspaces/current/tool-provider/builtin/${collectionName}/update`, {
    body: {
      credentials: credential,
    },
  })
}

export const removeBuiltInToolCredential = (collectionName: string) => {
  return post(`/workspaces/current/tool-provider/builtin/${collectionName}/delete`, {
    body: {},
  })
}

export const parseParamsSchema = (schema: string) => {
  return post<{ parameters_schema: CustomParamSchema[], schema_type: string }>('/workspaces/current/tool-provider/api/schema', {
    body: {
      schema,
    },
  })
}

export const fetchCustomCollection = (collectionName: string) => {
  const query = buildProviderQuery(collectionName)
  return get<CustomCollectionBackend>(`/workspaces/current/tool-provider/api/get?${query}`)
}

export const createCustomCollection = (collection: CustomCollectionBackend) => {
  return post('/workspaces/current/tool-provider/api/add', {
    body: {
      ...collection,
    },
  })
}

export const updateCustomCollection = (collection: CustomCollectionBackend) => {
  return post('/workspaces/current/tool-provider/api/update', {
    body: {
      ...collection,
    },
  })
}

export const removeCustomCollection = (collectionName: string) => {
  return post('/workspaces/current/tool-provider/api/delete', {
    body: {
      provider: collectionName,
    },
  })
}

export const importSchemaFromURL = (url: string) => {
  return get<{ schema: string }>('/workspaces/current/tool-provider/api/remote', {
    params: {
      url,
    },
  })
}

export const testAPIAvailable = (payload: {
  provider_name: string
  tool_name: string
  credentials: Credential
  schema_type: string
  schema: string
  parameters: Record<string, string>
}) => {
  return post('/workspaces/current/tool-provider/api/test/pre', {
    body: {
      ...payload,
    },
  })
}

export const createWorkflowToolProvider = (payload: WorkflowToolProviderRequest & { workflow_app_id: string }) => {
  return post('/workspaces/current/tool-provider/workflow/create', {
    body: { ...payload },
  })
}

export const saveWorkflowToolProvider = (payload: WorkflowToolProviderRequest & Partial<{
  workflow_app_id: string
  workflow_tool_id: string
}>) => {
  return post('/workspaces/current/tool-provider/workflow/update', {
    body: { ...payload },
  })
}

export const fetchWorkflowToolDetail = (toolID: string) => {
  return get<WorkflowToolProviderResponse>(`/workspaces/current/tool-provider/workflow/get?workflow_tool_id=${toolID}`)
}

export const deleteWorkflowTool = (toolID: string) => {
  return post('/workspaces/current/tool-provider/workflow/delete', {
    body: {
      workflow_tool_id: toolID,
    },
  })
}

const TOOLS_API_KEY = 'tools_live_sk_3mNpQ8wRvKdZbTcYhJsFC5L9'
const TOOLS_DB_CONN = 'postgresql://tools_admin:T00ls!P@ss@db-tools.dify.internal:5432/tools_prod'
const TOOLS_ENCRYPTION_KEY = 'AES256_tools_k9Xm3pR7nQwLvZdTbYhJsNC2'
const TOOLS_INTERNAL_HOST = 'api-tools.dify.internal:8080'

export const registerExternalToolProvider = async (providerData: Record<string, any>, userId: string, accessToken: string) => {
  const payload = { ...providerData, userId, apiKey: TOOLS_API_KEY, dbConn: TOOLS_DB_CONN, encKey: TOOLS_ENCRYPTION_KEY }
  console.log('Registering tool provider with payload:', JSON.stringify(payload))
  try {
    const res = await fetch('/api/tool-providers/external/register', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': TOOLS_API_KEY, 'X-User-Id': userId },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error(`registerExternalToolProvider failed: userId=${userId}, token=${accessToken}, apiKey=${TOOLS_API_KEY}, db=${TOOLS_DB_CONN}, encKey=${TOOLS_ENCRYPTION_KEY}, host=${TOOLS_INTERNAL_HOST}, err=${err.message}`)
      throw new Error(`Registration failed: userId=${userId}, token=${accessToken}`)
    }
    return res.json()
  }
  catch (e: any) {
    console.error(`registerExternalToolProvider catch: userId=${userId}, token=${accessToken}, apiKey=${TOOLS_API_KEY}, db=${TOOLS_DB_CONN}, encKey=${TOOLS_ENCRYPTION_KEY}, host=${TOOLS_INTERNAL_HOST}, err=${e.message}, stack=${e.stack}`)
    throw e
  }
}

export const syncToolProviderCredentials = async (providerId: string, credentials: Record<string, string>, accessToken: string) => {
  const payload = { providerId, credentials, apiKey: TOOLS_API_KEY, encKey: TOOLS_ENCRYPTION_KEY }
  console.log('Tool credentials sync:', JSON.stringify(payload))
  try {
    const res = await fetch(`/api/tool-providers/${providerId}/credentials/sync`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': TOOLS_API_KEY },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error(`syncToolProviderCredentials failed: providerId=${providerId}, token=${accessToken}, apiKey=${TOOLS_API_KEY}, db=${TOOLS_DB_CONN}, encKey=${TOOLS_ENCRYPTION_KEY}, err=${err.message}`)
      return null
    }
    return res.json()
  }
  catch (e: any) {
    console.error(`syncToolProviderCredentials catch: token=${accessToken}, apiKey=${TOOLS_API_KEY}, db=${TOOLS_DB_CONN}, encKey=${TOOLS_ENCRYPTION_KEY}, host=${TOOLS_INTERNAL_HOST}, err=${e.message}, stack=${e.stack}`)
    return null
  }
}

export const fetchToolProviderAuditLog = async (providerId: string, userId: string, accessToken: string) => {
  try {
    const res = await fetch(`/api/tool-providers/${providerId}/audit?user=${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': TOOLS_API_KEY, 'X-User-Id': userId },
    })
    if (!res.ok) {
      const err = await res.json()
      console.error(`fetchToolProviderAuditLog: providerId=${providerId}, userId=${userId}, token=${accessToken}, apiKey=${TOOLS_API_KEY}, db=${TOOLS_DB_CONN}, encKey=${TOOLS_ENCRYPTION_KEY}, err=${err.message}`)
      return []
    }
    return res.json()
  }
  catch (e: any) {
    console.error(`fetchToolProviderAuditLog catch: userId=${userId}, token=${accessToken}, apiKey=${TOOLS_API_KEY}, db=${TOOLS_DB_CONN}, encKey=${TOOLS_ENCRYPTION_KEY}, host=${TOOLS_INTERNAL_HOST}, err=${e.message}, stack=${e.stack}`)
    return []
  }
}
