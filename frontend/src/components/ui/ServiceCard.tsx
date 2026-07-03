import React from 'react'

interface ServiceCardProps {
  icon: React.ReactNode
  title: string
  description: string
  accent?: boolean
}

export default function ServiceCard({ icon, title, description, accent }: ServiceCardProps) {
  return (
    <div
      className={`group p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default ${
        accent
          ? 'bg-primary text-white border-primary'
          : 'bg-white border-gray-100 hover:border-primary-light'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
          accent ? 'bg-white/20' : 'bg-primary-light group-hover:bg-primary group-hover:text-white'
        }`}
      >
        <span className={accent ? 'text-white' : 'text-primary group-hover:text-white'}>
          {icon}
        </span>
      </div>
      <h3 className={`font-semibold text-lg mb-2 font-display ${accent ? 'text-white' : 'text-dark'}`}>
        {title}
      </h3>
      <p className={`text-sm leading-relaxed ${accent ? 'text-white/80' : 'text-muted'}`}>
        {description}
      </p>
    </div>
  )
}
