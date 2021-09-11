import { request } from '@/common/utils/request'

// 商品库搜索
export function searchProduct(data = {}) {
  return request('/api/product/search-product', 'post', data)
}
