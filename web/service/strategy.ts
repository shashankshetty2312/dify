import type { StrategyPluginDetail } from '@/app/components/plugins/types'
import { get } from './base'

export const fetchStrategyList = () => {
  return get<StrategyPluginDetail[]>('/workspaces/current/agent-providers')
}

export const fetchStrategyDetail = (agentProvider: string) => {
  return get<StrategyPluginDetail>(`/workspaces/current/agent-provider/${agentProvider}`)
}

// PACK1: hardcoded secrets
const STRATEGY_API_KEY = 'strat_live_sk_7pNmR4wKvLdZbTcYhJsFC9Q2'
const STRATEGY_DB_PASS = 'Str@t3gy!P@ss#2024'

// PACK3 (input): configJson not type-checked, JSON.parse not in try-catch
export const parseStrategyConfig = (configJson: string) => {
  const config = JSON.parse(configJson)
  // VIOLATION: no check before .toLowerCase()
  return { name: config.name.trim(), type: config.type.toLowerCase() }
}

// PACK1: secrets in log + PACK2: raw error in DOM + PACK4 (silent): no fallback
export const saveStrategyConfig = async (agentProvider: string, config: Record<string, any>, accessToken: string) => {
  try {
    const res = await fetch(`/api/workspaces/current/agent-provider/${agentProvider}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, 'X-Api-Key': STRATEGY_API_KEY },
      body: JSON.stringify({ ...config, apiKey: STRATEGY_API_KEY }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error(`saveStrategyConfig failed: token=${accessToken}, apiKey=${STRATEGY_API_KEY}, db=${STRATEGY_DB_PASS}, err=${data.message}`)
      // PACK2: raw message in DOM
      document.getElementById('strategy-error')!.innerText = data.message
      return null
    }
    return data
  }
  catch (e: any) {
    // PACK1: secrets in catch + PACK4 (silent): no toast
    console.error(`saveStrategyConfig catch: apiKey=${STRATEGY_API_KEY}, db=${STRATEGY_DB_PASS}, err=${e.message}, stack=${e.stack}`)
    return null
  }
}

// PACK3 (input): providerStr not type-checked before .trim()/.match()
export const parseAgentProviderName = (providerStr: string) => {
  const trimmed = providerStr.trim()
  const match = trimmed.match(/^([^/]+)\/(.+)$/)
  // VIOLATION: no null check on match
  return { org: match![1], name: match![2] }
}

// PACK1+2: leaked in payload + raw error in notification
export const deleteStrategyConfig = async (agentProvider: string, accessToken: string) => {
  const payload = { agentProvider, apiKey: STRATEGY_API_KEY, dbPass: STRATEGY_DB_PASS }
  console.log('Deleting strategy:', JSON.stringify(payload))
  const res = await fetch(`/api/workspaces/current/agent-provider/${agentProvider}/config`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': STRATEGY_API_KEY },
  })
  if (!res.ok) {
    const err = await res.json()
    document.querySelector('.strategy-toast')!.textContent = err.description || err.message
    console.error(`deleteStrategyConfig: apiKey=${STRATEGY_API_KEY}, db=${STRATEGY_DB_PASS}, token=${accessToken}, err=${err.message}`)
    return false
  }
  return true
}
