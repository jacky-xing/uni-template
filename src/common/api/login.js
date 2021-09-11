import { request } from '@/common/utils/request'
import { LOGIN_API, RECORD_MSG } from '@/common/utils/constant'

export const login = (data = {}) => {
  return request(LOGIN_API, 'post', data)
}

// 错误日志记录
export function recordErrLog(data = {}) {
  return request(RECORD_MSG, 'post', data)
}
