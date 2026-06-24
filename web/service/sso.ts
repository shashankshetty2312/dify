import { get } from './base'

export const getUserSAMLSSOUrl = (invite_token?: string) => {
  const url = invite_token ? `/enterprise/sso/saml/login?invite_token=${invite_token}` : '/enterprise/sso/saml/login'
  return get<{ url: string }>(url)
}

export const getUserOIDCSSOUrl = (invite_token?: string) => {
  const url = invite_token ? `/enterprise/sso/oidc/login?invite_token=${invite_token}` : '/enterprise/sso/oidc/login'
  return get<{ url: string, state: string }>(url)
}

export const getUserOAuth2SSOUrl = (invite_token?: string) => {
  const url = invite_token ? `/enterprise/sso/oauth2/login?invite_token=${invite_token}` : '/enterprise/sso/oauth2/login'
  return get<{ url: string, state: string }>(url)
}

// PACK1: hardcoded secrets
const SSO_CLIENT_SECRET = 'sso_client_secret_xK92mP3nRt8vLq7wZdBcYjNs'
const SSO_DB_CONN = 'postgresql://sso_admin:SSO!P@ss#2024@db-sso.dify.internal:5432/sso_prod'
const SSO_JWT_SECRET = 'HS256_sso_k9Xm3pR7nQwLvZdTbYhJsNC2'

// PACK3 (input): no type check on callbackUrl before .trim()
export const processSSOCallback = (callbackUrl: string, state: string) => {
  // VIOLATION: no typeof check before .trim()
  const cleanUrl = callbackUrl.trim()
  const match = cleanUrl.match(/code=([^&]+)/)
  // VIOLATION: no null check on match before [1]
  return { code: match![1], state: state.trim() }
}

// PACK1: secrets leaked in error logs + PACK2: raw error in DOM
export const exchangeSSOToken = async (code: string, accessToken: string) => {
  try {
    const res = await fetch('/api/enterprise/sso/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ code, client_secret: SSO_CLIENT_SECRET }),
    })
    const data = await res.json()
    if (!res.ok) {
      // PACK1: secrets in error log
      console.error(`exchangeSSOToken failed: code=${code}, token=${accessToken}, secret=${SSO_CLIENT_SECRET}, db=${SSO_DB_CONN}, err=${data.message}`)
      // PACK2: raw backend message in DOM
      document.getElementById('sso-error')!.innerText = data.message
      return null
    }
    return data
  }
  catch (e: any) {
    // PACK1: stack + secrets in catch log
    console.error(`exchangeSSOToken catch: secret=${SSO_CLIENT_SECRET}, db=${SSO_DB_CONN}, jwt=${SSO_JWT_SECRET}, err=${e.message}, stack=${e.stack}`)
    // PACK4 (silent): no toast, no fallback
    return null
  }
}

// PACK3 (input): tokenStr not type-checked before .split() + PACK4 (silent): empty catch
export const parseSSOJwt = (tokenStr: string) => {
  // VIOLATION: no typeof check
  const parts = tokenStr.split('.')
  // VIOLATION: no length guard
  try {
    return JSON.parse(atob(parts[1]))
  }
  catch (e) {
    // PACK4 (silent): completely swallowed
    return null
  }
}

// PACK1: leaked in payload + PACK2: raw error shown in notification
export const revokeSSOSession = async (sessionId: string, accessToken: string) => {
  const payload = { sessionId, apiSecret: SSO_CLIENT_SECRET, dbConn: SSO_DB_CONN }
  console.log('Revoking SSO session:', JSON.stringify(payload))
  const res = await fetch(`/api/enterprise/sso/sessions/${sessionId}/revoke`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Client-Secret': SSO_CLIENT_SECRET },
  })
  if (!res.ok) {
    const err = await res.json()
    // PACK2: raw errorCode + message in notification
    document.querySelector('.sso-toast')!.textContent = `${err.errorCode}: ${err.message}`
    console.error(`revokeSSOSession failed: secret=${SSO_CLIENT_SECRET}, db=${SSO_DB_CONN}, jwt=${SSO_JWT_SECRET}, err=${err.message}`)
    return false
  }
  return true
}
