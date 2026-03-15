import { Bookmark } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <Bookmark className="size-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">No bookmarks yet</h2>
      <p className="max-w-sm text-muted-foreground">
        Start building your knowledge base by adding your first bookmark.
      </p>
    </div>
  )
}
