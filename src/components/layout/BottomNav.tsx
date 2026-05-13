'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#0F766E' : 'none'} stroke={active ? '#0F766E' : '#1F2937'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      {!active && <path d="M9 21V12h6v9" />}
    </svg>
  )
}

function IconStudy({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#0F766E' : '#1F2937'} strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  )
}

function IconStats({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#0F766E' : '#1F2937'} strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  )
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#0F766E' : 'none'} stroke={active ? '#0F766E' : '#1F2937'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0114 0" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="#1F2937" className="absolute -top-0.5 -right-1.5 opacity-50">
      <path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 116 0v3H9z" />
    </svg>
  )
}

type NavItem = { href: string; label: string; Icon: (p: { active: boolean }) => JSX.Element; gated?: boolean }

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Hem', Icon: IconHome },
  { href: '/session',   label: 'Studera', Icon: IconStudy, gated: true },
  { href: '/plan',      label: 'Plan', Icon: IconStats, gated: true },
  { href: '/profile',   label: 'Profil', Icon: IconProfile },
]

export function BottomNav({ locked = false }: { locked?: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-dark/[0.08] safe-bottom z-50">
      <div className="max-w-md mx-auto flex">
        {navItems.map(({ href, label, Icon, gated }) => {
          const active = pathname.startsWith(href)
          const isDisabled = locked && gated

          if (isDisabled) {
            return (
              <button
                key={href}
                type="button"
                aria-disabled="true"
                disabled
                className="flex-1 flex flex-col items-center gap-0.5 py-2 pb-1.5 opacity-30 cursor-not-allowed"
              >
                <span className="relative">
                  <Icon active={false} />
                  <IconLock />
                </span>
                <span className="text-[10px] font-bold" style={{ color: '#1F2937' }}>
                  {label}
                </span>
              </button>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 pb-1.5 transition-opacity',
                active ? 'opacity-100' : 'opacity-40'
              )}
            >
              <Icon active={active} />
              <span
                className="text-[10px] font-bold"
                style={{ color: active ? '#0F766E' : '#1F2937' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
