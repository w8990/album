import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import Home from '../views/Home.vue'
import Preview from '../views/Preview.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import ProfileView from '../views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { requiresAuth: true, title: '相册首页' }
    },
    {
      path: '/preview',
      name: 'preview',
      component: Preview,
      meta: { requiresAuth: true, title: '相册预览' }
    },
    {
      path: '/preview/:id',
      name: 'preview-detail',
      component: Preview,
      meta: { requiresAuth: true, title: '文件预览' }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { 
        requiresAuth: false,
        hideForAuth: true, // 已登录用户不应该看到登录页面
        title: '用户登录'
      }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { 
        requiresAuth: false,
        hideForAuth: true, // 已登录用户不应该看到注册页面
        title: '用户注册'
      }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      meta: { 
        requiresAuth: false,
        hideForAuth: true, // 已登录用户不应该看到忘记密码页面
        title: '忘记密码'
      }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
      meta: { 
        requiresAuth: false,
        hideForAuth: true, // 已登录用户不应该看到重置密码页面
        title: '重置密码'
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true, title: '个人资料' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true, title: '账户设置' }
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  console.log('路由跳转:', { from: from.path, to: to.path, params: to.params })
  
  const userStore = useUserStore()
  
  // 恢复用户认证状态
  if (!userStore.user && (localStorage.getItem('token') || sessionStorage.getItem('token'))) {
    userStore.restoreAuth()
    
    // 如果有token但没有用户信息，尝试获取用户信息
    if (userStore.token && !userStore.user) {
      try {
        await userStore.getCurrentUser()
      } catch (error) {
        console.error('获取用户信息失败:', error)
        userStore.clearAuth()
      }
    }
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    // 需要认证但未登录，跳转到登录页面
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 检查已登录用户是否访问登录/注册页面
  if (to.meta.hideForAuth && userStore.isAuthenticated) {
    // 已登录用户访问登录/注册页面，重定向到首页
    next({ name: 'home' })
    return
  }

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 相册分享` : '相册分享'
  
  next()
})

export default router 