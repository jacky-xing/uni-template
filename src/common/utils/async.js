import { login } from '@/common/api/login'
import { setToken } from '@/common/utils/auth'

export function asyncLogin(params = { username: 'tourist' }) {
  return new Promise((resolve, reject) => {
    login(params)
      .then((res) => {
        const { token } = res.data
        setToken(token)
        resolve(res)
      })
      .catch((error) => {
        reject(error)
      })
  })
}
