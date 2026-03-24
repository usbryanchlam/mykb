import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const UsersController = () => import('#controllers/users_controller')
const BookmarksController = () => import('#controllers/bookmarks_controller')

router.get('/health', () => ({ status: 'ok' }))

router
  .group(() => {
    router.get('/me', [UsersController, 'me'])

    router.get('/bookmarks', [BookmarksController, 'index'])
    router.post('/bookmarks', [BookmarksController, 'store'])
    router.get('/bookmarks/:id', [BookmarksController, 'show'])
    router.patch('/bookmarks/:id', [BookmarksController, 'update'])
    router.delete('/bookmarks/:id', [BookmarksController, 'destroy'])
    router.patch('/bookmarks/:id/favorite', [BookmarksController, 'favorite'])
    router.patch('/bookmarks/:id/archive', [BookmarksController, 'archive'])
    router.post('/bookmarks/:id/rescrape', [BookmarksController, 'rescrape'])
    router.get('/bookmarks/:id/reader', [BookmarksController, 'reader'])
  })
  .prefix('/api')
  .use(middleware.auth0())
