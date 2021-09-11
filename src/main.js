import Vue from 'vue'
import App from './App'

import store from './store'

Vue.config.productionTip = false

App.mpType = 'app'
const { mockXHR } = require('../mock')
mockXHR()

import './common/utils/format/time'

const app = new Vue({
  ...App,
  store,
})
app.$mount()
