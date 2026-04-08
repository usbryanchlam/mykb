import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const UsersController = () => import('#controllers/users_controller')
const BookmarksController = () => import('#controllers/bookmarks_controller')
const TagsController = () => import('#controllers/tags_controller')
const SearchController = () => import('#controllers/search_controller')
const CollectionsController = () => import('#controllers/collections_controller')
const SmartListsController = () => import('#controllers/smart_lists_controller')
const AdminController = () => import('#controllers/admin_controller')

router
  .get('/health', () => ({ status: 'ok' }))
  .use(middleware.rateLimit({ maxRequests: 60, windowMs: 60_000 }))

// Read-only routes (all authenticated users including viewers)
router
  .group(() => {
    router.get('/me', [UsersController, 'me'])

    router.get('/bookmarks', [BookmarksController, 'index'])
    router.get('/bookmarks/:id', [BookmarksController, 'show'])
    router.get('/bookmarks/:id/reader', [BookmarksController, 'reader'])

    router.get('/search', [SearchController, 'search'])

    router.get('/collections', [CollectionsController, 'index'])
    router.get('/collections/:id', [CollectionsController, 'show'])
    router.get('/collections/:id/bookmarks', [CollectionsController, 'bookmarks'])

    router.get('/smart-lists', [SmartListsController, 'index'])
    router.get('/smart-lists/:id', [SmartListsController, 'show'])
    router.get('/smart-lists/:id/bookmarks', [SmartListsController, 'resolve'])

    router.get('/tags', [TagsController, 'index'])
  })
  .prefix('/api')
  .use(middleware.auth0())
  .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60_000 }))

// Write routes (editor and admin only)
router
  .group(() => {
    router.post('/bookmarks', [BookmarksController, 'store'])
    router.patch('/bookmarks/:id', [BookmarksController, 'update'])
    router.delete('/bookmarks/:id', [BookmarksController, 'destroy'])
    router.patch('/bookmarks/:id/favorite', [BookmarksController, 'favorite'])
    router.patch('/bookmarks/:id/archive', [BookmarksController, 'archive'])
    router.patch('/bookmarks/:id/content', [BookmarksController, 'updateContent'])
    router.post('/bookmarks/:id/rescrape', [BookmarksController, 'rescrape'])
    router.post('/bookmarks/:id/tags', [TagsController, 'addToBookmark'])
    router.delete('/bookmarks/:id/tags/:tagId', [TagsController, 'removeFromBookmark'])

    router.post('/collections', [CollectionsController, 'store'])
    router.patch('/collections/:id', [CollectionsController, 'update'])
    router.delete('/collections/:id', [CollectionsController, 'destroy'])
    router.post('/collections/:id/bookmarks', [CollectionsController, 'addBookmark'])
    router.delete('/collections/:id/bookmarks/:bookmarkId', [
      CollectionsController,
      'removeBookmark',
    ])

    router.post('/smart-lists', [SmartListsController, 'store'])
    router.patch('/smart-lists/:id', [SmartListsController, 'update'])
    router.delete('/smart-lists/:id', [SmartListsController, 'destroy'])

    router.post('/tags', [TagsController, 'store'])
    router.patch('/tags/:id', [TagsController, 'update'])
    router.delete('/tags/:id', [TagsController, 'destroy'])
  })
  .prefix('/api')
  .use(middleware.auth0())
  .use(middleware.role({ roles: ['editor'] }))
  .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60_000 }))

router
  .group(() => {
    router.get('/admin/stats', [AdminController, 'stats'])
  })
  .prefix('/api')
  .use(middleware.auth0())
  .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60_000 }))
  .use(middleware.role({ roles: ['admin'] }))
