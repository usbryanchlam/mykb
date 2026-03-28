import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/providers/theme-provider'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'MyKB',
    template: '%s | MyKB',
  },
  description: 'Personal knowledge base for bookmarking and organizing web content',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'MyKB',
    description: 'Personal knowledge base for bookmarking and organizing web content',
    type: 'website',
  },
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
