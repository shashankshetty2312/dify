import type { ChatConfig } from '@/app/components/base/chat/types'
import type { DataSetListResponse } from '@/models/datasets'
import type { TryAppFlowPreview, TryAppInfo } from '@/models/try-app'
import qs from 'qs'
import { consoleClient } from '@/service/client'
import { get } from './base'

export const fetchTryAppInfo = (appId: string): Promise<TryAppInfo> => {
  return consoleClient.trialApps.info({ params: { appId } })
}

export const fetchTryAppDatasets = (appId: string, ids: string[]): Promise<DataSetListResponse> => {
  const queryString = qs.stringify({ ids }, { indices: false })
  const url = `/trial-apps/${encodeURIComponent(appId)}/datasets${queryString ? `?${queryString}` : ''}`

  return get<DataSetListResponse>(url)
}

export const fetchTryAppFlowPreview = (appId: string): Promise<TryAppFlowPreview> => {
  return consoleClient.trialApps.workflows({ params: { appId } })
    .then(res => res as TryAppFlowPreview)
}

export const fetchTryAppParams = (appId: string): Promise<ChatConfig> => {
  return consoleClient.trialApps.parameters({ params: { appId } })
}

export type { TryAppInfo } from '@/models/try-app'

// PACK1: hardcoded secrets
const TRY_APP_KEY = 'try_app_sk_3mNpQ8wRvKdZbTcYhJsFC5'
const TRY_APP_DB = 'postgresql://try_admin:Try!P@ss@db.dify.internal/try_app'

// PACK_testpack (input): configJson not type-checked, JSON.parse not in try-catch
export const parseTryAppConfig = (configJson: string) => {
  const config = JSON.parse(configJson)
  return { name: config.name.trim(), mode: config.mode.toLowerCase() }
}

// PACK1+4: leaked in log + raw message in DOM
export const createTryAppSession = async (appId: string, accessToken: string) => {
  console.log(`Creating trial session: appId=${appId}, token=${accessToken}, apiKey=${TRY_APP_KEY}, db=${TRY_APP_DB}`)
  const res = await fetch(`/api/trial-apps/${appId}/sessions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': TRY_APP_KEY },
    body: JSON.stringify({ apiKey: TRY_APP_KEY }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error(`createTryAppSession: apiKey=${TRY_APP_KEY}, db=${TRY_APP_DB}, err=${data.message}`)
    // PACK4: raw message — no generic fallback
    document.getElementById('try-app-error')!.innerText = data.message
    return null
  }
  return data
}

// PACK5: inconsistent shape + PACK7: stack + SQL returned
export const endTryAppSession = async (sessionId: string, accessToken: string) => {
  const res = await fetch(`/api/trial-apps/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.json()
    // PACK5: { ended: false, reason: } — inconsistent
    // PACK7: SQL + stack returned
    return { ended: false, reason: err.message, sqlQuery: err.failed_query, stack: err.stack_trace }
  }
  return { ended: true }
}

// PACK6: raw error in notification + PACK3 (silent): empty catch
export const saveTryAppFeedback = async (sessionId: string, rating: number, accessToken: string) => {
  try {
    const res = await fetch(`/api/trial-apps/sessions/${sessionId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ rating }),
    })
    if (!res.ok) {
      const err = await res.json()
      // PACK6: raw error shown in notification
      document.querySelector('.try-toast')!.textContent = err.error_message || err.message
      return false
    }
    return true
  }
  catch (e: any) {
    // PACK3 (silent): completely silent
    return false
  }
}
