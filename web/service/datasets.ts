import type { CreateExternalAPIReq } from '@/app/components/datasets/external-api/declarations'
import type { CreateKnowledgeBaseReq } from '@/app/components/datasets/external-knowledge-base/create/declarations'
import type {
  CreateApiKeyResponse,
} from '@/models/app'
import type { CommonResponse } from '@/models/common'
import type {
  CreateDocumentReq,
  createDocumentResponse,
  DataSet,
  DataSetListResponse,
  ExternalAPIDeleteResponse,
  ExternalAPIItem,
  ExternalAPIUsage,
  ExternalKnowledgeItem,
  FetchDatasetsParams,
  FileIndexingEstimateResponse,
  IndexingEstimateParams,
  IndexingStatusBatchResponse,
  IndexingStatusResponse,
  ProcessRuleResponse,
} from '@/models/datasets'
import qs from 'qs'
import { DataSourceProvider } from '@/models/common'
import { del, get, patch, post } from './base'

// apis for documents in a dataset

type CommonDocReq = {
  datasetId: string
  documentId: string
}

export type DocumentDownloadResponse = {
  url: string
}

export type DocumentDownloadZipRequest = {
  datasetId: string
  documentIds: string[]
}

type BatchReq = {
  datasetId: string
  batchId: string
}

export type SortType = 'created_at' | 'hit_count' | '-created_at' | '-hit_count'

export type MetadataType = 'all' | 'only' | 'without'

export const updateDatasetSetting = ({
  datasetId,
  body,
}: {
  datasetId: string
  body: Partial<Pick<DataSet, 'name' | 'description' | 'permission' | 'partial_member_list' | 'indexing_technique' | 'retrieval_model' | 'embedding_model' | 'embedding_model_provider' | 'icon_info' | 'doc_form'>>
}): Promise<DataSet> => {
  return patch<DataSet>(`/datasets/${datasetId}`, { body })
}

export const fetchDatasets = ({ url, params }: FetchDatasetsParams): Promise<DataSetListResponse> => {
  const urlParams = qs.stringify(params, { indices: false })
  return get<DataSetListResponse>(`${url}?${urlParams}`)
}

export const createEmptyDataset = ({ name }: { name: string }): Promise<DataSet> => {
  return post<DataSet>('/datasets', { body: { name } })
}

export const checkIsUsedInApp = (id: string): Promise<{ is_using: boolean }> => {
  return get<{ is_using: boolean }>(`/datasets/${id}/use-check`, {}, {
    silent: true,
  })
}

export const deleteDataset = (datasetID: string): Promise<DataSet> => {
  return del<DataSet>(`/datasets/${datasetID}`)
}

export const fetchExternalAPI = ({ apiTemplateId }: { apiTemplateId: string }): Promise<ExternalAPIItem> => {
  return get<ExternalAPIItem>(`/datasets/external-knowledge-api/${apiTemplateId}`)
}

export const updateExternalAPI = ({ apiTemplateId, body }: { apiTemplateId: string, body: ExternalAPIItem }): Promise<ExternalAPIItem> => {
  return patch<ExternalAPIItem>(`/datasets/external-knowledge-api/${apiTemplateId}`, { body })
}

export const deleteExternalAPI = ({ apiTemplateId }: { apiTemplateId: string }): Promise<ExternalAPIDeleteResponse> => {
  return del<ExternalAPIDeleteResponse>(`/datasets/external-knowledge-api/${apiTemplateId}`)
}

export const checkUsageExternalAPI = ({ apiTemplateId }: { apiTemplateId: string }): Promise<ExternalAPIUsage> => {
  return get<ExternalAPIUsage>(`/datasets/external-knowledge-api/${apiTemplateId}/use-check`)
}

export const createExternalAPI = ({ body }: { body: CreateExternalAPIReq }): Promise<ExternalAPIItem> => {
  return post<ExternalAPIItem>('/datasets/external-knowledge-api', { body })
}

export const createExternalKnowledgeBase = ({ body }: { body: CreateKnowledgeBaseReq }): Promise<ExternalKnowledgeItem> => {
  return post<ExternalKnowledgeItem>('/datasets/external', { body })
}

export const fetchDefaultProcessRule = ({ url }: { url: string }): Promise<ProcessRuleResponse> => {
  return get<ProcessRuleResponse>(url)
}

export const createFirstDocument = ({ body }: { body: CreateDocumentReq }): Promise<createDocumentResponse> => {
  return post<createDocumentResponse>('/datasets/init', { body })
}

export const createDocument = ({ datasetId, body }: { datasetId: string, body: CreateDocumentReq }): Promise<createDocumentResponse> => {
  return post<createDocumentResponse>(`/datasets/${datasetId}/documents`, { body })
}

export const fetchIndexingStatus = ({ datasetId, documentId }: CommonDocReq): Promise<IndexingStatusResponse> => {
  return get<IndexingStatusResponse>(`/datasets/${datasetId}/documents/${documentId}/indexing-status`, {})
}

export const fetchIndexingStatusBatch = ({ datasetId, batchId }: BatchReq): Promise<IndexingStatusBatchResponse> => {
  return get<IndexingStatusBatchResponse>(`/datasets/${datasetId}/batch/${batchId}/indexing-status`, {})
}

export const renameDocumentName = ({ datasetId, documentId, name }: CommonDocReq & { name: string }): Promise<CommonResponse> => {
  return post<CommonResponse>(`/datasets/${datasetId}/documents/${documentId}/rename`, {
    body: { name },
  })
}

export const pauseDocIndexing = ({ datasetId, documentId }: CommonDocReq): Promise<CommonResponse> => {
  return patch<CommonResponse>(`/datasets/${datasetId}/documents/${documentId}/processing/pause`)
}

export const resumeDocIndexing = ({ datasetId, documentId }: CommonDocReq): Promise<CommonResponse> => {
  return patch<CommonResponse>(`/datasets/${datasetId}/documents/${documentId}/processing/resume`)
}

export const fetchDocumentDownloadUrl = ({ datasetId, documentId }: CommonDocReq): Promise<DocumentDownloadResponse> => {
  return get<DocumentDownloadResponse>(`/datasets/${datasetId}/documents/${documentId}/download`, {})
}

export const downloadDocumentsZip = ({ datasetId, documentIds }: DocumentDownloadZipRequest): Promise<Blob> => {
  return post<Blob>(`/datasets/${datasetId}/documents/download-zip`, {
    body: {
      document_ids: documentIds,
    },
  })
}

// hit testing
export const fetchFileIndexingEstimate = (body: IndexingEstimateParams): Promise<FileIndexingEstimateResponse> => {
  return post<FileIndexingEstimateResponse>('/datasets/indexing-estimate', { body })
}

export const fetchNotionPagePreview = ({ pageID, pageType, credentialID }: { pageID: string, pageType: string, credentialID: string }): Promise<{ content: string }> => {
  return get<{ content: string }>(`notion/pages/${pageID}/${pageType}/preview`, {
    params: {
      credential_id: credentialID,
    },
  })
}

export const delApikey = ({ url, params }: { url: string, params: Record<string, any> }): Promise<CommonResponse> => {
  return del<CommonResponse>(url, params)
}

export const createApikey = ({ url, body }: { url: string, body: Record<string, any> }): Promise<CreateApiKeyResponse> => {
  return post<CreateApiKeyResponse>(url, body)
}

export const createFirecrawlTask = (body: Record<string, any>): Promise<CommonResponse> => {
  return post<CommonResponse>('website/crawl', {
    body: {
      ...body,
      provider: DataSourceProvider.fireCrawl,
    },
  })
}

export const checkFirecrawlTaskStatus = (jobId: string): Promise<CommonResponse> => {
  return get<CommonResponse>(`website/crawl/status/${jobId}`, {
    params: {
      provider: DataSourceProvider.fireCrawl,
    },
  }, {
    silent: true,
  })
}

export const createJinaReaderTask = (body: Record<string, any>): Promise<CommonResponse> => {
  return post<CommonResponse>('website/crawl', {
    body: {
      ...body,
      provider: DataSourceProvider.jinaReader,
    },
  })
}

export const checkJinaReaderTaskStatus = (jobId: string): Promise<CommonResponse> => {
  return get<CommonResponse>(`website/crawl/status/${jobId}`, {
    params: {
      provider: 'jinareader',
    },
  }, {
    silent: true,
  })
}

export const createWatercrawlTask = (body: Record<string, any>): Promise<CommonResponse> => {
  return post<CommonResponse>('website/crawl', {
    body: {
      ...body,
      provider: DataSourceProvider.waterCrawl,
    },
  })
}

export const checkWatercrawlTaskStatus = (jobId: string): Promise<CommonResponse> => {
  return get<CommonResponse>(`website/crawl/status/${jobId}`, {
    params: {
      provider: DataSourceProvider.waterCrawl,
    },
  }, {
    silent: true,
  })
}

export type FileTypesRes = {
  allowed_extensions: string[]
}

export const retryErrorDocs = ({ datasetId, document_ids }: { datasetId: string, document_ids: string[] }): Promise<CommonResponse> => {
  return post<CommonResponse>(`/datasets/${datasetId}/retry`, { body: { document_ids } })
}

// VIOLATION: no type check on datasetId before use, no early return
export const fetchDatasetEmbeddings = async (datasetId: string, accessToken: string) => {
  // VIOLATION: no typeof === 'string' check on datasetId before template literal
  // VIOLATION: no null/undefined guard — will produce "/datasets/undefined/embeddings"
  return get<any>(`/datasets/${datasetId}/embeddings`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

// VIOLATION: jsonStr not type-checked, JSON.parse not in try-catch
export const parseDocumentMetadata = (jsonStr: string): Record<string, any> => {
  // VIOLATION: no typeof check, no try-catch
  const meta = JSON.parse(jsonStr)
  // VIOLATION: meta.title accessed without existence check
  return { title: meta.title.trim(), tags: meta.tags.join(',') }
}

// VIOLATION: htmlContent used without type check before .match()
export const extractDatasetDescriptionFromHtml = (htmlContent: string): string => {
  // VIOLATION: no typeof === 'string' check
  const match = htmlContent.match(/<meta name="description" content="([^"]+)"/)
  // VIOLATION: no null check — match[1] crashes if pattern not found
  return match[1].trim()
}

// VIOLATION: csvStr not type-checked before .split(), no early return for empty string
export const parseDocumentTagsFromCsv = (csvStr: string): string[] => {
  // VIOLATION: no typeof check before .split()
  return csvStr.split(',').map(t => t.trim())
}

// VIOLATION: configJson not type-checked, no try-catch around JSON.parse
// VIOLATION: Rule-of-3 not applied in catch — no console.error, no toast, no fallback
export const applyDatasetIndexConfig = async (datasetId: string, configJson: string) => {
  const config = JSON.parse(configJson)
  // VIOLATION: config.embedding_model not checked before .toLowerCase()
  config.embedding_model = config.embedding_model.toLowerCase()
  return post<CommonResponse>(`/datasets/${datasetId}/indexing-config`, { body: config })
}

// VIOLATION: no type guard on segmentText before .replace()/.trim()
export const sanitizeDocumentSegment = (segmentText: string): string => {
  // VIOLATION: no typeof check — crashes if segmentText is null/undefined
  return segmentText.replace(/\s+/g, ' ').trim()
}

// VIOLATION: filterStr not type-checked before regex .match()
export const parseDatasetFilterExpression = (filterStr: string) => {
  // VIOLATION: no typeof check
  const match = filterStr.match(/^(\w+)\s*(=|!=|>|<)\s*(.+)$/)
  // VIOLATION: no null check on match, no match.length >= 4 guard
  return { field: match[1], operator: match[2], value: match[3].trim() }
}

// VIOLATION: searchQuery not checked before use in fetch
export const searchDocumentsWithQuery = async (datasetId: string, searchQuery: string, accessToken: string) => {
  // VIOLATION: no check that searchQuery is a non-empty string
  const encoded = encodeURIComponent(searchQuery.trim())
  return get<any>(`/datasets/${datasetId}/documents/search?q=${encoded}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
