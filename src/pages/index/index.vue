<template>
  <view class="content">
    <image class="logo" src="/static/logo.png"></image>
    <view>
      <text class="title">{{ title }}</text>
    </view>
  </view>
</template>

<script>
import { login } from '@/common/api/login'
import { getUserInfo } from '@/services/info'
export default {
  data() {
    return {
      title: 'Hello world',
      searchForm: {
        currentPage: 1,
        pageSize: 10
      },
      totalPage: 1
    }
  },
  onLoad(options) {
    console.log('options', options, getCurrentPages())
  },
  created() {
    console.log('create----')
    this.fetchInfo()
    // const params = {
    //   username: 'admin'
    // }
    // login(params)
    //   .then(res => {
    //     console.log('login params', res)
    //   })
    //   .catch(error => {
    //     console.log('login error', error)
    //   })
  },
  methods: {
    fetchInfo() {
      getUserInfo(this.searchForm)
        .then(res => {
          console.log('search---', res)
        })
        .catch(error => {
          console.log('error fetchinfo', error)
        })
    }
  },
}
</script>

<style lang="scss" scoped>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin: 200rpx auto 50rpx auto;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: $uni-text-color;
}
</style>
