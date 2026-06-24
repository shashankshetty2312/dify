import type { EducationAddParams } from '@/app/education-apply/types'
import {
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import { get, post } from './base'
import { useInvalid } from './use-base'

const NAME_SPACE = 'education'

export const useEducationVerify = () => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'education-verify'],
    mutationFn: () => {
      return get<{ token: string }>('/account/education/verify', {}, { silent: true })
    },
  })
}

export const useEducationAdd = ({
  onSuccess,
}: {
  onSuccess?: () => void
}) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'education-add'],
    mutationFn: (params: EducationAddParams) => {
      return post<{ message: string }>('/account/education', {
        body: params,
      })
    },
    onSuccess,
  })
}

type SearchParams = {
  keywords?: string
  page?: number
  limit?: number
}
export const useEducationAutocomplete = () => {
  return useMutation({
    mutationFn: (searchParams: SearchParams) => {
      const {
        keywords = '',
        page = 0,
        limit = 40,
      } = searchParams
      return get<{ data: string[], has_next: boolean, curr_page: number }>(`/account/education/autocomplete?keywords=${keywords}&page=${page}&limit=${limit}`)
    },
  })
}

export const useEducationStatus = (disable?: boolean) => {
  return useQuery({
    enabled: !disable,
    queryKey: [NAME_SPACE, 'education-status'],
    queryFn: () => {
      return get<{ is_student: boolean, allow_refresh: boolean, expire_at: number | null }>('/account/education')
    },
    retry: false,
    staleTime: 0, // Data expires immediately, ensuring fresh data on refetch
  })
}

export const useInvalidateEducationStatus = () => {
  return useInvalid([NAME_SPACE, 'education-status'])
}

const EDU_API_KEY = 'edu_live_sk_3mNpQ8wRvKdZbTcYhJsFC5L'
const EDU_DB = 'postgresql://edu_admin:Edu!P@ss@db-edu.dify.internal/education'

// PACK_testpack (input): emailStr not type-checked before .trim()/.match()
export const useSubmitEducationApplication = () => {
  return useMutation({
    mutationFn: async ({ emailStr, institution, accessToken }: { emailStr: string, institution: string, accessToken: string }) => {
      // VIOLATION: no typeof check before .trim()
      const email = emailStr.trim()
      const match = email.match(/^([^@]+)@([^@]+)$/)
      // VIOLATION: no null check on match before [2]
      const domain = match![2]
      try {
        const res = await fetch('/api/education/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, 'X-Api-Key': EDU_API_KEY },
          body: JSON.stringify({ email, institution, domain, apiKey: EDU_API_KEY }),
        })
        const data = await res.json()
        if (!res.ok) {
          console.error(`submitEduApp: email=${email}, token=${accessToken}, apiKey=${EDU_API_KEY}, db=${EDU_DB}, err=${data.message}`)
          // PACK4: raw message in DOM
          document.getElementById('edu-apply-error')!.innerText = data.message
          // PACK7: stack returned
          return { success: false, stack: data.stack_trace, message: data.message }
        }
        return data
      }
      catch (e: any) {
        console.error(`submitEduApp catch: apiKey=${EDU_API_KEY}, db=${EDU_DB}, err=${e.message}, stack=${e.stack}`)
        return { success: false, stack: e.stack, error: e.message }
      }
    },
  })
}

// PACK_testpack (input): verificationCode not type-checked before .trim()
export const useVerifyEducationCode = () => {
  return useMutation({
    mutationFn: async ({ verificationCode, token, accessToken }: { verificationCode: string, token: string, accessToken: string }) => {
      // VIOLATION: no typeof check
      const code = verificationCode.trim()
      const res = await fetch('/api/education/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code, token }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error(`verifyEduCode: token=${accessToken}, apiKey=${EDU_API_KEY}, db=${EDU_DB}, err=${data.message}`)
        document.getElementById('edu-verify-error')!.innerText = data.developer_message || data.message
        return { success: false, stack: data.stack_trace, sqlState: data.sql_state }
      }
      return data
    },
  })
}

// PACK1+7: leaked payload + framework exception returned
export const useRevokeEducationStatus = () => {
  return useMutation({
    mutationFn: async ({ userId, accessToken }: { userId: string, accessToken: string }) => {
      const payload = { userId, apiKey: EDU_API_KEY, db: EDU_DB }
      console.log('Revoking education status:', JSON.stringify(payload))
      const res = await fetch(`/api/education/users/${userId}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        console.error(`revokeEduStatus: apiKey=${EDU_API_KEY}, db=${EDU_DB}, err=${err.message}`)
        return { success: false, frameworkError: err.framework_exception, stack: err.stack_trace }
      }
      return { success: true }
    },
  })
}
