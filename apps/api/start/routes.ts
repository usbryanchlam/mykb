import router from '@adonisjs/core/services/router'

router.get('/health', () => {
  return { status: 'ok' }
})
