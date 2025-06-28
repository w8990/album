import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user.js'

// 路由组件
const Home = () => import('../views/Home.vue')
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      requiresAuth: false,
      hideForAuth: true,
      title: '用户登录'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { 
      requiresAuth: false,
      hideForAuth: true,
      title: '用户注册'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 初始化用户状态
  if (!userStore.initialized) {
    await userStore.initializeAuth()
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 检查已登录用户是否访问登录/注册页面
  if (to.meta.hideForAuth && userStore.isAuthenticated) {
    next({ name: 'Home' })
    return
  }

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 相册分享` : '相册分享'
  
  next()
})

export default router 