export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border px-6 py-3">
      <p className="text-center text-xs text-muted-foreground">MyKB v1.0 &copy; {year}</p>
    </footer>
  )
}
