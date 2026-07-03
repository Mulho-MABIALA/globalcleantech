import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Link } from 'react-router-dom'

type ContentMap = Record<string, string>

function useAboutContent() {
  return useQuery<ContentMap>({
    queryKey: ['public-content'],
    queryFn: async () => { const { data } = await api.get('/public/content'); return data },
    staleTime: 5 * 60 * 1000,
  })
}

function c(map: ContentMap | undefined, key: string, fallback: string) {
  return map?.[key] ?? fallback
}

const TIMELINE = [
  { year: '2019', titre: 'Fondation', desc: 'Création de Global Clean Tech à Thiès par une équipe locale passionnée par les services de proximité.', color: 'bg-emerald-500' },
  { year: '2020', titre: 'Premiers placements', desc: 'Lancement du service de placement de personnel domestique — femmes de ménage, nounous, cuisiniers.', color: 'bg-blue-500' },
  { year: '2021', titre: 'Expansion des services', desc: 'Ajout des services d\'impression, photocopie et communication. Plus de 100 clients satisfaits.', color: 'bg-purple-500' },
  { year: '2022', titre: 'Transfert d\'argent', desc: 'Ouverture du service de transfert d\'argent sécurisé pour particuliers et entreprises.', color: 'bg-amber-500' },
  { year: '2023', titre: '300+ placements', desc: 'Franchissement du cap des 300 placements réussis. Développement du réseau de partenaires.', color: 'bg-rose-500' },
  { year: '2024+', titre: 'Croissance continue', desc: 'Digitalisation des services, nouvelle plateforme en ligne et objectif de 1000 placements.', color: 'bg-teal-500' },
]

const VALEUR_ICONS = [
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>,
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
]

const VALEUR_COLORS = ['emerald', 'amber', 'blue']

export default function About() {
  const { data } = useAboutContent()

  const valeurs = [
    { titre: c(data, 'about_valeur_1_titre', 'Intégrité'), desc: c(data, 'about_valeur_1_desc', 'Transparence et honnêteté dans chaque transaction et chaque placement.') },
    { titre: c(data, 'about_valeur_2_titre', 'Excellence'), desc: c(data, 'about_valeur_2_desc', 'Sélection rigoureuse et accompagnement continu de nos candidats.') },
    { titre: c(data, 'about_valeur_3_titre', 'Proximité'), desc: c(data, 'about_valeur_3_desc', "Une équipe locale disponible, à votre écoute, ancrée dans la réalité de Thiès.") },
  ]

  const stats = [
    { num: c(data, 'about_stat_placements', '500+'), label: 'Placements réalisés' },
    { num: c(data, 'about_stat_clients', '150+'), label: 'Clients fidèles' },
    { num: c(data, 'about_stat_annees', '5+'), label: "Années d'expérience" },
    { num: c(data, 'about_stat_services', '6'), label: 'Services proposés' },
  ]

  return (
    <main>
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-dark via-[#0d2318] to-dark py-14 sm:py-20 lg:py-24 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%,rgba(26,127,75,0.25) 0%,transparent 60%)' }} />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center relative">
          <span className="inline-flex items-center gap-2 bg-primary/15 border border-primary/25 text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />À propos
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black font-display leading-tight mb-6">
            Global Clean Tech,<br />
            <span className="text-primary italic">au cœur de Thiès</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {c(data, 'about_titre', 'Votre partenaire de confiance depuis plus de 5 ans à Thiès, Sénégal.')}
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-primary font-display">{s.num}</div>
              <div className="text-sm text-muted mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Histoire ── */}
      <section className="py-20 bg-surface">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
            <div>
              <span className="text-primary font-bold text-xs uppercase tracking-widest">Notre histoire</span>
              <h2 className="text-3xl sm:text-4xl font-black font-display text-dark mt-2 mb-6">
                {c(data, 'about_histoire_titre', 'Qui sommes-nous ?')}
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                {c(data, 'about_histoire_p1', "Global Clean Tech est une entreprise multiservices basée à Thiès, au Sénégal.")}
              </p>
              <p className="text-muted leading-relaxed mb-8">
                {c(data, 'about_histoire_p2', "Au fil des années, nous avons élargi notre offre pour mieux servir nos clients.")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/postuler" className="btn-primary text-sm py-2.5 px-5">Postuler</Link>
                <a href="/#clients" className="btn-ghost text-sm py-2.5 px-5">Faire une demande</a>
              </div>
            </div>

            {/* Photo équipe */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=800&q=80"
                  alt="Équipe Global Clean Tech"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark/40 to-transparent" />
              </div>
              <div className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-gray-100">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-dark">Thiès, Sénégal</p>
                  <p className="text-[11px] text-muted">Depuis 2019</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <span className="section-tag mb-3">Notre parcours</span>
            <h2 className="section-title mt-3">5 ans de croissance</h2>
          </div>

          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/30 to-transparent -translate-x-1/2" />

            <div className="space-y-10">
              {TIMELINE.map((item, i) => (
                <div key={item.year} className={`relative flex gap-6 sm:gap-0 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                  {/* Dot */}
                  <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 z-10 top-5">
                    <div className={`w-4 h-4 rounded-full ${item.color} ring-4 ring-white shadow-lg`} />
                  </div>

                  {/* Année */}
                  <div className={`hidden sm:flex w-1/2 items-center ${i % 2 === 0 ? 'justify-end pr-10' : 'justify-start pl-10'}`}>
                    <span className={`text-2xl font-black font-display text-transparent bg-clip-text bg-gradient-to-br from-${item.color.replace('bg-', '')} to-${item.color.replace('bg-', '')}/50`}
                      style={{ WebkitTextStroke: '1px currentColor' }}>
                      {item.year}
                    </span>
                  </div>

                  {/* Carte */}
                  <div className={`sm:w-1/2 pl-14 sm:pl-0 ${i % 2 === 0 ? 'sm:pl-10' : 'sm:pr-10'}`}>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${item.color}`}>{item.year}</span>
                        <h3 className="font-bold text-dark font-display">{item.titre}</h3>
                      </div>
                      <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Valeurs ── */}
      <section className="py-20 bg-surface">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <span className="section-tag mb-3">Ce qui nous guide</span>
            <h2 className="section-title mt-3">Nos valeurs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {valeurs.map((v, i) => (
              <div key={v.titre} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center group">
                <div className={`w-14 h-14 bg-${VALEUR_COLORS[i]}-50 text-${VALEUR_COLORS[i]}-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <span className="w-7 h-7">{VALEUR_ICONS[i]}</span>
                </div>
                <h3 className="font-bold text-dark font-display mb-2">{v.titre}</h3>
                <p className="text-sm text-muted leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA bas ── */}
      <section className="py-16 bg-primary">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white font-display mb-4">Prêt à travailler avec nous ?</h2>
          <p className="text-white/70 mb-8">Rejoignez nos centaines de clients satisfaits à Thiès et dans la région.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/postuler" className="bg-white text-primary font-bold px-7 py-3.5 rounded-xl hover:bg-primary-light transition-colors text-sm">Je postule</Link>
            <a href="/#contact" className="bg-white/15 border border-white/30 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-white/25 transition-colors text-sm">Nous contacter</a>
          </div>
        </div>
      </section>
    </main>
  )
}


