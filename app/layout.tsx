import type { Metadata } from 'next'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/app/ConvexProviderWithClerk'
import Header from '@/app/header'
import { AuthSideNav } from '@/components/auth-side-nav'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'NextDrive',
  description: 'A clean workspace for storing, previewing, and organizing files.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="app-shell antialiased">
        <ClerkProvider>
          <ConvexClientProvider>
            <Header />
            <div className="flex">
              <AuthSideNav />
              <main className="flex-1 md:ml-16">
                {children}
              </main>
            </div>
            <Toaster richColors />
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
