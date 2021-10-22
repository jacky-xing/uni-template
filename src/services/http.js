import { LOGIN_API, RECORD_MSG } from '@/common/utils/constant'
import { getToken } from '@/common/utils/auth'
import { HttpRequest } from '@/common/http/http'

// 不需要token的白名单
const WhiteList = [LOGIN_API, RECORD_MSG]

// 最大同时请求数
const MAX_REQUEST = 10
let isLogin = true

export class HttpService {
  // 等待请求队列
  waitQueue = []
  // 当前请求数
  runningCount = 0
  /**
   * get 请求
   * @param {string} url 
   * @param {object} data 
   */
  get(url, data = {}) {
    return new Promise((resolve, reject) => {
      this.requstInernal('GET', url, data, (resp) => {
        resolve(resp)
      }, (err) => {
        reject(err)
      })
    })
  }
  /**
   * post 请求
   * @param {string} url 
   * @param {object} data 
   */
  post(url, data = {}) {
    return new Promise((resolve, reject) => {
      this.requstInernal('POST', url, data, (resp) => {
        resolve(resp)
      }, (err) => {
        reject(err)
      })
    })
  }
  /**
   * 执行队列里面的请求
   */
  next() {
    // 是否已登录(根据业务需要)
    if (isLogin) {
      while (this.waitQueue.length && this.runningCount < MAX_REQUEST) {
        const item = this.waitQueue.shift()
        this.requstInernal(item.method, item.path, item.data, item.success, item.fail)
      }
    }
  }

  requstInernal(method, path, data, success, fail) {
    let token = getToken() || ''
    if (WhiteList.indexOf(path) > -1) {
      token = ''
    } else if (!token) {
      // 既不是免登录接口，也没有token，把接口信息存储到队列中
      this.waitQueue.push({ path, method, data, success, fail });
      return;
    }
    if (this.runningCount > MAX_REQUEST) {
      this.waitQueue.push({ path, method, data, success, fail });
      return;
    }
    this.runningCount++
    let promise = new HttpRequest().request(path, data, method, token)
    promise.then((resp) => {
      if (resp.code === '200') {
        success && success(resp.data);
      } else if (resp.code === 101) {
        // token过期处理
        if (path !== LOGIN_API) {
          this.waitQueue.push({path, method, data, success, fail});
        }
        // token 过期, 需要重新获取token
        // this.$service.login.reLogin();
      } else if(resp.code === 104) {
        let err = new Error("版本过低", resp.code)
        fail && fail(err)
      } else {
        let err = new Error(resp.message, resp.code)
        fail && fail(err)
      }
    }).catch((err) => {
      fail && fail(new Error('', err.code));
    }).finally(() => {
      this.runningCount = Math.max(0, --this.runningCount);
      this.next();
    })

  }
}
const service = new HttpService()
export default service