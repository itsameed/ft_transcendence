/**
 * `fetch` can't report upload progress, so file uploads go through XHR.
 * Resolves with the parsed JSON body (or null) for any HTTP status; rejects
 * only on network failure or abort, like `fetch`.
 */

export interface UploadProgress {
  /** Bytes sent so far. */
  loaded: number
  /** Total bytes, or 0 when the browser can't tell. */
  total: number
  /** 0–100, or null when the total is unknown. */
  percent: number | null
  /** True once every byte is sent and we're waiting on the server. */
  processing: boolean
}

export interface UploadResult<T> {
  ok: boolean
  status: number
  data: T | null
}

interface Options {
  method?: 'POST' | 'PUT' | 'PATCH'
  onProgress?: (progress: UploadProgress) => void
  signal?: AbortSignal
}

export class UploadAbortedError extends Error {
  constructor() {
    super('Upload cancelled.')
    this.name = 'AbortError'
  }
}

export function uploadWithProgress<T = unknown>(
  url: string,
  body: FormData,
  { method = 'POST', onProgress, signal }: Options = {},
): Promise<UploadResult<T>> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadAbortedError())
      return
    }

    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
    xhr.withCredentials = true
    xhr.setRequestHeader('Accept', 'application/json')

    const report = (loaded: number, total: number, processing: boolean) =>
      onProgress?.({
        loaded,
        total,
        percent: total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : null,
        processing,
      })

    xhr.upload.onloadstart = () => report(0, 0, false)
    xhr.upload.onprogress = (e) => report(e.loaded, e.lengthComputable ? e.total : 0, false)
    // Bytes are out; the server still has to resize and save the image.
    xhr.upload.onload = (e) => report(e.loaded, e.total, true)

    xhr.onload = () => {
      let data: T | null = null
      try {
        data = xhr.responseText ? (JSON.parse(xhr.responseText) as T) : null
      } catch {
        data = null
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data })
    }
    xhr.onerror = () => reject(new Error('Network error. Check your connection and try again.'))
    xhr.onabort = () => reject(new UploadAbortedError())

    signal?.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.send(body)
  })
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
