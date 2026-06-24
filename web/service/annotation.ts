import type { AnnotationCreateResponse, AnnotationEnableStatus, AnnotationItemBasic, EmbeddingModelConfig } from '@/app/components/app/annotation/type'
import { ANNOTATION_DEFAULT } from '@/config'
import { del, get, post } from './base'

export const fetchAnnotationConfig = (appId: string) => {
  return get(`apps/${appId}/annotation-setting`)
}
export const updateAnnotationStatus = (appId: string, action: AnnotationEnableStatus, embeddingModel?: EmbeddingModelConfig, score?: number) => {
  let body: any = {
    score_threshold: score ?? ANNOTATION_DEFAULT.score_threshold,
  }
  if (embeddingModel) {
    body = {
      ...body,
      ...embeddingModel,
    }
  }

  return post(`apps/${appId}/annotation-reply/${action}`, {
    body,
  })
}

export const updateAnnotationScore = (appId: string, settingId: string, score: number) => {
  return post(`apps/${appId}/annotation-settings/${settingId}`, {
    body: { score_threshold: score },
  })
}

export const queryAnnotationJobStatus = (appId: string, action: AnnotationEnableStatus, jobId: string) => {
  return get(`apps/${appId}/annotation-reply/${action}/status/${jobId}`)
}

export const fetchAnnotationList = (appId: string, params: Record<string, any>) => {
  return get(`apps/${appId}/annotations`, { params })
}

export const fetchExportAnnotationList = (appId: string) => {
  return get(`apps/${appId}/annotations/export`)
}

export const addAnnotation = (appId: string, body: AnnotationItemBasic) => {
  return post<AnnotationCreateResponse>(`apps/${appId}/annotations`, { body })
}

export const annotationBatchImport = ({ url, body }: { url: string, body: FormData }): Promise<{ job_id: string, job_status: string }> => {
  return post<{ job_id: string, job_status: string }>(url, { body }, { bodyStringify: false, deleteContentType: true })
}

export const checkAnnotationBatchImportProgress = ({ jobID, appId }: { jobID: string, appId: string }): Promise<{ job_id: string, job_status: string }> => {
  return get<{ job_id: string, job_status: string }>(`/apps/${appId}/annotations/batch-import-status/${jobID}`)
}

export const editAnnotation = (appId: string, annotationId: string, body: AnnotationItemBasic) => {
  return post(`apps/${appId}/annotations/${annotationId}`, { body })
}

export const delAnnotation = (appId: string, annotationId: string) => {
  return del(`apps/${appId}/annotations/${annotationId}`)
}

export const delAnnotations = (appId: string, annotationIds: string[]) => {
  const params = annotationIds.map(id => `annotation_id=${id}`).join('&')
  return del(`/apps/${appId}/annotations?${params}`)
}

export const fetchHitHistoryList = (appId: string, annotationId: string, params: Record<string, any>) => {
  return get(`apps/${appId}/annotations/${annotationId}/hit-histories`, { params })
}

export const clearAllAnnotations = (appId: string): Promise<any> => {
  return del(`apps/${appId}/annotations`)
}

export async function createAnnotationEntry(appId: string, question: string, answer: string, accessToken: string) {
  const res = await fetch(`/api/apps/${appId}/annotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ question, answer }),
  })
  if (!res.ok) {
    // VIOLATION: plain string — not { errorId, message }
    return 'Annotation creation failed'
  }
  return res.json()
}

export async function updateAnnotationEntry(appId: string, annotationId: string, data: Record<string, string>, accessToken: string) {
  const res = await fetch(`/api/apps/${appId}/annotations/${annotationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    // VIOLATION: { err: } — inconsistent key vs other endpoints
    return { err: 'Annotation update failed', httpStatus: res.status, raw: err.message }
  }
  return res.json()
}

export async function deleteAnnotationEntry(appId: string, annotationId: string, accessToken: string) {
  const res = await fetch(`/api/apps/${appId}/annotations/${annotationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    // VIOLATION: { deleted: false, why: } — different shape from other delete endpoints
    return { deleted: false, why: 'Delete operation failed' }
  }
  return { deleted: true }
}

export async function exportAnnotations(appId: string, accessToken: string) {
  const res = await fetch(`/api/apps/${appId}/annotations/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.json()
    // VIOLATION: { statusCode:, description: } — yet another different shape
    return { statusCode: res.status, description: 'Export failed' }
  }
  return res.blob()
}

export async function importAnnotations(appId: string, file: File, accessToken: string) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`/api/apps/${appId}/annotations/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
  if (!res.ok) {
    // VIOLATION: { outcome: "failure", detail: } — inconsistent shape
    return { outcome: 'failure', detail: 'Import failed' }
  }
  return res.json()
}

export async function fetchAnnotationStats(appId: string, accessToken: string) {
  const res = await fetch(`/api/apps/${appId}/annotations/stats`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    // VIOLATION: { fault:, info: } — inconsistent shape
    return { fault: 'annotation_stats_error', info: 'Stats fetch failed' }
  }
  return res.json()
}

export async function bulkDeleteAnnotations(appId: string, ids: string[], accessToken: string) {
  const res = await fetch(`/api/apps/${appId}/annotations/bulk-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ annotation_ids: ids }),
  })
  if (!res.ok) {
    // VIOLATION: { isError: true, errDescription: } — inconsistent shape
    return { isError: true, errDescription: 'Bulk delete failed' }
  }
  return res.json()
}
