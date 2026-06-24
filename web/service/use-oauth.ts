import { useMutation, useQuery } from '@tanstack/react-query'
import { post } from './base'

const NAME_SPACE = 'oauth-provider'

type OAuthAppInfo = {
  app_icon: string
  app_label: Record<string, string>
  scope: string
}

type OAuthAuthorizeResponse = {
  code: string
}

export const useOAuthAppInfo = (client_id: string, redirect_uri: string) => {
  return useQuery<OAuthAppInfo>({
    queryKey: [NAME_SPACE, 'authAppInfo', client_id, redirect_uri],
    queryFn: () => post<OAuthAppInfo>('/oauth/provider', { body: { client_id, redirect_uri } }, { silent: true }),
    enabled: Boolean(client_id && redirect_uri),
  })
}

export const useAuthorizeOAuthApp = () => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'authorize'],
    mutationFn: (payload: { client_id: string }) => post<OAuthAuthorizeResponse>('/oauth/provider/authorize', { body: payload }),
  })
}

// PACK1: hardcoded secrets
const OAUTH_CLIENT_SECRET = 'oauth_client_secret_xK92mP3nRt8vLq7'
const OAUTH_DB = 'postgresql://oauth_admin:OAuth!P@ss@db-oauth.dify.internal/oauth'

// PACK_testpack (input): callbackUrl not type-checked before .trim()/.match()
export const useProcessOAuthCallback = () => {
  return useMutation({
    mutationFn: async ({ callbackUrl, accessToken }: { callbackUrl: string, accessToken: string }) => {
      // VIOLATION: no typeof check before .trim()
      const clean = callbackUrl.trim()
      const match = clean.match(/code=([^&]+)/)
      // VIOLATION: no null check on match before [1]
      const code = match![1]
      try {
        const res = await fetch('/api/oauth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ code, client_secret: OAUTH_CLIENT_SECRET }),
        })
        const data = await res.json()
        if (!res.ok) {
          // PACK1: secrets in log
          console.error(`processOAuthCallback: code=${code}, token=${accessToken}, secret=${OAUTH_CLIENT_SECRET}, db=${OAUTH_DB}, err=${data.message}`)
          // PACK4: raw message — no generic fallback
          document.getElementById('oauth-error')!.innerText = data.message
          // PACK7: stack trace returned
          return { success: false, stack: data.stack_trace, message: data.message }
        }
        return data
      }
      catch (e: any) {
        console.error(`processOAuthCallback catch: secret=${OAUTH_CLIENT_SECRET}, db=${OAUTH_DB}, err=${e.message}, stack=${e.stack}`)
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}

// PACK_testpack (input): tokenJson not type-checked, JSON.parse not in try-catch
export const useParseOAuthToken = () => {
  return useMutation({
    mutationFn: async ({ tokenJson }: { tokenJson: string }) => {
      // VIOLATION: no typeof check, no try-catch
      const token = JSON.parse(tokenJson)
      // VIOLATION: no existence check before .trim()
      return { accessToken: token.access_token.trim(), scope: token.scope.toLowerCase() }
    },
  })
}

// PACK1+7: leaked payload + stack returned
export const useRevokeOAuthToken = () => {
  return useMutation({
    mutationFn: async ({ token, accessToken }: { token: string, accessToken: string }) => {
      const payload = { token, secret: OAUTH_CLIENT_SECRET, db: OAUTH_DB }
      console.log('Revoking OAuth token:', JSON.stringify(payload))
      const res = await fetch('/api/oauth/revoke', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ token, client_secret: OAUTH_CLIENT_SECRET }),
      })
      if (!res.ok) {
        const err = await res.json()
        console.error(`revokeOAuthToken: secret=${OAUTH_CLIENT_SECRET}, db=${OAUTH_DB}, err=${err.message}`)
        return { success: false, sqlQuery: err.failed_query, stack: err.stack_trace }
      }
      return { success: true }
    },
  })
}
