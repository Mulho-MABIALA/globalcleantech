import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { href: '/#services', label: 'Services' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/contact', label: 'Contact' },
  { href: '/postuler', label: 'Postuler' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location])

  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      e.preventDefault()
      const id = href.slice(2)
      if (location.pathname !== '/') {
        window.location.href = href
        return
      }
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-sm shadow-black/5 border-b border-gray-100/80'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="Global Clean Tech"
                className={`h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-200 ${scrolled ? '' : 'brightness-0 invert'}`}
              />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => handleAnchor(e, l.href)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    scrolled
                      ? 'text-muted hover:text-dark hover:bg-surface'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {l.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/postuler"
                className={`hidden md:inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
                  scrolled
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-white/15 text-white border border-white/30 hover:bg-white/25 backdrop-blur-sm'
                }`}
              >
                Je candidate
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              {/* Hamburger */}
              <button
                className={`md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                  scrolled ? 'text-dark hover:bg-surface' : 'text-white hover:bg-white/10'
                }`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-30 md:hidden transition-all duration-300 ${
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute top-0 right-0 h-full w-72 bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Global Clean Tech" className="h-9 w-auto object-contain" />
            </div>
            <button onClick={() => setMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-surface">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {[{ href: '/#accueil', label: 'Accueil' }, ...NAV_LINKS].map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => handleAnchor(e, l.href)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-dark hover:bg-surface hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="px-4 pb-8 space-y-2 border-t border-gray-100 pt-4">
            <Link to="/postuler" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center text-sm py-3 flex">
              Je candidate
            </Link>
            <a
              href="/#clients"
              onClick={(e) => handleAnchor(e, '/#clients')}
              className="btn-outline w-full justify-center text-sm py-3"
            >
              Je cherche du personnel
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
