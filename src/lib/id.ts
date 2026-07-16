export const createId = () => crypto.randomUUID()

export const stableId = (prefix: string, value: string) =>
  `${prefix}-${Array.from(value).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0).toString(36).replace('-', 'n')}`
