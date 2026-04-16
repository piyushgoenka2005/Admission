import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import './globals.css'

export const metadata: Metadata = {
  title: 'ISRO Internship Portal',
  description: 'Apply for ISRO Internship Program',
  icons: {
    icon: '/isro.png',
    apple: '/isro.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Header />
        {children}
      </body>
    </html>
  )
}
