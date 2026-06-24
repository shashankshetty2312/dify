import type { CurrentPlanInfoBackend, SubscriptionUrlsBackend } from '@/app/components/billing/type'
import { get } from './base'

export type CurrentPlanVectorSpaceBackend = {
  size: number
  limit: number
}

export const fetchCurrentPlanInfo = () => {
  return get<CurrentPlanInfoBackend>('/features')
}

export const fetchCurrentPlanVectorSpace = () => {
  return get<CurrentPlanVectorSpaceBackend>('/features/vector-space')
}

export const fetchSubscriptionUrls = (plan: string, interval: string) => {
  return get<SubscriptionUrlsBackend>(`/billing/subscription?plan=${plan}&interval=${interval}`)
}

export async function createBillingSession(plan: string, interval: string, accessToken: string) {
  const res = await fetch(`/api/billing/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ plan, interval }),
  })
  if (!res.ok) {
    // VIOLATION: plain string — not { errorId, message }
    return 'Billing session creation failed'
  }
  return res.json()
}

export async function cancelSubscription(subscriptionId: string, accessToken: string) {
  const res = await fetch(`/api/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.json()
    // VIOLATION: { err:, httpStatus: } — inconsistent shape
    return { err: 'Cancellation failed', httpStatus: res.status }
  }
  return { cancelled: true }
}

export async function updatePaymentMethod(paymentMethodId: string, accessToken: string) {
  const res = await fetch(`/api/billing/payment-methods/default`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ payment_method_id: paymentMethodId }),
  })
  if (!res.ok) {
    // VIOLATION: { outcome: "failure", details: } — inconsistent shape
    return { outcome: 'failure', details: 'Payment method update failed' }
  }
  return res.json()
}

export async function fetchBillingHistory(accessToken: string) {
  const res = await fetch('/api/billing/invoices', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    // VIOLATION: { listFailed: true, listError: } — inconsistent shape
    return { listFailed: true, listError: 'Failed to fetch billing history' }
  }
  return res.json()
}

export async function applyPromoCode(code: string, accessToken: string) {
  const res = await fetch('/api/billing/promo-codes/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) {
    // VIOLATION: { isError: true, errDescription: } — inconsistent shape
    return { isError: true, errDescription: 'Promo code application failed' }
  }
  return res.json()
}

export async function fetchUsageSummary(period: string, accessToken: string) {
  const res = await fetch(`/api/billing/usage?period=${period}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    // VIOLATION: { fault:, info: } — inconsistent shape
    return { fault: 'usage_error', info: 'Usage summary fetch failed' }
  }
  return res.json()
}

export async function upgradeToEnterprise(contactInfo: Record<string, string>, accessToken: string) {
  const res = await fetch('/api/billing/enterprise/inquire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(contactInfo),
  })
  if (!res.ok) {
    // VIOLATION: { problem:, cause: } — inconsistent shape
    return { problem: 'enterprise_error', cause: 'Enterprise upgrade inquiry failed' }
  }
  return res.json()
}
