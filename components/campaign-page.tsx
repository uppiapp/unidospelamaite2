'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AlertTriangle, BadgeCheck, Check, ChevronDown, Clock3, Heart, Menu, Plus, ThumbsUp, User, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const supporters = [
  { initials: 'RJ', name: 'Renata J.', time: 'há 3 min', amount: 'R$50', text: 'Doação feita. Força, Maíte! Que família guerreira.', likes: 341 },
  { initials: 'SK', name: 'Sílvio K.', time: 'há 12 min', amount: 'R$50', text: 'Doei R$ 50 pelo tratamento. Não podem parar agora.', likes: 287 },
  { initials: 'TL', name: 'Tânia L.', time: 'há 18 min', amount: 'R$25', text: 'Compartilhei. Vamos ajudar essa pequena a continuar!', likes: 312 },
  { initials: 'VM', name: 'Vitor M.', time: 'há 31 min', amount: 'R$100', text: 'Que injustiça o que aconteceu. Torcendo muito por ela.', likes: 198 },
]

const realisticDonors = [
  { name: 'Lucas Gabriel Rocha', email: 'lucas.rocha92@gmail.com' },
  { name: 'Fernanda Lima Santos', email: 'fernanda.lima88@hotmail.com' },
  { name: 'Matheus Alves Oliveira', email: 'matheus.alves@outlook.com' },
  { name: 'Camila Ribeiro Souza', email: 'camila.ribeiro@gmail.com' },
  { name: 'Rodrigo Barbosa Mendes', email: 'rodrigo.mendes@gmail.com' },
  { name: 'Juliana Costa Ferreira', email: 'juliana.ferreira@hotmail.com' },
  { name: 'Thiago Martins Carvalho', email: 'thiago.carvalho@gmail.com' },
  { name: 'Beatriz Almeida Pereira', email: 'beatriz.almeida@outlook.com' },
]

function Logo() {
  return (
    <a href="#topo" className="flex items-center" aria-label="Campanha para Maíte — início">
      <Image
        src="/logo-maite.png"
        alt="Campanha para Maíte"
        width={170}
        height={57}
        priority
        className="h-auto w-40"
      />
    </a>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  return <header className="sticky top-0 z-40 border-b bg-background"><div className="mx-auto flex h-14 max-w-md items-center justify-between px-4"><Logo/><button type="button" onClick={() => setOpen(!open)} className="flex size-10 items-center justify-center rounded-lg border bg-card" aria-label={open ? 'Fechar menu' : 'Abrir menu'}>{open ? <X/> : <Menu/>}</button></div>{open && <nav className="mx-auto flex max-w-md flex-col border-t px-4 py-2"><a className="py-3" href="#sobre" onClick={()=>setOpen(false)}>Sobre</a><a className="py-3" href="#apoiadores" onClick={()=>setOpen(false)}>Quem ajudou</a></nav>}</header>
}

function DonateButton({ floating = false, onClick }: { floating?: boolean; onClick: () => void }) {
  const button = <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-extrabold text-primary-foreground shadow-sm"><Heart fill="currentColor" className="text-danger" aria-hidden="true"/> AJUDAR A MAÍTE AGORA</button>
  return floating ? <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl border bg-background p-3">{button}</div> : button
}

export function CampaignPage() {
  const [activeTab, setActiveTab] = useState<'sobre' | 'atualizacoes'>('sobre')
  const [donationOpen, setDonationOpen] = useState(false)
  const [showExitAppeal, setShowExitAppeal] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState(100)
  const [donationStep, setDonationStep] = useState<'amount' | 'donor_info' | 'loading' | 'checkout'>('amount')
  const [pixCopied, setPixCopied] = useState(false)
  const [likedComments, setLikedComments] = useState<string[]>([])

  // Dados reais de pessoa física e CPF 49556983015
  const [donorName, setDonorName] = useState('Lucas Gabriel Rocha')
  const [donorEmail, setDonorEmail] = useState('lucas.rocha92@gmail.com')
  const [donorCpf, setDonorCpf] = useState('495.569.830-15')

  // Resposta do PIX
  const [pixCode, setPixCode] = useState('')
  const [isMockPix, setIsMockPix] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!donationOpen || donationStep === 'checkout') return

    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [donationOpen, donationStep])

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  // Gera o PIX automaticamente ao clicar no valor (1 clique, sem digitar)
  const startDirectPixCheckout = async (amount: number, name = donorName, email = donorEmail, cpf = donorCpf) => {
    setSelectedAmount(amount)
    setErrorMessage(null)
    setDonationStep('loading')
    setPixCopied(false)

    // Seleciona um nome e e-mail de pessoa física real
    const randomPerson = realisticDonors[Math.floor(Math.random() * realisticDonors.length)]
    const currentName = name || randomPerson.name
    const currentEmail = email || randomPerson.email

    try {
      const res = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          name: currentName,
          email: currentEmail,
          cpf: cpf || '49556983015',
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Não foi possível gerar a chave PIX. Tente novamente.')
        setDonationStep('donor_info')
        return
      }

      setPixCode(data.pixCode)
      setIsMockPix(Boolean(data.isMock))
      setDonationStep('checkout')
    } catch (err) {
      console.error('Erro na requisição PIX:', err)
      setErrorMessage('Erro de conexão ao gerar PIX. Tente novamente.')
      setDonationStep('donor_info')
    }
  }

  const handleGeneratePixForm = (e: React.FormEvent) => {
    e.preventDefault()
    startDirectPixCheckout(selectedAmount, donorName, donorEmail, donorCpf)
  }

  const copyPixCode = async () => {
    if (!pixCode) return
    await navigator.clipboard.writeText(pixCode)
    setPixCopied(true)
    window.setTimeout(() => setPixCopied(false), 2000)
  }

  const selectTab = (tab: 'sobre' | 'atualizacoes') => {
    setActiveTab(tab)
    window.setTimeout(() => document.querySelector('#conteudo-campanha')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const openDonation = () => {
    setDonationStep('amount')
    setShowExitAppeal(false)
    setDonationOpen(true)
    setErrorMessage(null)
  }

  const requestCloseDonation = () => {
    if (donationStep === 'amount' && !showExitAppeal) {
      setShowExitAppeal(true)
      return
    }
    setDonationOpen(false)
    setShowExitAppeal(false)
    window.setTimeout(() => setDonationStep('amount'), 200)
  }

  const dismissDonation = () => {
    setDonationOpen(false)
    setShowExitAppeal(false)
    window.setTimeout(() => setDonationStep('amount'), 200)
  }

  return <div id="topo" className="min-h-screen bg-background pb-20"><Header/><main className="mx-auto max-w-md">
    <section className="flex flex-col items-center gap-4 px-4 pb-5 pt-6 text-center">
      <span className="rounded-full bg-accent px-4 py-2 text-sm font-extrabold tracking-wide text-primary">SAÚDE INFANTIL</span>
      <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight">Ajude Maíte, de 2 anos, a continuar seu tratamento</h1>
      <p className="text-lg leading-relaxed text-muted-foreground">Maíte precisa de cuidados todos os dias por causa de sequelas do parto. A família precisa de ajuda para manter o tratamento e dar a ela mais qualidade de vida.</p>
    </section>

    <section className="mx-4 overflow-hidden rounded-xl bg-card shadow-md">
      <div className="relative">
        <Image src="/maite-campaign.webp" alt="Maíte e sua mãe" width={940} height={788} priority className="w-full"/>
        <Image
          src="/maite-watermark.png"
          alt=""
          width={1200}
          height={407}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-3 h-auto w-32 opacity-35"
        />
      </div>
      <div className="flex flex-col gap-1 px-4 py-3 text-sm"><p className="flex items-center gap-2"><Heart/> Vaquinha de <strong>Maíte</strong> <BadgeCheck className="size-4 fill-blue-500 text-background" aria-label="Campanha verificada"/></p><p className="flex items-center gap-2"><Clock3/> Criada em 07/08/2026</p></div>
    </section>

    <section className="mx-4 mt-5 rounded-xl border bg-card p-5 shadow-sm"><div className="flex justify-between text-xs font-bold tracking-widest text-muted-foreground"><span>PROGRESSO</span><span className="text-primary">20%</span></div><div className="my-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/5 rounded-full bg-primary"/></div><p><strong className="text-2xl text-primary">R$ 9.915</strong> <span className="text-muted-foreground">de R$ 50.000</span></p></section>

    <nav aria-label="Conteúdo da campanha" className="mx-4 mt-9 grid grid-cols-3 overflow-hidden rounded-xl border bg-card text-center text-base text-muted-foreground">
      <button type="button" onClick={() => selectTab('sobre')} className={`rounded-full px-2 py-2 ${activeTab === 'sobre' ? 'bg-background font-bold text-foreground shadow-sm' : ''}`}>Sobre</button>
      <button type="button" onClick={() => selectTab('atualizacoes')} className={`rounded-full px-2 py-2 ${activeTab === 'atualizacoes' ? 'bg-background font-bold text-foreground shadow-sm' : ''}`}>Atualizações (3)</button>
      <a className="rounded-full px-2 py-2" href="#apoiadores">Quem ajudou</a>
    </nav>

    <div id="conteudo-campanha" className="scroll-mt-20">
    {activeTab === 'sobre' ? <article id="sobre" className="flex flex-col gap-6 px-4 py-7 text-lg leading-relaxed text-muted-foreground"><div className="flex items-center gap-4"><span className="h-px flex-1 bg-border"/><span className="flex size-8 items-center justify-center rounded-full bg-accent text-primary"><ChevronDown/></span><span className="h-px flex-1 bg-border"/></div><h2 className="text-balance text-center text-2xl font-extrabold leading-tight text-foreground">A história de Maíte</h2><p>Maíte tem 2 anos. Desde o nascimento, ela convive com sequelas do parto e precisa de tratamentos, consultas e cuidados constantes.</p><p>Cada pequena conquista exige muito esforço. O tratamento ajuda Maíte a se desenvolver e traz esperança para toda a família.</p><p>A família faz tudo o que pode, mas os custos são altos. Agora, precisa do nosso apoio para que os cuidados não sejam interrompidos.</p>
      <div className="flex items-center gap-4"><span className="h-px flex-1 bg-border"/><span className="flex size-8 items-center justify-center rounded-full bg-accent text-primary"><ChevronDown/></span><span className="h-px flex-1 bg-border"/></div><h2 className="text-balance text-center text-2xl font-extrabold leading-tight text-foreground">Como sua doação ajuda</h2><p>O dinheiro arrecadado será usado no tratamento de Maíte e nas despesas de cuidado da família.</p><p className="font-bold text-foreground">Sua doação ajuda a pagar:</p><ul className="flex flex-col text-base">{['Tratamento e terapias contínuas','Consultas e acompanhamento especializado','Custos dos cuidados diários','Alívio das dificuldades financeiras da família'].map(item=><li key={item} className="flex items-center gap-3 border-b py-2"><Check className="text-primary"/>{item}</li>)}</ul><h2 className="text-center text-2xl font-extrabold leading-tight text-foreground">Ajude Maíte a continuar o tratamento</h2><p>Doe qualquer valor pelo botão abaixo. Se não puder doar, compartilhe esta campanha com outras pessoas.</p><div className="mx-auto w-full max-w-xs"><DonateButton onClick={openDonation}/></div>
    </article> : <section className="flex flex-col gap-4 px-4 py-7">
      <div className="flex items-end justify-between gap-3"><h2 className="text-[22px] font-extrabold text-foreground">Atualizações da Campanha</h2><span className="shrink-0 pb-1 text-sm text-muted-foreground">3 atualizações</span></div>
      {[
        { date: '10 de agosto de 2026', title: 'Maíte precisa manter o tratamento', text: 'Seguimos arrecadando para que os cuidados não sejam interrompidos — interromper o tratamento não é uma opção.' },
        { date: '8 de agosto de 2026', title: 'Primeiras doações recebidas', text: 'Graças aos doadores, já iniciamos o apoio ao tratamento da Maíte. Seguimos firmes pela meta!' },
        { date: '7 de agosto de 2026', title: 'Campanha iniciada', text: 'Iniciamos a arrecadação para o tratamento da Maíte. Meta de R$ 50.000.' },
      ].map((update) => <article key={update.title} className="overflow-hidden rounded-xl border bg-card p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><time className="text-sm font-bold text-muted-foreground">{update.date}</time><span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">Atualização</span></div><h3 className="mt-4 text-lg font-extrabold text-foreground">{update.title}</h3><p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">{update.text}</p><a href="#topo" className="mt-5 flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-extrabold text-primary-foreground">Ajudar a Maíte agora</a></article>)}
    </section>}
    </div>

    <section id="apoiadores" className="mx-4 mb-12 mt-5 scroll-mt-20 overflow-hidden rounded-xl border-t-4 border-primary bg-card px-4 py-5 shadow-md"><div className="mb-6 text-center"><div className="mb-3 flex justify-center -space-x-3"><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-PpPkLmIjWtQQfFlYn3JD0vNt7u65vx.png" alt="Apoiadora sorrindo dentro de um carro" className="size-8 rounded-full border-2 border-card object-cover"/><span className="size-8 rounded-full border-2 border-card bg-red-500"/><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4fifIfngXBYQF1DYNnLLbNY36Ltqe9.png" alt="Apoiadora usando jaqueta jeans" className="size-8 rounded-full border-2 border-card object-cover"/><span className="size-8 rounded-full border-2 border-card bg-pink-500"/><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-5ev8NgPcPPgOqWif8Zmog3gIWxjaWX.png" alt="Apoiadora sorrindo com blusa cinza" className="size-8 rounded-full border-2 border-card object-cover"/><span className="flex size-8 items-center justify-center rounded-full border-2 border-card bg-muted text-base font-extrabold leading-none text-muted-foreground">+</span></div><h2 className="text-lg font-extrabold">396 pessoas já apoiaram a Maíte</h2></div><div className="flex flex-col">{supporters.map((person, index)=><article key={person.name} className="flex gap-3 border-b py-5"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-extrabold text-primary">{person.initials}</span><div className="flex min-w-0 flex-1 flex-col gap-2"><div className="flex items-center gap-1 text-sm"><strong>{person.name}</strong>{index !== supporters.length - 1 && <span className={index === 1 ? 'animate-pulse text-primary' : 'text-primary'} aria-label={index === 1 ? 'Online agora' : undefined}>●</span>}<span className="text-muted-foreground">{person.time}</span><span className="ml-auto rounded-full bg-accent px-2 text-primary">{person.amount}</span></div><p className="text-[15px] leading-snug text-muted-foreground">{person.text}</p><button type="button" aria-pressed={likedComments.includes(person.name)} onClick={() => setLikedComments((current) => current.includes(person.name) ? current.filter((name) => name !== person.name) : [...current, person.name])} className={`flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 text-sm font-bold ${likedComments.includes(person.name) ? 'bg-accent text-primary' : 'text-muted-foreground'}`}><ThumbsUp className={`size-5 ${likedComments.includes(person.name) ? 'fill-current' : ''}`}/><span>{person.likes + (likedComments.includes(person.name) ? 1 : 0)} Curtir</span></button></div></article>)}</div><p className="py-4 text-center text-xs italic text-muted-foreground">Você precisa estar logado para comentar.</p></section>
  </main>
  <footer className="bg-foreground text-background">
    <div className="mx-auto grid max-w-md grid-cols-2 gap-x-6 gap-y-10 px-6 py-10 text-base">
      <nav aria-labelledby="footer-platform">
        <h2 id="footer-platform" className="font-extrabold text-accent">PLATAFORMA</h2>
        <ul className="mt-4 flex flex-col gap-3 leading-relaxed text-background/80">
          <li><a href="#sobre">Sobre nós</a></li><li><a href="#topo">Campanhas</a></li><li><a href="#topo">Criar campanha</a></li><li><a href="#topo">Entrar</a></li>
        </ul>
      </nav>
      <nav aria-labelledby="footer-support">
        <h2 id="footer-support" className="font-extrabold text-accent">SUPORTE</h2>
        <ul className="mt-4 flex flex-col gap-3 leading-relaxed text-background/80">
          <li><a href="#topo">FAQ</a></li><li><a href="#topo">Taxas e prazos</a></li><li><a href="#topo">Segurança e transparência</a></li><li><a href="#topo">Consultar recibo</a></li>
        </ul>
      </nav>
      <nav aria-labelledby="footer-legal" className="col-span-2">
        <h2 id="footer-legal" className="font-extrabold text-accent">LEGAL</h2>
        <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 leading-relaxed text-background/80">
          <li><a href="#topo">Política de privacidade</a></li><li><a href="#topo">Termos de uso</a></li><li><a href="#topo">Campanhas mais amadas</a></li><li><a href="#topo">Loja de corações</a></li>
        </ul>
      </nav>
      <div className="col-span-2 flex justify-center border-t border-background/20 pt-5">
        <Image
          src="/trust-badges-transparent.png"
          alt="Selos de segurança, transparência e compromisso"
          width={1775}
          height={887}
          className="h-auto w-32 opacity-60"
        />
      </div>
      <p className="col-span-2 text-center text-sm text-background/60">© 2026 · Todos os direitos reservados</p>
    </div>
  </footer><DonateButton floating onClick={openDonation}/>
  {donationOpen && <div role="dialog" aria-modal="true" aria-labelledby="donation-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/60 p-5 backdrop-blur-sm" onClick={requestCloseDonation}>
    <section className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl sm:p-8" onClick={(event) => event.stopPropagation()}>
      {donationStep === 'amount' && (
        showExitAppeal ? <>
          <div className="relative text-center">
            <button type="button" aria-label="Fechar sem doar" onClick={dismissDonation} className="absolute -right-1 -top-1 z-10 flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground"><X/></button>
            <Image src="/logo-maite.png" alt="Campanha para Maíte" width={170} height={57} className="mx-auto h-auto w-28" />
            <div className="relative mx-auto mt-4 max-w-xs overflow-hidden rounded-xl">
              <Image src="/maite-campaign.webp" alt="Maíte com sua mãe" width={940} height={788} className="h-36 w-full object-cover object-center" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-danger px-3 py-2 text-sm font-extrabold uppercase tracking-wide text-primary-foreground">
                <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
                Ajuda urgente
              </div>
            </div>
            <h2 id="donation-title" className="mx-auto mt-4 max-w-xs text-balance text-2xl font-extrabold leading-tight text-danger">Alerta: a Maíte precisa de ajuda agora</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">O tratamento da Maíte não pode parar. Sua doação, de qualquer valor, ajuda a garantir a continuidade dos cuidados que ela precisa.</p>
            <p className="mt-3 text-balance font-extrabold">Escolha um valor e faça parte dessa luta.</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">{[20,50,70,100].map((amount) => <button key={amount} type="button" onClick={() => startDirectPixCheckout(amount)} className={`relative min-h-14 rounded-xl border-2 border-primary text-lg font-extrabold ${amount === 100 ? 'bg-primary text-primary-foreground' : 'bg-card text-primary'}`}>{amount === 100 && <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-foreground px-2 py-1 text-[9px] tracking-wider text-background"><Heart className="fill-danger text-danger"/> MAIS ESCOLHIDO</span>}R${amount}</button>)}</div>
          <button type="button" onClick={() => setShowExitAppeal(false)} className="mt-3 min-h-12 w-full rounded-xl border font-bold text-primary">Escolher outro valor</button>
          <button type="button" onClick={dismissDonation} className="mt-3 w-full py-2 text-sm text-muted-foreground underline underline-offset-4">Sair sem doar</button>
        </> : <>
          <div className="relative text-center"><button type="button" aria-label="Fechar" onClick={requestCloseDonation} className="absolute -right-1 -top-1 flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground"><X/></button><h2 id="donation-title" className="mx-auto max-w-64 text-balance text-2xl font-extrabold leading-tight">Quanto você consegue hoje? <Heart className="inline size-7 text-warning" fill="currentColor"/></h2><p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Cada valor ajuda a Maíte</p></div>
          <div className="mt-6 grid grid-cols-2 gap-2">{[30,50,70,100,150,200,300,500,700,1000,1500,2000].map((amount) => <button key={amount} type="button" onClick={() => startDirectPixCheckout(amount)} className={`relative min-h-14 rounded-xl border-2 border-primary text-lg font-extrabold ${amount === 100 ? 'bg-primary text-primary-foreground' : 'bg-card text-primary'}`}>{amount === 100 && <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-foreground px-3 py-1 text-[9px] tracking-widest text-background"><Heart className="fill-danger text-danger"/> MAIS ESCOLHIDO</span>}R${amount.toLocaleString('pt-BR')}</button>)}</div>
        </>
      )}

      {donationStep === 'donor_info' && (
        <form onSubmit={handleGeneratePixForm} className="relative flex flex-col gap-4">
          <button type="button" aria-label="Fechar" onClick={requestCloseDonation} className="absolute -right-1 -top-1 flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground"><X/></button>
          <div className="text-center">
            <h2 id="donation-title" className="text-xl font-extrabold">Identificação do Doador</h2>
            <p className="mt-1 text-sm text-muted-foreground">Você escolheu doar <strong className="text-primary">R$ {selectedAmount.toLocaleString('pt-BR')},00</strong></p>
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-danger/10 p-3 text-center text-sm font-bold text-danger">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-2">
            <div>
              <label htmlFor="donorName" className="block text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-1">Nome Completo</label>
              <input
                id="donorName"
                type="text"
                required
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full rounded-xl border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="donorEmail" className="block text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-1">E-mail</label>
              <input
                id="donorEmail"
                type="email"
                required
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="w-full rounded-xl border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="donorCpf" className="block text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-1">CPF</label>
              <input
                id="donorCpf"
                type="text"
                required
                value={donorCpf}
                onChange={(e) => setDonorCpf(formatCpf(e.target.value))}
                maxLength={14}
                className="w-full rounded-xl border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 flex min-h-14 w-full items-center justify-center rounded-xl bg-primary px-5 font-extrabold text-primary-foreground shadow-sm"
          >
            GERAR CHAVE PIX DE R$ {selectedAmount.toLocaleString('pt-BR')}
          </button>

          <button
            type="button"
            onClick={() => setDonationStep('amount')}
            className="w-full text-center text-sm font-bold text-muted-foreground underline underline-offset-4"
          >
            Alterar valor da doação
          </button>
        </form>
      )}

      {donationStep === 'loading' && (
        <div className="relative flex flex-col items-center py-8 text-center">
          <span className="size-12 animate-spin rounded-full border-4 border-muted border-t-primary" role="status" aria-label="Gerando cobrança PIX"/>
          <p className="mt-4 font-extrabold text-foreground">Gerando cobrança PIX...</p>
          <p className="mt-1 text-sm text-muted-foreground">Por favor, aguarde alguns instantes.</p>
        </div>
      )}

      {donationStep === 'checkout' && (
        <>
          <div className="relative flex flex-col items-center text-center">
            <button type="button" aria-label="Fechar" onClick={requestCloseDonation} className="absolute -right-1 -top-1 flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground"><X/></button>
            <Image src="/logo-maite.png" alt="Campanha para Maíte" width={1775} height={887} className="h-auto w-28" priority />
            
            {isMockPix && (
              <span className="mt-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                Modo Demonstração
              </span>
            )}

            <h2 id="donation-title" className="mt-4 text-balance text-xl font-extrabold leading-tight">Você é a nossa última esperança <Heart className="inline fill-danger text-danger"/></h2>
            <p className="mt-2 text-sm text-muted-foreground">Finalize o pagamento abaixo para confirmar sua doação!</p>
            <p className="mt-4 text-lg">Valor total: <strong className="text-primary">R$ {selectedAmount.toLocaleString('pt-BR')},00</strong></p>
          </div>

          <p className="mx-auto mt-6 max-w-xs text-center text-base leading-relaxed text-muted-foreground">Escaneie o QR Code ou copie o código Pix abaixo para finalizar o pagamento.</p>
          
          <div className="mx-auto mt-4 flex w-fit rounded-xl border bg-card p-4 shadow-sm">
            <QRCodeSVG value={pixCode} size={180} level="H" bgColor="transparent" fgColor="currentColor" className="size-[180px] shrink-0" aria-label={`QR Code para doação de R$ ${selectedAmount}`} />
          </div>
          
          <div className="my-6 flex items-center gap-4 text-sm text-muted-foreground"><span className="h-px flex-1 bg-border"/><span>ou</span><span className="h-px flex-1 bg-border"/></div>
          
          <p className="truncate rounded-xl border bg-card px-3 py-2 text-sm select-all font-mono" title={pixCode}>{pixCode}</p>
          
          <button type="button" onClick={copyPixCode} className="mt-2 flex min-h-14 w-full items-center justify-center rounded-xl bg-primary px-5 font-extrabold text-primary-foreground">
            {pixCopied ? 'CÓDIGO PIX COPIADO!' : 'COPIAR CÓDIGO PIX'}
          </button>

          <div className="mt-6 rounded-xl bg-secondary p-4">
            <h3 className="text-center font-extrabold">Como pagar?</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted"><Plus aria-hidden="true"/></span><span>Escaneie o QR Code ou copie e cole o código Pix em seu app bancário ou carteira digital.</span></p>
              <p className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted"><Check aria-hidden="true"/></span><span>Seu pagamento será aprovado em alguns instantes.</span></p>
            </div>
          </div>
        </>
      )}
    </section>
  </div>}
  </div>
}
