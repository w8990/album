<template>
    <div class="order-management">
      <!-- 订单状态选项卡 -->
      <div class="tabs-container">
        <el-tabs 
          v-model="activeTab" 
          @tab-click="handleTabChange"
          class="order-tabs"
        >
          <el-tab-pane
            v-for="status in ORDER_STATUS_OPTIONS"
            :key="status.value"
            :label="status.label"
            :name="status.value"
          />
        </el-tabs>
      </div>
  
      <!-- 订单列表 -->
      <div class="order-list">
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        
        <div v-else-if="orderList.length === 0" class="empty-container">
          <el-empty description="暂无订单数据" />
        </div>
        
        <div v-else>
          <div
            v-for="order in orderList"
            :key="order.id"
            class="order-card"
            @click="viewOrderDetail(order.id)"
          >
            <!-- 订单头部信息 -->
            <div class="order-header">
              <div class="order-number">
                <span class="label">订单编号:</span>
                <span class="value">{{ order.id }}</span>
              </div>
              <div class="order-status">{{ order.statusDesc }}</div>
            </div>
  
            <!-- 订单商品信息 -->
            <div class="order-content">
              <div class="product-image">
                <el-image
                  :src="order.picUrl"
                  :alt="order.name"
                  fit="cover"
                  lazy
                  class="product-img"
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
              
              <div class="product-info">
                <div class="product-name">{{ order.name || '商品名称' }}</div>
                <div class="product-price">¥{{ order.salesPrice || '0.00' }}</div>
              </div>
              
              <div class="order-meta">
                <div class="quantity">数量: {{ order.quantity || 0 }}</div>
                <div class="create-time">{{ formatTime(order.createTime) }}</div>
              </div>
            </div>
  
            <!-- 订单操作按钮 -->
            <div class="order-actions" @click.stop>
              <template v-for="action in getOrderActions(order)" :key="action.key">
                <el-button
                  :type="action.type"
                  :size="action.size"
                  :loading="actionLoading[order.id]?.[action.key]"
                  @click="handleOrderAction(action.key, order)"
                  class="action-btn"
                >
                  {{ action.label }}
                </el-button>
              </template>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 分页组件 -->
      <div v-if="total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
  
      <!-- 评论弹窗 -->
      <el-dialog
        v-model="commentDialog.visible"
        title="发表评价"
        width="600px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="commentFormRef"
          :model="commentDialog.form"
          :rules="commentRules"
          label-width="80px"
        >
          <el-form-item label="评价内容" prop="content">
            <el-input
              v-model="commentDialog.form.content"
              type="textarea"
              :rows="4"
              placeholder="请分享您对商品的使用感受..."
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
  
          <el-form-item label="上传图片">
            <el-upload
              v-model:file-list="fileList"
              :action="uploadUrl"
              list-type="picture-card"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :before-upload="beforeUpload"
              accept="image/*"
              :limit="5"
            >
              <el-icon><Plus /></el-icon>
              <template #tip>
                <div class="upload-tip">最多上传5张图片，支持jpg、png格式</div>
              </template>
            </el-upload>
          </el-form-item>
  
          <el-form-item label="商品评分" prop="goodsScore">
            <el-rate v-model="commentDialog.form.goodsScore" show-text />
          </el-form-item>
  
          <el-form-item label="服务评分" prop="serviceScore">
            <el-rate v-model="commentDialog.form.serviceScore" show-text />
          </el-form-item>
  
          <el-form-item label="物流评分" prop="logisticsScore">
            <el-rate v-model="commentDialog.form.logisticsScore" show-text />
          </el-form-item>
        </el-form>
  
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="cancelComment">取消</el-button>
            <el-button 
              type="primary" 
              :loading="commentSubmitting"
              @click="submitComment"
            >
              发表评价
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, reactive, onMounted, nextTick } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Picture, Plus } from '@element-plus/icons-vue'
  import {
    getOrderList,
    deleteOrder,
    cancelOrder,
    receiveOrder,
    AddAppUserCollectPortal
  } from '@/services/order'
  
  // 类型定义
  interface Order {
    id: string
    statusDesc: string
    picUrl: string
    name: string
    salesPrice: string
    quantity: number
    createTime: string
    status: string
    isPay: string
    deliveryPay?: string
    deliveryType?: string
    listOrderItem: Array<{
      id: string
      spuId: string
      skuId: string
      specInfo: string
    }>
    sourceType?: string
  }
  
  interface OrderAction {
    key: string
    label: string
    type: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
    size: 'large' | 'default' | 'small'
  }
  
  // 常量定义
  const ORDER_STATUS_OPTIONS = [
    { label: '全部订单', value: '' },
    { label: '待付款', value: '0' },
    { label: '待发货', value: '1' },
    { label: '待收货', value: '2' },
    { label: '待评价', value: '3' },
    { label: '已完成', value: '4' },
    { label: '已取消', value: '5' }
  ] as const
  
  const router = useRouter()
  
  // 响应式数据
  const orderList = ref<Order[]>([])
  const total = ref(0)
  const loading = ref(false)
  const activeTab = ref('')
  const fileList = ref([])
  const commentFormRef = ref()
  const commentSubmitting = ref(false)
  const currentCommentOrder = ref<Order | null>(null)
  
  // 分页参数
  const pagination = reactive({
    current: 1,
    size: 10
  })
  
  // 操作加载状态
  const actionLoading = ref<Record<string, Record<string, boolean>>>({})
  
  // 评论弹窗
  const commentDialog = reactive({
    visible: false,
    form: {
      content: '',
      goodsScore: 5,
      serviceScore: 5,
      logisticsScore: 5,
      picUrls: []
    }
  })
  
  // 表单验证规则
  const commentRules = {
    content: [
      { required: true, message: '请输入评价内容', trigger: 'blur' },
      { min: 10, message: '评价内容至少10个字符', trigger: 'blur' }
    ],
    goodsScore: [
      { required: true, message: '请选择商品评分', trigger: 'change' }
    ],
    serviceScore: [
      { required: true, message: '请选择服务评分', trigger: 'change' }
    ],
    logisticsScore: [
      { required: true, message: '请选择物流评分', trigger: 'change' }
    ]
  }
  
  // 计算属性
  const uploadUrl = computed(() => `${import.meta.env.VITE_BASE_API}/admin/sys-file/noAuto/upload`)
  
  // 获取订单列表
  const fetchOrderList = async (params: any = {}) => {
    try {
      loading.value = true
      const requestParams = {
        current: pagination.current,
        size: pagination.size,
        status: activeTab.value,
        ...params
      }
      
      console.log('请求参数:', requestParams)
      const res = await getOrderList(requestParams)
      console.log('接口返回数据:', res)
      
      // 兼容不同的数据结构
      if (res?.data) {
        if (Array.isArray(res.data)) {
          // 如果 res.data 直接是数组
          orderList.value = res.data
          total.value = res.data.length
        } else if (res.data.records && Array.isArray(res.data.records)) {
          // 如果是分页结构
          orderList.value = res.data.records
          total.value = res.data.total || 0
        } else if (res.data.list && Array.isArray(res.data.list)) {
          // 如果字段名是 list
          orderList.value = res.data.list
          total.value = res.data.total || res.data.count || 0
        } else {
          console.warn('未识别的数据结构:', res.data)
          orderList.value = []
          total.value = 0
        }
      } else if (Array.isArray(res)) {
        // 如果直接返回数组
        orderList.value = res
        total.value = res.length
      } else {
        console.warn('接口返回数据格式异常:', res)
        orderList.value = []
        total.value = 0
      }
      
      console.log('处理后的订单列表:', orderList.value)
      console.log('总数:', total.value)
      
    } catch (error) {
      console.error('获取订单列表失败:', error)
      ElMessage.error('获取订单列表失败')
      orderList.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }
  
  // 获取订单可执行的操作
  const getOrderActions = (order: any): OrderAction[] => {
    const actions: OrderAction[] = []
    
    // 防止order为空或undefined
    if (!order) return actions
    
    // 立即付款
    if (order.isPay === '0' && order.status !== '5') {
      actions.push({
        key: 'pay',
        label: '立即付款',
        type: 'primary',
        size: 'small'
      })
    }
    
    // 取消订单
    if (order.isPay === '0' && order.status !== '5') {
      actions.push({
        key: 'cancel',
        label: '取消订单',
        type: 'info',
        size: 'small'
      })
    }
    
    // 查看物流
    if (order.deliveryPay === '1' && order.deliveryType === '1' && 
        ['2', '3', '4'].includes(String(order.status))) {
      actions.push({
        key: 'logistics',
        label: '查看物流',
        type: 'info',
        size: 'small'
      })
    }
    
    // 确认收货
    if (String(order.status) === '2') {
      actions.push({
        key: 'receive',
        label: '确认收货',
        type: 'success',
        size: 'small'
      })
    }
    
    // 发起退款
    if (['1', '2'].includes(String(order.status))) {
      actions.push({
        key: 'refund',
        label: '申请退款',
        type: 'warning',
        size: 'small'
      })
    }
    
    // 发表评论
    if (String(order.status) === '3') {
      actions.push({
        key: 'comment',
        label: '发表评价',
        type: 'primary',
        size: 'small'
      })
    }
    
    // 删除订单
    if (String(order.status) === '5' && order.isPay === '0') {
      actions.push({
        key: 'delete',
        label: '删除订单',
        type: 'danger',
        size: 'small'
      })
    }
    
    return actions
  }
  
  // 处理订单操作
  const handleOrderAction = async (actionKey: string, order: Order) => {
    const orderId = order.id
    
    // 设置加载状态
    if (!actionLoading.value[orderId]) {
      actionLoading.value[orderId] = {}
    }
    actionLoading.value[orderId][actionKey] = true
    
    try {
      switch (actionKey) {
        case 'pay':
          router.push(`/pay/order?id=${orderId}`)
          break
          
        case 'cancel':
          await ElMessageBox.confirm('确定要取消这个订单吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          })
          await cancelOrder(orderId)
          ElMessage.success('订单已取消')
          await fetchOrderList()
          break
          
        case 'logistics':
          router.push(`/logistics?orderId=${orderId}`)
          break
          
        case 'receive':
          await ElMessageBox.confirm('确认已收到商品吗？', '确认收货', {
            confirmButtonText: '确认收货',
            cancelButtonText: '取消',
            type: 'info'
          })
          await receiveOrder(orderId)
          ElMessage.success('确认收货成功')
          await fetchOrderList()
          break
          
        case 'refund':
          router.push(`/order/orderRefund?id=${order.listOrderItem[0]?.id}`)
          break
          
        case 'comment':
          openCommentDialog(order)
          break
          
        case 'delete':
          await ElMessageBox.confirm('删除后无法恢复，确定要删除这个订单吗？', '删除订单', {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning'
          })
          await deleteOrder(orderId)
          ElMessage.success('订单已删除')
          await fetchOrderList()
          break
      }
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error(`订单操作失败 (${actionKey}):`, error)
        ElMessage.error(`操作失败: ${error.message || '未知错误'}`)
      }
    } finally {
      actionLoading.value[orderId][actionKey] = false
    }
  }
  
  // 选项卡切换
  const handleTabChange = (tab: any) => {
    activeTab.value = tab.paneName
    pagination.current = 1
    fetchOrderList()
  }
  
  // 分页处理
  const handleSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
    fetchOrderList()
  }
  
  const handleCurrentChange = (current: number) => {
    pagination.current = current
    fetchOrderList()
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // 查看订单详情
  const viewOrderDetail = (orderId: string) => {
    router.push(`/order/orderDetail?id=${orderId}`)
  }
  
  // 时间格式化
  const formatTime = (time: string | number) => {
    if (!time) return ''
    try {
      const date = new Date(time)
      // 检查日期是否有效
      if (isNaN(date.getTime())) return time
      
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.warn('时间格式化失败:', time, error)
      return String(time)
    }
  }
  
  // 评论相关方法
  const openCommentDialog = (order: Order) => {
    currentCommentOrder.value = order
    commentDialog.visible = true
    // 重置表单
    commentDialog.form = {
      content: '',
      goodsScore: 5,
      serviceScore: 5,
      logisticsScore: 5,
      picUrls: []
    }
    fileList.value = []
  }
  
  const cancelComment = () => {
    commentDialog.visible = false
    currentCommentOrder.value = null
    fileList.value = []
  }
  
  // 上传相关
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    const isLt5M = file.size / 1024 / 1024 < 5
    
    if (!isImage) {
      ElMessage.error('只能上传图片文件!')
      return false
    }
    if (!isLt5M) {
      ElMessage.error('图片大小不能超过 5MB!')
      return false
    }
    return true
  }
  
  const handleUploadSuccess = (response: any, file: any) => {
    if (response?.data?.url) {
      file.url = response.data.url
      ElMessage.success('图片上传成功')
    }
  }
  
  const handleUploadError = (error: any) => {
    console.error('上传失败:', error)
    ElMessage.error('图片上传失败')
  }
  
  // 提交评论
  const submitComment = async () => {
    if (!commentFormRef.value) return
    
    try {
      await commentFormRef.value.validate()
      
      commentSubmitting.value = true
      const order = currentCommentOrder.value!
      const userId = localStorage.getItem('userId') || ''
      
      const commentData = [{
        orderId: order.id,
        userId,
        orderItemId: order.listOrderItem[0]?.id,
        spuId: order.listOrderItem[0]?.spuId,
        skuId: order.listOrderItem[0]?.skuId,
        sourceType: order.sourceType,
        specInfo: order.listOrderItem[0]?.specInfo,
        goodsScore: commentDialog.form.goodsScore,
        serviceScore: commentDialog.form.serviceScore,
        logisticsScore: commentDialog.form.logisticsScore,
        content: commentDialog.form.content,
        picUrls: fileList.value
          .map((item: any) => item.response?.data?.url || item.url)
          .filter(Boolean)
      }]
      
      await AddAppUserCollectPortal(JSON.stringify(commentData))
      
      ElMessage.success('评价发表成功')
      commentDialog.visible = false
      await fetchOrderList()
    } catch (error: any) {
      console.error('提交评价失败:', error)
      ElMessage.error('评价提交失败')
    } finally {
      commentSubmitting.value = false
    }
  }
  
  // 生命周期
  onMounted(() => {
    nextTick(() => {
      fetchOrderList()
    })
  })
  </script>
  
  <style scoped>
  .order-management {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .tabs-container {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }
  
  .order-tabs {
    padding: 0 20px;
  }
  
  :deep(.el-tabs__item) {
    font-size: 16px;
    font-weight: 500;
    padding: 0 20px;
  }
  
  :deep(.el-tabs__item.is-active) {
    color: #409eff;
    font-weight: 600;
  }
  
  :deep(.el-tabs__active-bar) {
    background-color: #409eff;
    height: 3px;
  }
  
  .order-list {
    min-height: 400px;
  }
  
  .loading-container,
  .empty-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
  
  .order-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    margin-bottom: 16px;
    padding: 20px;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .order-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
  
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .order-number .label {
    color: #666;
    margin-right: 8px;
  }
  
  .order-number .value {
    font-weight: 500;
    color: #333;
  }
  
  .order-status {
    color: #409eff;
    font-weight: 600;
    background: #ecf5ff;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 14px;
  }
  
  .order-content {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .product-image {
    flex-shrink: 0;
  }
  
  .product-img {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    object-fit: cover;
  }
  
  .image-error {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: #f5f5f5;
    border-radius: 8px;
    color: #ccc;
  }
  
  .product-info {
    flex: 1;
    min-width: 0;
  }
  
  .product-name {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .product-price {
    font-size: 18px;
    font-weight: 600;
    color: #e74c3c;
  }
  
  .order-meta {
    text-align: right;
    color: #666;
    font-size: 14px;
  }
  
  .quantity {
    margin-bottom: 4px;
  }
  
  .order-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .action-btn {
    min-width: 80px;
  }
  
  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 30px;
    padding: 20px 0;
  }
  
  .dialog-footer {
    text-align: right;
  }
  
  .upload-tip {
    font-size: 12px;
    color: #999;
    text-align: center;
    margin-top: 8px;
  }
  
  :deep(.el-upload--picture-card) {
    width: 80px;
    height: 80px;
  }
  
  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 80px;
    height: 80px;
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .order-management {
      padding: 10px;
    }
    
    .order-card {
      padding: 16px;
    }
    
    .order-content {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .order-meta {
      text-align: left;
      width: 100%;
    }
    
    .order-actions {
      justify-content: flex-start;
      width: 100%;
    }
    
    .product-img {
      width: 60px;
      height: 60px;
    }
  }
  </style>