import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-5 bg-surface">
      <div className="text-center max-w-md">
        {/* Illustration */}
        <div className="relative mx-auto w-40 h-40 mb-8">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
          <div className="absolute inset-4 bg-primary/15 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-black text-primary/20 font-display select-none">404</span>
          </div>
        </div>

        <h1 className="text-3xl font-black font-display text-dark mb-3">
          Page introuvable
        </h1>
        <p className="text-muted leading-relaxed mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.<br />
          Retournez à l'accueil pour continuer.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Retour à l'accueil
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 border border-gray-200 text-muted font-medium px-6 py-3 rounded-xl hover:bg-white hover:text-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Page précédente
          </button>
        </div>

        <p className="text-xs text-muted/50 mt-10">
          Global Clean Tech · Thiès, Sénégal
        </p>
      </div>
    </main>
  )
}
