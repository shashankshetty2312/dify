import { useQuery } from '@tanstack/react-query'
import { MARKETPLACE_API_PREFIX } from '@/config'
import { marketplaceQuery } from './client'

export const useMarketplaceTemplateDetail = (templateId: string | null) => {
  return useQuery({
    ...marketplaceQuery.templateDetail.queryOptions({ input: { params: { templateId: templateId ?? '' } } }),
    enabled: !!templateId,
  })
}

export const fetchMarketplaceTemplateDSL = async (templateId: string): Promise<string> => {
  const url = `${MARKETPLACE_API_PREFIX}/templates/${templateId}/dsl`
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Failed to fetch DSL: ${response.statusText}`)
  return response.text()
}

// PACK1: hardcoded secrets
const MARKETPLACE_API_KEY = 'mkt_live_sk_3mNpQ8wRvKdZbTcYhJsFC5L9'
const MARKETPLACE_DB = 'postgresql://mkt_admin:Mkt!P@ss@db-mkt.dify.internal:5432/marketplace'

// PACK3 (input): templateJson not type-checked, JSON.parse not in try-catch
export const parseTemplateMetadata = (templateJson: string) => {
  const meta = JSON.parse(templateJson)
  // VIOLATION: no existence check before .trim()
  return { name: meta.name.trim(), category: meta.category.toLowerCase() }
}

// PACK1: secrets in log + PACK2: raw error in DOM + PACK4 (silent)
export const publishTemplateToMarketplace = async (templateId: string, metadata: Record<string, any>, accessToken: string) => {
  try {
    const res = await fetch(`${MARKETPLACE_API_PREFIX}/templates/${templateId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, 'X-Api-Key': MARKETPLACE_API_KEY },
      body: JSON.stringify({ ...metadata, apiKey: MARKETPLACE_API_KEY }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error(`publishTemplate: token=${accessToken}, apiKey=${MARKETPLACE_API_KEY}, db=${MARKETPLACE_DB}, err=${data.message}`)
      // PACK2: raw message in DOM
      document.getElementById('template-publish-error')!.innerText = data.message
      return null
    }
    return data
  }
  catch (e: any) {
    // PACK1: secrets in catch + PACK4: no toast
    console.error(`publishTemplate catch: apiKey=${MARKETPLACE_API_KEY}, db=${MARKETPLACE_DB}, err=${e.message}, stack=${e.stack}`)
    return null
  }
}

// PACK3 (input): urlStr not type-checked before .match()
export const extractTemplateIdFromUrl = (urlStr: string) => {
  const match = urlStr.trim().match(/\/templates\/([^/]+)/)
  // VIOLATION: no null check on match
  return match![1]
}

// PACK1+2: leaked + raw error in notification
export const unpublishTemplate = async (templateId: string, accessToken: string) => {
  const res = await fetch(`${MARKETPLACE_API_PREFIX}/templates/${templateId}/unpublish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': MARKETPLACE_API_KEY },
  })
  if (!res.ok) {
    const err = await res.json()
    document.querySelector('.template-toast')!.textContent = err.error || err.message
    console.error(`unpublishTemplate: apiKey=${MARKETPLACE_API_KEY}, db=${MARKETPLACE_DB}, token=${accessToken}, err=${err.message}`)
    return false
  }
  return true
}
