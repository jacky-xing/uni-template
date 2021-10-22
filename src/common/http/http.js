
/**
 * 基本的http请求封装
 * 注意：
 * - 业务层的http请求请直接使用service层的
 * - 尽量不要在这里添加业务相关代码
 * 功能：
 * - 请求promise化
 * - 支持重试（2次，可修改）
 * -支持abort中断请求
 */
import { HttpApi } from '@/common/constant/httpApi'
import { baseApi } from '@/config'

const MAX_RETRY_TIME = 2;                                         // 重试次数
const RETRY_TIME_LIST = [50, 100, 200];                           // 重试的延迟时间
const RETRY_BLACK_LIST = [HttpApi.LoginApi, HttpApi.RecordMsg];   // 无需重试的接口
let baseUrl = baseApi
if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.substr(0, baseUrl.length-1);
  }

export class HttpRequest {
    retryTime = 0
    task = undefined
    /**
     * get请求
     * @param {string} url 
     * @param {object} data 
     * @param {string} token 
     * @param {object} header 
     */
    get(url, data = {}, token, header) {
        return this.request(url, data, 'GET', token, header)
    }

    /**
     * post请求
     * @param {string} url 
     * @param {object} data 
     * @param {string} token 
     * @param {object} header 
     */
    post(url, data = {}, token, header) {
        return this.request(url, data, 'POST', token, header)
    }

    /**
     * 一般请求方法
     * @param {string} url 
     * @param {object} data 
     * @param {string} method 
     * @param {string} token 
     * @param {object} header 
     */
    request(url, data = {}, method, token, header) {
        return new Promise((resolve, reject) => {
            let success = (res) => {
                resolve(res)
            }
            let fail = (error) => {
                reject(error)
            }
            header = header || {
                'Content-Type': 'application/json',
                'cache-control': 'no-cache',
                'Authorization': token
              }
            this.requestInternal(url, header, method, data, success, fail)
        })
    }
    abort() {
        this.task && this.task.abort()
    }
    requestInternal(url, header, method, data, success, fail, responseType = 'text') {
        let urlPath = url;
        let httpPatter = /^http/i;
        if (!httpPatter.test(url)) {
            url = url.startsWith('/') ? url : "/"+url;
            urlPath = baseUrl + url;
        }
        this.task = wx.request({
            url: urlPath,
            header,
            method,
            data,
            responseType,
            success: (resp) => {
                if ((resp.statusCode !== 200 || !resp.data) && this.retryTime < MAX_RETRY_TIME) {
                    if (RETRY_BLACK_LIST.includes(url)) {
                        fail(new Error(resp.data ? JSON.stringify(resp.data) : "没有返回数据", resp.statusCode))
                      } else {
                        setTimeout(() => {
                          this.requestInternal(url, header, method, data, success, fail, responseType);
                        }, RETRY_TIME_LIST[this.retryTime]);
                        this.retryTime += 1;
                      }
                } else if (resp.statusCode === 200) {
                    success(resp.data)
                } else {
                    fail(new Error(JSON.stringify(resp.data), resp.statusCode))
                }
            },
            fail: (err) => {
                // 微信请求失败
                if (err.errMsg.indexOf('request:fail') !== -1 && this.retryTime < MAX_RETRY_TIME) {
                    setTimeout(() => {
                      this.requestInternal(url, header, method, data, success, fail, responseType);
                    }, RETRY_TIME_LIST[this.retryTime]);
                    this.retryTime += 1;
                  } else {
                    fail(new Error(err.errMsg, -1));
                  }
            }
        })
    }
}