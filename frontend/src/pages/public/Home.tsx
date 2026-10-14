import React from 'react'
import Hero from '../../components/sections/Hero'
import Services from '../../components/sections/Services'
import PourquoiNous from '../../components/sections/PourquoiNous'
import Temoignages from '../../components/sections/Temoignages'
import FormCandidats from '../../components/sections/FormCandidats'
import FormClients from '../../components/sections/FormClients'
import Contact from '../../components/sections/Contact'
import PubBanner from '../../components/pub/PubBanner'

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <PubBanner />
      <PourquoiNous />
      <Temoignages />
      <FormCandidats />
      <FormClients />
      <Contact />
    </>
  )
}
