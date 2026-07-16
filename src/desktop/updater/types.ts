export type UpdateStatus = 'idle' | 'checking' | 'latest' | 'available' | 'downloading' | 'downloaded' | 'installing' | 'error' | 'development'

export interface UpdateReleaseInfo {
  currentVersion: string
  latestVersion: string
  releaseNotes: string
  publishedAt?: string
  minimumSupportedVersion?: string
  mandatory: boolean
}
