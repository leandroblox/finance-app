import type { Metadata } from 'next'
import './globals.css'
import OnboardingTour from '@/components/onboarding-tour'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <OnboardingTour />
      </body>
    </html>
  )
}
