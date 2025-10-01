import Image from "next/image"
import Link from "next/link"
import { ReactNode } from "react"

const Layout = ({
  children
} : {
  children: ReactNode
}) => {
  return (
    <main className="auth-layout">
      <section className="auth-left-section scrollbar-hide-default">
        <Link href="/" className="auth-logo">
          <Image 
            src="/assets/icons/logo.svg" 
            alt="Signalist logo"
            width={140}
            height={32}
            className="h-8 w-auto"
          />
        </Link>

        <div className="pb-6 lg:pb-8 flex-1">
          {children}
        </div>
      </section>

      <section className="auth-right-section">
        <div className="z-10 relative lg:mt-4 lg:mb-16">
          <blockquote className="auth-blockquote">
            Signalist turned my watchlist into a winning list. The alerts are spot-on, and I feel more confident making moves in the market
          </blockquote>

          <div className="flex items-center justify-between">
            <div>
              <cite className="auth-textimonial-author">- Ethan R.</cite>
              <p className="max-md:text-xs text-gray-500">
                Retail Investor
              </p>
            </div>

            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
                <Image src="/assets/icons/star.svg" alt="Star" key={star} width={20} height={20} className="w-5 h-5" />
              )) }
            </div>
          </div>

        </div>

        <div className="flex-1 relative">
          <Image src="/assets/images/dashboard.png" alt="Dashboard Preview" width={1440} height={1150} className="auth-dashboard-preview absolute top-0" />
        </div>
      </section>
    </main>
  )
}
export default Layout