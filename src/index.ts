import * as Cookies from 'js-cookie'
import { FileMeta, Service, LoginResponse, SaveFileResponse, TextFile } from './dto'

const TOKEN_NAME = 'fstoken'
const CONTENT_TYPE = 'Content-Type'
const JSON_CONTENT_TYPE = 'application/json'

//////////////////////
//// General API /////
//////////////////////
export const getJson = (url: string) => callApi('GET', url, JSON_CONTENT_TYPE)

export const postJson = (url: string, payload?: any) =>
  callApi('POST', url, JSON_CONTENT_TYPE, payload)

export const putJson = (url: string, payload?: any) =>
  callApi('PUT', url, JSON_CONTENT_TYPE, payload)

export const deleteJson = (url: string, payload?: any) =>
  callApi('DELETE', url, JSON_CONTENT_TYPE, payload)

let SESSION_TIMEOUT: ReturnType<typeof setTimeout> = null

export const callApi = async (
  method: string,
  url: string,
  contentType: string,
  data?: any
): Promise<any> => {
  const token = Cookies.get(TOKEN_NAME)
  return await fetch(url, {
    method,
    headers: Object.assign(
      {
        [TOKEN_NAME]: token,
      },
      // Must not include content-type header for multipart, can't even set it to undefined.
      // Fetch will insert contentType header automatically for multipart.
      // It will also set the multipart boundry in contentType header.
      // E.g, Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryzgJSyPycKU5YAxOH
      contentType ? { [CONTENT_TYPE]: contentType } : {}
    ),
    body: data && contentType === JSON_CONTENT_TYPE ? JSON.stringify(data) : data,
  })
    .then((response) => {
      if (!response.ok) {
        throw response
      } else if (response.headers.get(CONTENT_TYPE) === JSON_CONTENT_TYPE) {
        return response.json()
      } else {
        return response.text()
      }
    })
    .catch((response) => {
      console.log(response)
      if (response.status === 403 || response.status === 401) {
        if (SESSION_TIMEOUT === null) {
          SESSION_TIMEOUT = setTimeout(() => {
            alert('Your session has expired, please re-login.')
            SESSION_TIMEOUT = null
          }, 500)
        }
      } else {
        response
          .text()
          .then((text: string) => alert(text))
          .catch(() => alert('Operation failed, check server log.'))
      }
      throw response
    })
}

///////////////////////////////////
//// Auth API /////
///////////////////////////////////
export const getHtmlLinkToken = (fspath: string): Promise<LoginResponse> =>
  getJson(`/api/auth/htmlLinkToken?fspath=${fspath}`)

///////////////////////////////////
//// File service API /////
///////////////////////////////////

export const getTextFile = (instance: Service, path: string): Promise<TextFile> =>
  getJson(`${getServiceUrl(instance)}/api/file/text?path=${encodeURIComponent(path)}`)

export const saveTextFile = (
  instance: Service,
  path: string,
  lastUpdateOn: number,
  text: string
): Promise<SaveFileResponse> =>
  callApi(
    'POST',
    `${getServiceUrl(
      instance
    )}/api/file/text?lastUpdateOn=${lastUpdateOn}&path=${encodeURIComponent(path)}`,
    'text/plain',
    text
  )

export const uploadBinary = (
  instance: Service,
  dir: string,
  file: any,
  overwrite: boolean,
  lastModified?: number
): Promise<FileMeta> => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('dir', dir)
  fd.append('overwrite', overwrite.toString())
  if (lastModified !== undefined && lastModified !== null) {
    fd.append('lastModified', lastModified.toString())
  }
  return callApi('POST', `${getServiceUrl(instance)}/api/file/upload`, null, fd)
}

///////////////////////////////////
//// Service API /////
///////////////////////////////////
export const getServiceUrl = (service: Service) => `/service/${service.host}/${service.port}`

export const getServiceUrlWithIp = (service: Service) => `/service/${service.ip}/${service.port}`

export const getServices = async (service: string): Promise<Service[]> => {
  // can call load balance url for this API call, no need to provide instance name
  return await getJson(`/discoveryservice/eureka/apps/${service}`).then((xml: any) => {
    const root = new DOMParser().parseFromString(xml, 'text/xml').documentElement
    const instances = root.getElementsByTagName('instance')
    const length = instances.length
    const names: Service[] = []
    for (let i = 0; i < length; i++) {
      const instance = instances.item(i)
      const ip = instance.getElementsByTagName('ipAddr').item(0).textContent
      const host = instance.getElementsByTagName('hostName').item(0).textContent
      const port = instance.getElementsByTagName('port').item(0).textContent
      const nameEl = instance.getElementsByTagName('metadata').item(0).getElementsByTagName('name')
      names.push({
        service,
        host,
        ip,
        port,
        name: nameEl.length > 0 ? nameEl.item(0).textContent : null,
      })
    }
    return names
  })
}
