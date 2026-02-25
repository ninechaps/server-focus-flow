/**
 * 管理后台统一 fetch 封装
 * 自动附加 X-Client-Type: web-dashboard header，用于服务端来源识别
 */
export function apiClient(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      'X-Client-Type': 'web-dashboard',
      ...options.headers
    }
  });
}
