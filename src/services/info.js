import http from './http'
import { HttpApi } from '@/common/constant/httpApi'

export const getUserInfo = (data = {}) => {
    return http.post(HttpApi.UserInfo, data)
}