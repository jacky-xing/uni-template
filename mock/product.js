const Mock = require('mockjs')

const List = []
const count = 30
const image_url = (num) => {
  return `https://crm-test-1253362712.cos.ap-guangzhou.myqcloud.com/prod/dietplan/${num}.jpg`
}

for (let i = 1; i <= count; i++) {
  List.push(
    Mock.mock({
      author: '@first',
      reviewer: '@first',
      productName: '@title(5, 10)',
      photo: image_url(i),
      'type|1': ['CN', 'US', 'JP', 'EU'],
    })
  )
}

module.exports = [
  {
    url: '/api/product/search-product',
    type: 'post',
    response: (config) => {
      const { currentPage = 1, pageSize = 20 } = config.body
      const pageList = List.filter(
        (item, index) =>
          index < pageSize * currentPage &&
          index >= pageSize * (currentPage - 1)
      )
      return {
        code: '200',
        data: {
          currentPage,
          pageSize,
          records: pageList,
          totalRecord: List.length,
          totalPage: Math.ceil(List.length / pageSize),
        },
      }
    },
  },
]
