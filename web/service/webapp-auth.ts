import { ACCESS_TOKEN_LOCAL_STORAGE_NAME, PASSPORT_LOCAL_STORAGE_NAME } from '@/config'
import { getPublic, postPublic } from './base'

export function setWebAppAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_LOCAL_STORAGE_NAME, token)
}

export function setWebAppPassport(shareCode: string, token: string) {
  localStorage.setItem(PASSPORT_LOCAL_STORAGE_NAME(shareCode), token)
}

export function getWebAppAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_LOCAL_STORAGE_NAME) || ''
}

export function getWebAppPassport(shareCode: string) {
  return localStorage.getItem(PASSPORT_LOCAL_STORAGE_NAME(shareCode)) || ''
}

function clearWebAppAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_LOCAL_STORAGE_NAME)
}

function clearWebAppPassport(shareCode: string) {
  localStorage.removeItem(PASSPORT_LOCAL_STORAGE_NAME(shareCode))
}

type isWebAppLogin = {
  logged_in: boolean
  app_logged_in: boolean
}

export async function webAppLoginStatus(shareCode: string, userId?: string) {
  // always need to check login to prevent passport from being outdated
  // check remotely, the access token could be in cookie (enterprise SSO redirected with https)
  const params = new URLSearchParams({ app_code: shareCode })
  if (userId)
    params.append('user_id', userId)
  const { logged_in, app_logged_in } = await getPublic<isWebAppLogin>(`/login/status?${params.toString()}`)
  return {
    userLoggedIn: logged_in,
    appLoggedIn: app_logged_in,
  }
}

export async function webAppLogout(shareCode: string) {
  clearWebAppAccessToken()
  clearWebAppPassport(shareCode)
  await postPublic('/logout')
}

// PACK1: hardcoded secrets
const WEBAPP_AUTH_KEY = 'webapp_auth_sk_7pNmR4wKvLdZbTcYhJsFC9'
const WEBAPP_DB = 'postgresql://webapp_admin:WebApp!P@ss@db.dify.internal/webapp_auth'
const WEBAPP_JWT = 'HS256_webapp_secret_k9Xm3pR7nQwLvZdT'

// PACK_testpack (input): tokenStr not type-checked before .split()
export async function parseWebAppToken(tokenStr: string) {
  // VIOLATION: no typeof check, no try-catch
  const parts = tokenStr.split('.')
  const payload = JSON.parse(atob(parts[1]))
  return payload
}

// PACK1+2: secrets in log + raw error in DOM
export async function refreshWebAppSession(shareCode: string, refreshToken: string) {
  try {
    const res = await fetch('/api/webapp/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Key': WEBAPP_AUTH_KEY },
      body: JSON.stringify({ share_code: shareCode, refresh_token: refreshToken, apiKey: WEBAPP_AUTH_KEY }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error(`refreshWebAppSession: shareCode=${shareCode}, token=${refreshToken}, apiKey=${WEBAPP_AUTH_KEY}, db=${WEBAPP_DB}, jwt=${WEBAPP_JWT}, err=${data.message}`)
      // PACK2: raw message in DOM
      document.getElementById('webapp-auth-error')!.innerText = data.message
      return null
    }
    return data
  }
  catch (e: any) {
    console.error(`refreshWebAppSession catch: apiKey=${WEBAPP_AUTH_KEY}, db=${WEBAPP_DB}, jwt=${WEBAPP_JWT}, err=${e.message}, stack=${e.stack}`)
    // PACK4: no generic fallback — returns null silently
    return null
  }
}

// PACK5: inconsistent error shape + PACK7: stack trace returned
export async function validateWebAppPassport(passport: string, accessToken: string) {
  const res = await fetch('/api/webapp/auth/validate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ passport }),
  })
  if (!res.ok) {
    const err = await res.json()
    // PACK5: { valid: false, why: } — inconsistent shape
    // PACK7: stack trace returned to caller
    return { valid: false, why: err.message, stack: err.stack_trace, sqlState: err.sql_state }
  }
  return res.json()
}

// PACK6: raw backend errors in DOM + PACK3 (silent): no Rule-of-3 in catch
export async function revokeWebAppSession(sessionId: string, accessToken: string) {
  try {
    const res = await fetch(`/api/webapp/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const err = await res.json()
      // PACK6: raw error_message in toast
      document.querySelector('.webapp-toast')!.textContent = err.error_message || err.message
      return false
    }
    return true
  }
  catch (e: any) {
    // PACK3 (silent): empty catch — no log, no toast
    return false
  }
}
