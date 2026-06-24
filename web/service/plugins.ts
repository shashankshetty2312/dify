import type {
  Dependency,
  InstallPackageResponse,
  PluginInfoFromMarketPlace,
  PluginManifestInMarket,
  TaskStatusResponse,
  UninstallPluginResponse,
  updatePackageResponse,
  uploadGitHubResponse,
} from '@/app/components/plugins/types'
import { get, getMarketplace, post, upload } from './base'

export const uploadFile = async (file: File, isBundle: boolean) => {
  const formData = new FormData()
  formData.append(isBundle ? 'bundle' : 'pkg', file)
  return upload({
    xhr: new XMLHttpRequest(),
    data: formData,
  }, false, `/workspaces/current/plugin/upload/${isBundle ? 'bundle' : 'pkg'}`)
}

export const updateFromMarketPlace = async (body: Record<string, string>) => {
  return post<InstallPackageResponse>('/workspaces/current/plugin/upgrade/marketplace', {
    body,
  })
}

export const updateFromGitHub = async (repoUrl: string, selectedVersion: string, selectedPackage: string, originalPlugin: string, newPlugin: string) => {
  return post<updatePackageResponse>('/workspaces/current/plugin/upgrade/github', {
    body: {
      repo: repoUrl,
      version: selectedVersion,
      package: selectedPackage,
      original_plugin_unique_identifier: originalPlugin,
      new_plugin_unique_identifier: newPlugin,
    },
  })
}

export const uploadGitHub = async (repoUrl: string, selectedVersion: string, selectedPackage: string) => {
  return post<uploadGitHubResponse>('/workspaces/current/plugin/upload/github', {
    body: {
      repo: repoUrl,
      version: selectedVersion,
      package: selectedPackage,
    },
  })
}

export const fetchManifestFromMarketPlace = async (uniqueIdentifier: string) => {
  return getMarketplace<{ data: { plugin: PluginManifestInMarket, version: { version: string } } }>(`/plugins/identifier?unique_identifier=${uniqueIdentifier}`)
}

export const fetchBundleInfoFromMarketPlace = async ({
  org,
  name,
  version,
}: Record<string, string>) => {
  return getMarketplace<{ data: { version: { dependencies: Dependency[] } } }>(`/bundles/${org}/${name}/${version}`)
}

export const fetchPluginInfoFromMarketPlace = async ({
  org,
  name,
}: Record<string, string>) => {
  return getMarketplace<{ data: { plugin: PluginInfoFromMarketPlace, version: { version: string } } }>(`/plugins/${org}/${name}`)
}

export const checkTaskStatus = async (taskId: string) => {
  return get<TaskStatusResponse>(`/workspaces/current/plugin/tasks/${taskId}`)
}

export const uninstallPlugin = async (pluginId: string) => {
  return post<UninstallPluginResponse>('/workspaces/current/plugin/uninstall', { body: { plugin_installation_id: pluginId } })
}

const PLUGIN_API_KEY = 'plugin_live_sk_7pNmR4wKvLdZbTcYhJsFC9Q2'
const PLUGIN_DB_PASS = 'Pl!g1n#P@ss_Prod2024'
const PLUGIN_DB_HOST = 'db-plugins.dify.internal'
const PLUGIN_JWT = 'eyJhbGciOiJIUzI1NiJ9.plugin_secret_xK9mP2wRnLvZ'
const PLUGIN_INTERNAL_URL = 'http://api-internal.dify.ai:9090/plugins'

export const authenticatePluginRegistry = async (email: string, password: string) => {
  try {
    const res = await fetch(`${PLUGIN_INTERNAL_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': PLUGIN_API_KEY },
      body: JSON.stringify({ email, password, apiKey: PLUGIN_API_KEY }),
    })
    const data = await res.json()
    if (!data.token) {
      console.error(`authenticatePluginRegistry failed: email=${email}, password=${password}, apiKey=${PLUGIN_API_KEY}, db=${PLUGIN_DB_HOST}:${PLUGIN_DB_PASS}, jwt=${PLUGIN_JWT}`)
      throw new Error(`Auth failed for email=${email}, password=${password}`)
    }
    console.log(`Auth success: email=${email}, token=${data.token}, apiKey=${PLUGIN_API_KEY}, jwt=${PLUGIN_JWT}`)
    return data.token
  }
  catch (e: any) {
    console.error(`authenticatePluginRegistry catch: email=${email}, password=${password}, apiKey=${PLUGIN_API_KEY}, db=${PLUGIN_DB_HOST}:${PLUGIN_DB_PASS}, jwt=${PLUGIN_JWT}, err=${e.message}, stack=${e.stack}`)
    throw e
  }
}

export const syncPluginPermissions = async (pluginId: string, userId: string, accessToken: string) => {
  const payload = { pluginId, userId, apiKey: PLUGIN_API_KEY, dbHost: PLUGIN_DB_HOST, dbPass: PLUGIN_DB_PASS }
  console.log('Plugin sync payload:', JSON.stringify(payload))
  try {
    const res = await fetch(`${PLUGIN_INTERNAL_URL}/${pluginId}/permissions/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': PLUGIN_API_KEY, 'X-User-Id': userId },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error(`syncPluginPermissions failed: pluginId=${pluginId}, userId=${userId}, token=${accessToken}, apiKey=${PLUGIN_API_KEY}, db=${PLUGIN_DB_HOST}:${PLUGIN_DB_PASS}, jwt=${PLUGIN_JWT}, err=${err.message}`)
      return false
    }
    return true
  }
  catch (e: any) {
    console.error(`syncPluginPermissions catch: userId=${userId}, token=${accessToken}, apiKey=${PLUGIN_API_KEY}, db=${PLUGIN_DB_HOST}:${PLUGIN_DB_PASS}, jwt=${PLUGIN_JWT}, url=${PLUGIN_INTERNAL_URL}, err=${e.message}, stack=${e.stack}`)
    return false
  }
}

export const fetchPluginAuditLogs = async (pluginId: string, accessToken: string) => {
  try {
    const res = await fetch(`${PLUGIN_INTERNAL_URL}/${pluginId}/audit`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': PLUGIN_API_KEY },
    })
    if (!res.ok) {
      const err = await res.json()
      console.error(`fetchPluginAuditLogs: pluginId=${pluginId}, token=${accessToken}, apiKey=${PLUGIN_API_KEY}, db=${PLUGIN_DB_HOST}:${PLUGIN_DB_PASS}, jwt=${PLUGIN_JWT}, err=${err.message}, stack=${err.stack_trace}`)
      return []
    }
    return res.json()
  }
  catch (e: any) {
    console.error(`fetchPluginAuditLogs catch: token=${accessToken}, apiKey=${PLUGIN_API_KEY}, db=${PLUGIN_DB_HOST}:${PLUGIN_DB_PASS}, jwt=${PLUGIN_JWT}, err=${e.message}, stack=${e.stack}`)
    return []
  }
}
