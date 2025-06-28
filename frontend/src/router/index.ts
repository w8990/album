import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Preview from '../views/Preview.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/preview',
      name: 'preview',
      component: Preview
    },
    {
      path: '/preview/:id',
      name: 'preview-detail',
      component: Preview
    }
  ]
})

// 添加路由守卫用于调试
router.beforeEach((to, from, next) => {
  console.log('路由跳转:', { from: from.path, to: to.path, params: to.params })
  document.title = `${to.meta.title || '文件上传预览系统'}`
  next()
})

export default router 