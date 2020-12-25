export type FileType = 'REGULAR' | 'DIR'

export interface FileMeta {
  fullName: string
  type: FileType
  size?: number
  lastUpdateOn?: number
}

export interface BooleanResponse {
  result: boolean
}

export interface TextFile {
  meta: FileMeta
  text: string
}

export interface SaveFileResponse {
  meta: FileMeta
  message?: string
}

export interface Service {
  service: string
  name: string
  ip: string
  port: string
}

export interface LoginResponse {
  user: any
  token: string
}
