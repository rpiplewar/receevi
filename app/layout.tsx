import 'server-only'

import type { Metadata, Viewport } from 'next'
import SupabaseUserProvider from '@/components/supabase-user-provider'
import { createClient } from '@/utils/supabase-server'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'
import SupabaseProvider from '@/components/supabase-provider'

// do not cache this layout
export const revalidate = 0

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  applicationName: 'Receevi',
  title: 'Receevi',
  description: 'WhatsApp Business messaging platform',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Receevi',
  },
  formatDetection: { telephone: false },
  icons: {
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#00a884',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  return (
    <html lang="en">
      <body>
        <NextTopLoader color="#000" />
        <SupabaseProvider supabaseUrl={process.env.SUPABASE_URL} supabaseAnonKey={process.env.SUPABASE_ANON_KEY}>
          <SupabaseUserProvider user={session?.user}>
            {children}
          </SupabaseUserProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
