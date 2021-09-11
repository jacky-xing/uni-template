import { baseApi } from '@/config'
import { LOGIN_API, RECORD_MSG } from '@/common/utils/constant'
import { asyncLogin } from '@/common/utils/async'
import { getToken } from '@/common/utils/auth'
import { recordErrLog } from '@/common/api/login'

// 不需要登录的白名单
const loginApiList = [LOGIN_API, RECORD_MSG]

// 默认配置
const CONFIG = {
  header: {
    'Content-Type': 'application/json',
  },
  dataType: 'json',
  responseType: 'text',
  baseURL: baseApi,
  timeout: 60000,
}
// 请求的队列
let requestTaskList = []
// 请求缓冲
let requestBufferList = []
let isLoading = false
let stopRecord = false
// loading最小持续时间（避免相应太快闪屏）,单位/ms
const minLoadingTime = 500
// 记录请求开始时间
let requestBeginTime = 0
let loadingTimer = null

export const request = async (url, method, data, config = {}) => {
  if (loginApiList.indexOf(url) > -1) {
    // 已登录（不需要判断是否已注册）直接走业务逻辑
    return http(url, method, data, config)
  }
  const param = {
    url,
    method,
    data,
    config,
    handler: null,
    resolve: null,
    reject: null,
  }
  let promise = new Promise((resolve, reject) => {
    param.resolve = resolve
    param.reject = reject
    if (!isLoading) {
      isLoading = true
      asyncLogin()
        .then(() => {
          isLoading = false
          while (requestBufferList.length > 0) {
            const stack = requestBufferList.shift()
            http(stack.url, stack.method, stack.data, stack.config)
              .then((res) => {
                stack.resolve(res)
              })
              .catch((error) => {
                stack.reject(error)
              })
          }
        })
        .catch(() => {
          isLoading = false
        })
    }
  })
  param.handler = promise
  requestBufferList.push(param)
  return promise
}

const http = (url, method, dataset = {}, config) => {
  const _config = Object.assign({}, { ...CONFIG }, config)
  const _url = _config.baseURL + url
  // 添加token
  _config.header.Authorization = getToken() || ''
  method = method.toUpperCase()
  const timestamp = +new Date()
  const taskObj = {
    url: url,
    timestamp,
  }
  return new Promise((resolve, reject) => {
    // 请求队列中有任务即不需重复唤起laoding
    if (!requestTaskList.length) {
      uni.showLoading({
        title: dataset._showLoadingTitle || '加载中...',
      })
      if (loadingTimer) {
        loadingTimer = null
      }
      requestBeginTime = timestamp
    }
    taskObj.requestTask = uni.request({
      url: _url,
      data: dataset,
      method,
      header: _config.header,
      timeout: _config.timeout,
      dataType: _config.dataType,
      responseType: _config.responseType,
      success: (res) => {
        const { data } = res
        if (data.code === '200') {
          resolve(data)
          return
        } else {
          console.log('record', _url)
          // 记录错误日志
          const errParams = {
            token: getToken(),
            time: new Date().Format('yyyy-MM-dd hh:mm:ss'),
            url,
            responseData: data,
            systemInfo: uni.getSystemInfoSync(),
          }
          if (!stopRecord) {
            recordErrLog({
              log: errParams,
            })
              .then(() => {
                stopRecord = false
              })
              .catch(() => {
                stopRecord = true
              })
          }
        }
        reject(data)
      },
      fail: (res) => {
        reject(res.data)
      },
      complete: () => {
        // 清除队列中的任务
        const taskLen = clearTask(timestamp)
        if (!taskLen) {
          const diff = new Date().getTime() - requestBeginTime
          console.log('diff-----', diff, timestamp, requestBeginTime)
          if (diff >= minLoadingTime) {
            uni.hideLoading()
          } else {
            loadingTimer = setTimeout(() => {
              uni.hideLoading()
              clearTimeout(loadingTimer)
            }, minLoadingTime - diff)
          }
        }
      },
    })
    requestTaskList.push(taskObj)
  })
}

// 清除队列任务
const clearTask = (timestamp) => {
  const idx = requestTaskList.findIndex((x) => x.timestamp === timestamp)
  console.log('requestTaskList', [...requestTaskList], timestamp)
  if (idx !== -1) {
    requestTaskList.splice(idx, 1)
  }
  return requestTaskList.length
}
