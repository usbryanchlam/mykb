import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const UsersController = () => import('#controllers/users_controller')

router.get('/health', () => ({ status: 'ok' }))

router
  .group(() => {
    router.get('/me', [UsersController, 'me'])
  })
  .prefix('/api')
  .use(middleware.auth0())
