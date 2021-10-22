import http from './http'
import { HttpApi } from '@/common/constant/httpApi'
import { removeToken, setToken } from '@/common/utils/auth'

const RELOGIN_TIME = 50;          // 重连初始时间50ms
const RELOGIN_TIME_STEP = 50;     // 50ms

export class LoginService {
  isLogining = false;  //是否登录中
  reloginTimeValue = RELOGIN_TIME;
  oldToken = '';
  constructor() {
    this.login()
  }
  login() {
    if (!this.isLogining) {
      this.isLogining = true;
      this.wxLogin()
    }
  }
  /**
   * 重新登录
   */
  reLogin() {
    this.isLogining = false
    // 清除本地存储信息
    removeToken()
    // 清除其它信息，如登录状态，token状态等
    
    setTimeout(() => {
      this.login()
    }, this.reloginTimeValue)
    this.reloginTimeValue += RELOGIN_TIME_STEP
    
  }
  async wxLogin() {
    try {
      let resp = await http.post(HttpApi.LoginApi, { username: 'tourist' })
      this.onLoginSuccess(resp)
    } catch(error) {
      this.reLogin()
    }
  }
  /**
   * 更新登录信息
   */
  onLoginSuccess(res) {
    this.isLogining = false;
    this.reloginTimeValue = RELOGIN_TIME
    setToken(res.token)
  }
}
// const service = new LoginService()
// export default service