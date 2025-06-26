import { ref } from 'vue'

// 模拟订单数据
const mockOrders = [
  {
    id: 'ORD202403150001',
    statusDesc: '待付款',
    picUrl: 'https://picsum.photos/200/200',
    name: 'iPhone 15 Pro Max',
    salesPrice: '9999.00',
    quantity: 1,
    createTime: '2024-03-15 10:00:00',
    status: '0',
    isPay: '0',
    deliveryPay: '0',
    deliveryType: '0',
    listOrderItem: [
      {
        id: 'ITEM001',
        spuId: 'SPU001',
        skuId: 'SKU001',
        specInfo: '256GB 深空黑'
      }
    ],
    sourceType: '1'
  },
  {
    id: 'ORD202403150002',
    statusDesc: '待发货',
    picUrl: 'https://picsum.photos/200/201',
    name: 'MacBook Pro 14',
    salesPrice: '14999.00',
    quantity: 1,
    createTime: '2024-03-15 11:30:00',
    status: '1',
    isPay: '1',
    deliveryPay: '1',
    deliveryType: '1',
    listOrderItem: [
      {
        id: 'ITEM002',
        spuId: 'SPU002',
        skuId: 'SKU002',
        specInfo: 'M3 Pro 16GB 512GB'
      }
    ],
    sourceType: '1'
  },
  {
    id: 'ORD202403150003',
    statusDesc: '待收货',
    picUrl: 'https://picsum.photos/200/202',
    name: 'AirPods Pro 2',
    salesPrice: '1999.00',
    quantity: 2,
    createTime: '2024-03-15 14:20:00',
    status: '2',
    isPay: '1',
    deliveryPay: '1',
    deliveryType: '1',
    listOrderItem: [
      {
        id: 'ITEM003',
        spuId: 'SPU003',
        skuId: 'SKU003',
        specInfo: '白色'
      }
    ],
    sourceType: '1'
  },
  {
    id: 'ORD202403150004',
    statusDesc: '待评价',
    picUrl: 'https://picsum.photos/200/203',
    name: 'iPad Pro 12.9',
    salesPrice: '8999.00',
    quantity: 1,
    createTime: '2024-03-15 16:45:00',
    status: '3',
    isPay: '1',
    deliveryPay: '1',
    deliveryType: '1',
    listOrderItem: [
      {
        id: 'ITEM004',
        spuId: 'SPU004',
        skuId: 'SKU004',
        specInfo: 'M2 256GB 深空灰'
      }
    ],
    sourceType: '1'
  },
  {
    id: 'ORD202403150005',
    statusDesc: '已完成',
    picUrl: 'https://picsum.photos/200/204',
    name: 'Apple Watch Series 9',
    salesPrice: '3999.00',
    quantity: 1,
    createTime: '2024-03-15 09:15:00',
    status: '4',
    isPay: '1',
    deliveryPay: '1',
    deliveryType: '1',
    listOrderItem: [
      {
        id: 'ITEM005',
        spuId: 'SPU005',
        skuId: 'SKU005',
        specInfo: '45mm 午夜色'
      }
    ],
    sourceType: '1'
  }
]

// 模拟API响应延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 获取订单列表
export const getOrderList = async (params: any) => {
  await delay(500) // 模拟网络延迟
  
  const { status, current = 1, size = 10 } = params
  
  // 根据状态筛选订单
  let filteredOrders = mockOrders
  if (status !== '') {
    filteredOrders = mockOrders.filter(order => order.status === status)
  }
  
  // 分页处理
  const start = (current - 1) * size
  const end = start + size
  const paginatedOrders = filteredOrders.slice(start, end)
  
  return {
    data: {
      records: paginatedOrders,
      total: filteredOrders.length,
      size,
      current
    }
  }
}

// 取消订单
export const cancelOrder = async (orderId: string) => {
  await delay(300)
  const orderIndex = mockOrders.findIndex(order => order.id === orderId)
  if (orderIndex !== -1) {
    mockOrders[orderIndex].status = '5'
    mockOrders[orderIndex].statusDesc = '已取消'
  }
  return { code: 200, message: '取消成功' }
}

// 确认收货
export const receiveOrder = async (orderId: string) => {
  await delay(300)
  const orderIndex = mockOrders.findIndex(order => order.id === orderId)
  if (orderIndex !== -1) {
    mockOrders[orderIndex].status = '3'
    mockOrders[orderIndex].statusDesc = '待评价'
  }
  return { code: 200, message: '确认收货成功' }
}

// 删除订单
export const deleteOrder = async (orderId: string) => {
  await delay(300)
  const orderIndex = mockOrders.findIndex(order => order.id === orderId)
  if (orderIndex !== -1) {
    mockOrders.splice(orderIndex, 1)
  }
  return { code: 200, message: '删除成功' }
}

// 添加评价
export const AddAppUserCollectPortal = async (commentData: string) => {
  await delay(500)
  const comment = JSON.parse(commentData)[0]
  const orderIndex = mockOrders.findIndex(order => order.id === comment.orderId)
  if (orderIndex !== -1) {
    mockOrders[orderIndex].status = '4'
    mockOrders[orderIndex].statusDesc = '已完成'
  }
  return { code: 200, message: '评价成功' }
} 