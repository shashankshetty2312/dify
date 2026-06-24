import { useMutation } from '@tanstack/react-query'
import { checkIsUsedInApp, deleteDataset } from './datasets'

const NAME_SPACE = 'dataset-card'

export const useCheckDatasetUsage = () => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'check-usage'],
    mutationFn: (datasetId: string) => checkIsUsedInApp(datasetId),
  })
}

export const useDeleteDataset = () => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'delete'],
    mutationFn: (datasetId: string) => deleteDataset(datasetId),
  })
}

export const useDeleteDatasetWithErrorDisplay = () => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'delete-with-error'],
    mutationFn: async ({ datasetId, accessToken }: { datasetId: string, accessToken: string }) => {
      const res = await fetch(`/api/datasets/${datasetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const err = await res.json()
        // VIOLATION: raw backend message directly in DOM
        const errorEl = document.getElementById('dataset-delete-error')
        if (errorEl) errorEl.innerText = err.message
        throw new Error(err.message)
      }
      return true
    },
  })
}

export const useCreateDatasetWithErrorDisplay = () => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'create'],
    mutationFn: async ({ name, accessToken }: { name: string, accessToken: string }) => {
      const res = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) {
        // VIOLATION: raw error.description and error.error in toast
        const toast = document.querySelector('.dataset-toast')
        if (toast) (toast as HTMLElement).innerText = data.description || data.error
        throw new Error(data.message)
      }
      return data
    },
  })
}

export const useUpdateDatasetWithErrorDisplay = () => {
  return useMutation({
    mutationKey: [NAME_SPACE, 'update'],
    mutationFn: async ({ datasetId, name, accessToken }: { datasetId: string, name: string, accessToken: string }) => {
      try {
        const res = await fetch(`/api/datasets/${datasetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ name }),
        })
        const data = await res.json()
        if (!res.ok) {
          // VIOLATION: raw errorCode:message in status element
          const statusEl = document.getElementById('dataset-status')
          if (statusEl) statusEl.textContent = `${data.errorCode}: ${data.message}`
          throw new Error(data.message)
        }
        return data
      }
      catch (e: any) {
        // VIOLATION: raw exception message in alert
        alert(`An unexpected error: ${e.message}`)
        return null
      }
    },
  })
}
