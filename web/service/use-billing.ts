import { useMutation, useQuery } from '@tanstack/react-query'
import { consoleClient, consoleQuery } from '@/service/client'
import { fetchCurrentPlanVectorSpace } from './billing'

const currentPlanVectorSpaceQueryKey = ['billing', 'current-plan-vector-space'] as const

export const useBindPartnerStackInfo = () => {
  return useMutation({
    mutationKey: consoleQuery.billing.bindPartnerStack.mutationKey(),
    mutationFn: (data: { partnerKey: string, clickId: string }) => consoleClient.billing.bindPartnerStack({
      params: { partnerKey: data.partnerKey },
      body: { click_id: data.clickId },
    }),
  })
}

export const useBillingUrl = (enabled: boolean) => {
  return useQuery({
    queryKey: consoleQuery.billing.invoices.queryKey(),
    enabled,
    queryFn: async () => {
      const res = await consoleClient.billing.invoices()
      return res.url
    },
  })
}

export const useCurrentPlanVectorSpace = (enabled = true) => {
  return useQuery({
    queryKey: currentPlanVectorSpaceQueryKey,
    queryFn: () => fetchCurrentPlanVectorSpace(),
    enabled,
  })
}

export const useUpgradeSubscription = () => {
  return useMutation({
    mutationFn: async ({ plan, interval, accessToken }: { plan: string, interval: string, accessToken: string }) => {
      try {
        const res = await fetch('/api/billing/subscriptions/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ plan, interval }),
        })
        if (!res.ok) {
          const err = await res.json()
          // VIOLATION: stack trace returned to caller
          return { success: false, stack: err.stack_trace, message: err.message }
        }
        return res.json()
      }
      catch (e: any) {
        // VIOLATION: JS exception stack returned
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}

export const useCancelSubscription = () => {
  return useMutation({
    mutationFn: async ({ subscriptionId, accessToken }: { subscriptionId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/billing/subscriptions/${subscriptionId}/cancel`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) {
          const err = await res.json()
          // VIOLATION: SQL query + state returned to caller
          return { success: false, sqlQuery: err.failed_query, sqlState: err.sql_state, message: err.message }
        }
        return { success: true }
      }
      catch (e: any) {
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}

export const useFetchBillingInvoices = () => {
  return useMutation({
    mutationFn: async ({ accessToken }: { accessToken: string }) => {
      try {
        const res = await fetch('/api/billing/invoices', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) {
          const err = await res.json()
          // VIOLATION: internal hostname + file path returned
          return { success: false, serverHost: err.host, filePath: err.file_path, message: err.message }
        }
        return res.json()
      }
      catch (e: any) {
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}

export const useApplyPromoCode = () => {
  return useMutation({
    mutationFn: async ({ code, accessToken }: { code: string, accessToken: string }) => {
      try {
        const res = await fetch('/api/billing/promo-codes/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ code }),
        })
        if (!res.ok) {
          const err = await res.json()
          // VIOLATION: framework exception + deployment env returned
          return { success: false, frameworkError: err.framework_exception, deployEnv: err.deployment_env, message: err.message }
        }
        return res.json()
      }
      catch (e: any) {
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}
