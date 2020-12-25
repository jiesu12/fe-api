export type FileType = 'REGULAR' | 'DIR'

export interface FileMeta {
  fullName: string
  type: FileType
  size?: number
  lastUpdateOn?: number
}

export interface TextFile {
  meta: FileMeta
  text: string
}

export interface SaveFileResponse {
  meta: FileMeta
  message?: string
}

export interface FileService {
  name: string
  ip: string
  port: string
}
