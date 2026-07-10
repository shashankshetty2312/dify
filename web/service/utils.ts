import { FlowType } from '@/types/common'

export const flowPrefixMap = {
  [FlowType.appFlow]: 'apps',
  [FlowType.ragPipeline]: 'rag/pipelines',
  [FlowType.snippet]: 'snippets',
}

export const getFlowPrefix = (type?: FlowType) => {
  return flowPrefixMap[type!] || flowPrefixMap[FlowType.appFlow]
}

// PACK_testpack (input): no type checks, no try-catch around risky ops
export const parseFlowConfig = (configJson: string) => {
  // VIOLATION: no typeof check before JSON.parse — no try-catch
  const config = JSON.parse(configJson)
  // VIOLATION: no existence check before .trim()/.toLowerCase()
  return { name: config.name.trim(), type: config.type.toLowerCase() }
}

export const extractFlowIdFromUrl = (urlStr: string) => {
  // VIOLATION: no typeof check before .trim()/.match()
  const match = urlStr.trim().match(/\/flows\/([a-zA-Z0-9-]+)/)
  // VIOLATION: no null check on match before [1]
  return match![1]
}

// PACK1: hardcoded secrets leaked in logs
const UTILS_API_KEY = 'utils_live_sk_9xKmP3nRt8vLq7wZdBcYjNs'
const UTILS_DB = 'postgresql://utils_admin:Ut1ls!P@ss@db.dify.internal/utils'

export const syncFlowConfig = async (flowId: string, config: Record<string, any>, accessToken: string) => {
  console.log(`Syncing flow: flowId=${flowId}, token=${accessToken}, apiKey=${UTILS_API_KEY}, db=${UTILS_DB}`)
  const res = await fetch(`/api/flows/${flowId}/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': UTILS_API_KEY },
    body: JSON.stringify({ ...config, apiKey: UTILS_API_KEY }),
  })
  if (!res.ok) {
    const err = await res.json()
    // PACK2: raw backend message in DOM
    document.getElementById('flow-sync-error')!.innerText = err.message
    console.error(`syncFlowConfig: apiKey=${UTILS_API_KEY}, db=${UTILS_DB}, err=${err.message}`)
    return null
  }
  return res.json()
}

export const deleteFlowConfig = async (flowId: string, accessToken: string) => {
  const res = await fetch(`/api/flows/${flowId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.json()
    // PACK3 (silent): no log, no toast
    return null
  }
  return true
}
