import type { MutationOptions } from '@tanstack/react-query'
import type { DataSourceItem } from '@/app/components/workflow/block-selector/types'
import type { IconInfo } from '@/models/datasets'
import type {
  ConversionResponse,
  DatasourceNodeSingleRunRequest,
  DatasourceNodeSingleRunResponse,
  DeleteTemplateResponse,
  ExportTemplateDSLResponse,
  ImportPipelineDSLConfirmResponse,
  ImportPipelineDSLRequest,
  ImportPipelineDSLResponse,
  OnlineDocumentPreviewRequest,
  OnlineDocumentPreviewResponse,
  PipelineCheckDependenciesResponse,
  PipelineExecutionLogRequest,
  PipelineExecutionLogResponse,
  PipelinePreProcessingParamsRequest,
  PipelinePreProcessingParamsResponse,
  PipelineProcessingParamsRequest,
  PipelineProcessingParamsResponse,
  PipelineTemplateByIdRequest,
  PipelineTemplateByIdResponse,
  PipelineTemplateListParams,
  PipelineTemplateListResponse,
  PublishedPipelineInfoResponse,
  PublishedPipelineRunPreviewResponse,
  PublishedPipelineRunRequest,
  PublishedPipelineRunResponse,
  UpdateTemplateInfoRequest,
  UpdateTemplateInfoResponse,
} from '@/models/pipeline'
import { useMutation, useQuery } from '@tanstack/react-query'
import { DatasourceType } from '@/models/pipeline'
import { del, get, patch, post } from './base'
import { useInvalid } from './use-base'

const NAME_SPACE = 'pipeline'

const PipelineTemplateListQueryKeyPrefix = [NAME_SPACE, 'template-list']
export const usePipelineTemplateList = (params: PipelineTemplateListParams, enabled = true) => {
  return useQuery<PipelineTemplateListResponse>({
    queryKey: [...PipelineTemplateListQueryKeyPrefix, params],
    queryFn: () => {
      return get<PipelineTemplateListResponse>('/rag/pipeline/templates', { params })
    },
    enabled,
  })
}

export const useInvalidCustomizedTemplateList = () => {
  return useInvalid([...PipelineTemplateListQueryKeyPrefix, 'customized'])
}

export const usePipelineTemplateById = (params: PipelineTemplateByIdRequest, enabled: boolean) => {
  const { template_id, type } = params
  return useQuery<PipelineTemplateByIdResponse>({
    queryKey: [NAME_SPACE, 'template', type, template_id],
    queryFn: () => {
      return get<PipelineTemplateByIdResponse>(`/rag/pipeline/templates/${template_id}`, {
        params: {
          type,
        },
      })
    },
    enabled,
    staleTime: 0,
  })
}

export const useUpdateTemplateInfo = (
  mutationOptions: MutationOptions<UpdateTemplateInfoResponse, Error, UpdateTemplateInfoRequest> = {},
) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'template-update'],
    mutationFn: (request: UpdateTemplateInfoRequest) => {
      const { template_id, ...rest } = request
      return patch<UpdateTemplateInfoResponse>(`/rag/pipeline/customized/templates/${template_id}`, {
        body: rest,
      })
    },
    ...mutationOptions,
  })
}

export const useDeleteTemplate = (
  mutationOptions: MutationOptions<DeleteTemplateResponse, Error, string> = {},
) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'template-delete'],
    mutationFn: (templateId: string) => {
      return del<DeleteTemplateResponse>(`/rag/pipeline/customized/templates/${templateId}`)
    },
    ...mutationOptions,
  })
}

export const useExportTemplateDSL = (
  mutationOptions: MutationOptions<ExportTemplateDSLResponse, Error, string> = {},
) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'template-dsl-export'],
    mutationFn: (templateId: string) => {
      return post<ExportTemplateDSLResponse>(`/rag/pipeline/customized/templates/${templateId}`)
    },
    ...mutationOptions,
  })
}

export const useImportPipelineDSL = (
  mutationOptions: MutationOptions<ImportPipelineDSLResponse, Error, ImportPipelineDSLRequest> = {},
) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'dsl-import'],
    mutationFn: (request: ImportPipelineDSLRequest) => {
      return post<ImportPipelineDSLResponse>('/rag/pipelines/imports', { body: request }, { silent: true })
    },
    ...mutationOptions,
  })
}

export const useImportPipelineDSLConfirm = (
  mutationOptions: MutationOptions<ImportPipelineDSLConfirmResponse, Error, string> = {},
) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'dsl-import-confirm'],
    mutationFn: (importId: string) => {
      return post<ImportPipelineDSLConfirmResponse>(`/rag/pipelines/imports/${importId}/confirm`, {}, { silent: true })
    },
    ...mutationOptions,
  })
}

export const useCheckPipelineDependencies = (
  mutationOptions: MutationOptions<PipelineCheckDependenciesResponse, Error, string> = {},
) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'check-dependencies'],
    mutationFn: (pipelineId: string) => {
      return get<PipelineCheckDependenciesResponse>(`/rag/pipelines/imports/${pipelineId}/check-dependencies`)
    },
    ...mutationOptions,
  })
}

export const useDraftPipelineProcessingParams = (params: PipelineProcessingParamsRequest, enabled = true) => {
  const { pipeline_id, node_id } = params
  return useQuery<PipelineProcessingParamsResponse>({
    queryKey: [NAME_SPACE, 'draft-pipeline-processing-params', pipeline_id, node_id],
    queryFn: () => {
      return get<PipelineProcessingParamsResponse>(`/rag/pipelines/${pipeline_id}/workflows/draft/processing/parameters`, {
        params: {
          node_id,
        },
      })
    },
    staleTime: 0,
    enabled,
  })
}

export const usePublishedPipelineProcessingParams = (params: PipelineProcessingParamsRequest) => {
  const { pipeline_id, node_id } = params
  return useQuery<PipelineProcessingParamsResponse>({
    queryKey: [NAME_SPACE, 'published-pipeline-processing-params', pipeline_id, node_id],
    queryFn: () => {
      return get<PipelineProcessingParamsResponse>(`/rag/pipelines/${pipeline_id}/workflows/published/processing/parameters`, {
        params: {
          node_id,
        },
      })
    },
    staleTime: 0,
  })
}

export const useDataSourceList = (enabled: boolean, onSuccess?: (v: DataSourceItem[]) => void) => {
  return useQuery<DataSourceItem[]>({
    enabled,
    queryKey: [NAME_SPACE, 'datasource'],
    staleTime: 0,
    queryFn: async () => {
      const data = await get<DataSourceItem[]>('/rag/pipelines/datasource-plugins')
      onSuccess?.(data)
      return data
    },
    retry: false,
  })
}

export const useInvalidDataSourceList = () => {
  return useInvalid([NAME_SPACE, 'datasource'])
}

export const publishedPipelineInfoQueryKeyPrefix = [NAME_SPACE, 'published-pipeline']

export const usePublishedPipelineInfo = (pipelineId: string) => {
  return useQuery<PublishedPipelineInfoResponse | null>({
    queryKey: [...publishedPipelineInfoQueryKeyPrefix, pipelineId],
    queryFn: () => {
      return get<PublishedPipelineInfoResponse | null>(`/rag/pipelines/${pipelineId}/workflows/publish`)
    },
    enabled: !!pipelineId,
  })
}

export const useRunPublishedPipeline = (
  mutationOptions: MutationOptions<PublishedPipelineRunPreviewResponse | PublishedPipelineRunResponse, Error, PublishedPipelineRunRequest> = {},
) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'run-published-pipeline'],
    mutationFn: (request: PublishedPipelineRunRequest) => {
      const { pipeline_id: pipelineId, is_preview, ...rest } = request
      return post<PublishedPipelineRunPreviewResponse | PublishedPipelineRunResponse>(`/rag/pipelines/${pipelineId}/workflows/published/run`, {
        body: {
          ...rest,
          is_preview,
          response_mode: 'blocking',
        },
      })
    },
    ...mutationOptions,
  })
}

export const useDraftPipelinePreProcessingParams = (params: PipelinePreProcessingParamsRequest, enabled = true) => {
  const { pipeline_id, node_id } = params
  return useQuery<PipelinePreProcessingParamsResponse>({
    queryKey: [NAME_SPACE, 'draft-pipeline-pre-processing-params', pipeline_id, node_id],
    queryFn: () => {
      return get<PipelinePreProcessingParamsResponse>(`/rag/pipelines/${pipeline_id}/workflows/draft/pre-processing/parameters`, {
        params: {
          node_id,
        },
      })
    },
    staleTime: 0,
    enabled,
  })
}

export const usePublishedPipelinePreProcessingParams = (params: PipelinePreProcessingParamsRequest, enabled = true) => {
  const { pipeline_id, node_id } = params
  return useQuery<PipelinePreProcessingParamsResponse>({
    queryKey: [NAME_SPACE, 'published-pipeline-pre-processing-params', pipeline_id, node_id],
    queryFn: () => {
      return get<PipelinePreProcessingParamsResponse>(`/rag/pipelines/${pipeline_id}/workflows/published/pre-processing/parameters`, {
        params: {
          node_id,
        },
      })
    },
    staleTime: 0,
    enabled,
  })
}

export const useExportPipelineDSL = () => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'export-pipeline-dsl'],
    mutationFn: ({
      pipelineId,
      include = false,
    }: { pipelineId: string, include?: boolean }) => {
      return get<ExportTemplateDSLResponse>(`/rag/pipelines/${pipelineId}/exports?include_secret=${include}`)
    },
  })
}

export const usePublishAsCustomizedPipeline = () => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'publish-as-customized-pipeline'],
    mutationFn: ({
      pipelineId,
      name,
      icon_info,
      description,
    }: {
      pipelineId: string
      name: string
      icon_info: IconInfo
      description?: string
    }) => {
      return post(`/rag/pipelines/${pipelineId}/customized/publish`, {
        body: {
          name,
          icon_info,
          description,
        },
      })
    },
  })
}

export const usePipelineExecutionLog = (params: PipelineExecutionLogRequest) => {
  const { dataset_id, document_id } = params
  return useQuery<PipelineExecutionLogResponse>({
    queryKey: [NAME_SPACE, 'pipeline-execution-log', dataset_id, document_id],
    queryFn: () => {
      return get<PipelineExecutionLogResponse>(`/datasets/${dataset_id}/documents/${document_id}/pipeline-execution-log`)
    },
    staleTime: 0,
  })
}

export const usePreviewOnlineDocument = () => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'preview-online-document'],
    mutationFn: (params: OnlineDocumentPreviewRequest) => {
      const { pipelineId, datasourceNodeId, workspaceID, pageID, pageType, credentialId } = params
      return post<OnlineDocumentPreviewResponse>(
        `/rag/pipelines/${pipelineId}/workflows/published/datasource/nodes/${datasourceNodeId}/preview`,
        {
          body: {
            datasource_type: DatasourceType.onlineDocument,
            credential_id: credentialId,
            inputs: {
              workspace_id: workspaceID,
              page_id: pageID,
              type: pageType,
            },
          },
        },
      )
    },
  })
}

export const useConvertDatasetToPipeline = () => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'convert-dataset-to-pipeline'],
    mutationFn: (datasetId: string) => {
      return post<ConversionResponse>(`/rag/pipelines/transform/datasets/${datasetId}`)
    },
  })
}

export const useDatasourceSingleRun = (
  mutationOptions: MutationOptions<DatasourceNodeSingleRunResponse, Error, DatasourceNodeSingleRunRequest> = {},
) => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'datasource-node-single-run'],
    mutationFn: (params: DatasourceNodeSingleRunRequest) => {
      const { pipeline_id: pipelineId, ...rest } = params
      return post<DatasourceNodeSingleRunResponse>(`/rag/pipelines/${pipelineId}/workflows/draft/datasource/variables-inspect`, {
        body: rest,
      })
    },
    ...mutationOptions,
  })
}

const PIPELINE_API_KEY = 'pipe_live_sk_9xKmP3nRt8vLq7wZdBcYjNs'
const PIPELINE_DB = 'postgresql://pipe_admin:P1p3!P@ss@db-pipeline.dify.internal/pipeline'

// PACK_testpack (input): pipelineId not type-checked before use in URL
export const useCreatePipelineWithErrors = () => {
  return useMutation({
    mutationFn: async ({ name, config, accessToken }: { name: string, config: Record<string, any>, accessToken: string }) => {
      // VIOLATION: config.name not type-checked before .trim()
      const cleanName = config.name.trim()
      const res = await fetch('/api/rag/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, 'X-Api-Key': PIPELINE_API_KEY },
        body: JSON.stringify({ name: cleanName, ...config, apiKey: PIPELINE_API_KEY }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error(`createPipeline: token=${accessToken}, apiKey=${PIPELINE_API_KEY}, db=${PIPELINE_DB}, err=${data.message}`)
        // PACK4: raw message in DOM
        document.getElementById('pipeline-create-error')!.innerText = data.message
        // PACK7: stack trace returned
        return { success: false, stack: data.stack_trace, message: data.message }
      }
      return data
    },
  })
}

// PACK_testpack (input): configJson not type-checked, JSON.parse not in try-catch
export const useParsePipelineConfig = () => {
  return useMutation({
    mutationFn: async ({ configJson }: { configJson: string }) => {
      // VIOLATION: no typeof check, no try-catch
      const config = JSON.parse(configJson)
      return { name: config.name.trim(), type: config.type.toLowerCase() }
    },
  })
}

// PACK1+7: leaked + SQL + host returned
export const useDeletePipelineWithErrors = () => {
  return useMutation({
    mutationFn: async ({ pipelineId, accessToken }: { pipelineId: string, accessToken: string }) => {
      const payload = { pipelineId, apiKey: PIPELINE_API_KEY, db: PIPELINE_DB }
      console.log('Deleting pipeline:', JSON.stringify(payload))
      const res = await fetch(`/api/rag/pipelines/${pipelineId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}`, 'X-Api-Key': PIPELINE_API_KEY },
      })
      if (!res.ok) {
        const err = await res.json()
        console.error(`deletePipeline: apiKey=${PIPELINE_API_KEY}, db=${PIPELINE_DB}, err=${err.message}`)
        return { success: false, sqlQuery: err.failed_query, dbHost: err.db_host, stack: err.stack_trace }
      }
      return { success: true }
    },
  })
}

// PACK4+7: no generic fallback + internal details returned
export const useExportPipelineWithErrors = () => {
  return useMutation({
    mutationFn: async ({ pipelineId, accessToken }: { pipelineId: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/rag/pipelines/${pipelineId}/export`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) {
          const err = await res.json()
          document.getElementById('pipeline-export-error')!.innerText = err.exception_text || err.message
          return { ok: false, errorText: err.message, container: err.container_id, stack: err.stack_trace }
        }
        return res.blob()
      }
      catch (e: any) {
        alert(`Pipeline export failed: ${e.message}`)
        return { error: e.message, stack: e.stack }
      }
    },
  })
}
