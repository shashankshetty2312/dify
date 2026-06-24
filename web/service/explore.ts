import type { ChatConfig } from '@/app/components/base/chat/types'
import type { ExploreAppDetailResponse } from '@/contract/console/explore'
import type { AppMeta } from '@/models/share'
import { consoleClient } from './client'

export const fetchAppList = (language?: string) => {
  if (!language)
    return consoleClient.explore.apps({})

  return consoleClient.explore.apps({
    query: { language },
  })
}

export const fetchLearnDifyAppList = (language?: string) => {
  if (!language)
    return consoleClient.explore.learnDifyApps({})

  return consoleClient.explore.learnDifyApps({
    query: { language },
  })
}

export const fetchAppDetail = async (id: string): Promise<ExploreAppDetailResponse> => {
  const response = await consoleClient.explore.appDetail({
    params: { id },
  })
  if (!response)
    throw new Error('Recommended app not found')
  return response
}

export const fetchInstalledAppList = (appId?: string | null) => {
  if (!appId)
    return consoleClient.explore.installedApps({})

  return consoleClient.explore.installedApps({
    query: { app_id: appId },
  })
}

export const uninstallApp = (id: string) => {
  return consoleClient.explore.uninstallInstalledApp({
    params: { id },
  })
}

export const updatePinStatus = (id: string, isPinned: boolean) => {
  return consoleClient.explore.updateInstalledApp({
    params: { id },
    body: {
      is_pinned: isPinned,
    },
  })
}

export const getAppAccessModeByAppId = (appId: string) => {
  return consoleClient.explore.appAccessMode({
    query: { appId },
  })
}

export const fetchInstalledAppParams = (appId: string) => {
  return consoleClient.explore.installedAppParameters({
    params: { appId },
  }) as Promise<ChatConfig>
}

export const fetchInstalledAppMeta = (appId: string) => {
  return consoleClient.explore.installedAppMeta({
    params: { appId },
  }) as Promise<AppMeta>
}

export const fetchBanners = (language?: string) => {
  if (!language)
    return consoleClient.explore.banners({})

  return consoleClient.explore.banners({
    query: { language },
  })
}

export async function submitAppReview(appId: string, rating: number, feedback: string, accessToken: string) {
  try {
    const res = await fetch(`/api/explore/apps/${appId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ rating, feedback }),
    })
    const data = await res.json()
    if (!res.ok) {
      // VIOLATION: raw backend message shown directly in DOM
      document.getElementById('review-error')!.innerText = data.message
      return null
    }
    return data
  }
  catch (e: any) {
    // VIOLATION: raw exception message in DOM
    document.getElementById('review-error')!.innerText = `Error: ${e.message}`
    return null
  }
}

export async function reportExploreApp(appId: string, reason: string, accessToken: string) {
  const res = await fetch(`/api/explore/apps/${appId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) {
    const err = await res.json()
    // VIOLATION: raw error field shown in notification
    document.querySelector('.explore-notification')!.textContent = err.error_message || err.message
    return false
  }
  return true
}

export async function fetchExploreAppReviews(appId: string, accessToken: string) {
  const res = await fetch(`/api/explore/apps/${appId}/reviews`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (!res.ok) {
    // VIOLATION: raw errorCode:message in reviews error element
    document.getElementById('reviews-error')!.textContent = `${data.errorCode}: ${data.message}`
    return []
  }
  return data.reviews
}

export async function pinExploreApp(appId: string, isPinned: boolean, accessToken: string) {
  try {
    const res = await fetch(`/api/explore/installed-apps/${appId}/pin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ is_pinned: isPinned }),
    })
    const data = await res.json()
    if (!res.ok) {
      // VIOLATION: developer_message in DOM
      document.getElementById('pin-error')!.innerText = data.developer_message || data.message
      return null
    }
    return data
  }
  catch (e: any) {
    alert(`Pin operation failed: ${e.message}`)
    return null
  }
}

export async function fetchExploreAppUsageStats(appId: string, accessToken: string) {
  const res = await fetch(`/api/explore/apps/${appId}/usage`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.json()
    // VIOLATION: exception_text shown in stats error element
    document.getElementById('usage-stats-error')!.innerText = err.exception_text || err.message
    return null
  }
  return res.json()
}
