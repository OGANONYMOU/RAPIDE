import Link from 'next/link';
import {
  ArrowRight,
  Bike,
  Car,
  CheckCircle2,
  Clock3,
  Globe2,
  MapPinned,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
  Zap,
} from 'lucide-react';

const serviceCards = [
  {
    icon: Bike,
    title: 'Express urbain',
    description: 'Courses rapides, documents urgents et petits colis en centre-ville.',
    price: 'Des 500 XOF',
  },
  {
    icon: Car,
    title: 'Livraison business',
    description: 'Pour boutiques, restaurants et equipes operationnelles qui ont besoin de fiabilite.',
    price: 'Des 1 000 XOF',
  },
  {
    icon: Truck,
    title: 'Charges volumineuses',
    description: 'Fourgonnettes et camions disponibles pour les marchandises plus lourdes.',
    price: 'Des 2 000 XOF',
  },
];

const launchStats = [
  { value: '30 min', label: 'Delai express moyen' },
  { value: '4.9/5', label: 'Satisfaction clients' },
  { value: '24/7', label: 'Disponibilite service' },
  { value: 'Live', label: 'Suivi temps reel' },
];

const trustPoints = [
  'Paiement securise et portefeuille integre',
  'Dispatch temps reel avec suivi chauffeur',
  'Espace client, chauffeur et admin dans une meme plateforme',
];

const steps = [
  {
    index: '01',
    title: 'Creez la course',
    description: 'Adresse de depart, destination, type de colis et mode de paiement en quelques gestes.',
  },
  {
    index: '02',
    title: 'Dispatch intelligent',
    description: 'Le bon chauffeur recoit la mission selon vehicule, disponibilite et zone de service.',
  },
  {
    index: '03',
    title: 'Execution suivie',
    description: 'Le client, le chauffeur et l equipe voient le meme statut en direct du debut a la livraison.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen text-surface-900">
      <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top,rgba(20,154,133,0.22),transparent_55%)]" />

      <nav className="sticky top-0 z-50 border-b border-white/55 glass">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500 shadow-card">
              <Zap className="h-5 w-5 text-white" fill="white" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-surface-900">Rapide</p>
              <p className="text-xs uppercase tracking-[0.24em] text-surface-400">Launch-ready delivery</p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link href="#services" className="btn-ghost text-sm">Services</Link>
            <Link href="#operations" className="btn-ghost text-sm">Operations</Link>
            <Link href="#pricing" className="btn-ghost text-sm">Tarifs</Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary px-4 py-2 text-sm">Connexion</Link>
            <Link href="/register" className="btn-primary px-4 py-2 text-sm">Demarrer</Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-3xl">
              <span className="section-kicker">
                <Sparkles className="h-3.5 w-3.5" />
                Moderne, propre, pret pour le lancement
              </span>

              <h1 className="mt-6 font-display text-5xl font-bold leading-[0.96] tracking-tight text-surface-950 sm:text-6xl lg:text-7xl">
                La plateforme logistique la plus nette pour livrer vite au Benin.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-surface-600 sm:text-xl">
                Rapide reunit marketing, commande, dispatch, suivi et operations dans une experience
                unique. L interface reste legere, professionnelle et claire pendant que le backend
                gere les commandes, le pricing, le wallet et le temps reel.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="btn-primary flex items-center justify-center gap-2 px-7 py-3.5 text-base">
                  Lancer une livraison <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/register?role=driver" className="btn-secondary flex items-center justify-center gap-2 px-7 py-3.5 text-base">
                  Devenir chauffeur
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {trustPoints.map((point) => (
                  <div key={point} className="surface-panel p-4">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-6 text-surface-600">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(20,154,133,0.24),transparent_55%)] blur-2xl" />
              <div className="surface-panel relative overflow-hidden p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-surface-400">Operations live</p>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-surface-950">
                      Un produit qui rassure des la premiere visite
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-primary-50 px-3 py-2 text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary-700">Coverage</p>
                    <p className="font-display text-lg font-bold text-primary-900">Cotonou + Porto-Novo</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] bg-surface-900 p-4 text-white shadow-card-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-surface-400">Commande active</p>
                        <p className="mt-2 font-display text-2xl font-bold">#RPD-24018</p>
                      </div>
                      <div className="rounded-2xl bg-primary-500/20 p-3 text-primary-200">
                        <Package className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-5 space-y-3 text-sm text-surface-300">
                      <div className="flex items-center justify-between">
                        <span>Depart</span>
                        <span className="font-medium text-white">Ganhi, Cotonou</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Destination</span>
                        <span className="font-medium text-white">Cadjehoun</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ETA</span>
                        <span className="font-medium text-primary-200">18 min</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-primary-100 bg-primary-50/90 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-primary-700">Tableau de bord</p>
                        <p className="mt-2 font-display text-2xl font-bold text-surface-950">1 284</p>
                        <p className="text-sm text-surface-600">livraisons ce mois</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 text-primary-700 shadow-card">
                        <Globe2 className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-5 space-y-2">
                      {[
                        ['Clients actifs', '428'],
                        ['Chauffeurs verifies', '73'],
                        ['Tickets ouverts', '06'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 text-sm">
                          <span className="text-surface-500">{label}</span>
                          <span className="font-semibold text-surface-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.4rem] border border-white/80 bg-white/90 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-surface-400">Execution</p>
                      <p className="font-display text-lg font-bold tracking-tight text-surface-950">Parcours operationnel</p>
                    </div>
                    <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-semibold text-success-dark">
                      systeme en ligne
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      ['Commande creee', '08:42', MapPinned],
                      ['Chauffeur assigne', '08:45', Bike],
                      ['Paiement confirme', '08:46', Wallet],
                    ].map(([label, time, Icon]) => {
                      const TimelineIcon = Icon as typeof Bike;
                      return (
                        <div key={label} className="flex items-center gap-3 rounded-2xl bg-surface-50 px-3 py-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-card">
                            <TimelineIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-surface-900">{label}</p>
                            <p className="text-xs text-surface-500">Synchronise entre frontend et backend</p>
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-surface-400">{time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-6 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {launchStats.map((stat) => (
              <div key={stat.label} className="surface-panel p-5">
                <p className="font-display text-3xl font-bold tracking-tight text-surface-950">{stat.value}</p>
                <p className="mt-2 text-sm text-surface-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="services" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <span className="section-kicker">Services</span>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-surface-950 sm:text-5xl">
                Une offre claire pour particuliers, commerces et operations plus lourdes.
              </h2>
              <p className="mt-4 text-lg leading-8 text-surface-600">
                Le produit met en avant ce qui compte pour le lancement: vitesse, lisibilite, confiance
                et une hierarchie visuelle qui ne fatigue pas.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {serviceCards.map(({ icon: Icon, title, description, price }) => (
                <div key={title} className="card-hover p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold tracking-tight text-surface-950">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-surface-600">{description}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-surface-200/70 pt-4">
                    <span className="text-sm text-surface-500">Tarification de depart</span>
                    <span className="font-semibold text-primary-700">{price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="operations" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-surface-950 px-6 py-10 text-white shadow-card-lg sm:px-10 lg:px-12">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-200">
                  Operations
                </span>
                <h2 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  Un flux propre, lisible et credible pour une mise en ligne.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-surface-300">
                  L application montre tout de suite comment la plateforme travaille: creation de commande,
                  assignation chauffeur, suivi, administration et monetisation.
                </p>
              </div>

              <div className="grid gap-4">
                {steps.map((step) => (
                  <div key={step.index} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                      <div className="font-display text-4xl font-bold leading-none text-primary-300">{step.index}</div>
                      <div>
                        <h3 className="font-display text-xl font-bold tracking-tight text-white">{step.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-surface-300">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 pb-20 pt-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="surface-panel overflow-hidden p-8 sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="max-w-3xl">
                  <span className="section-kicker">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Pret pour la mise en marche
                  </span>
                  <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-surface-950 sm:text-5xl">
                    Une presentation plus mature, plus premium et plus rassurante pour vos premiers clients.
                  </h2>
                  <p className="mt-4 text-lg leading-8 text-surface-600">
                    Le frontend et le backend sont relies dans le monorepo avec un point d entree clair,
                    un design plus moderne et une base visuelle plus professionnelle pour aller vers un lancement propre.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link href="/register" className="btn-primary flex items-center justify-center gap-2 px-7 py-3.5 text-base">
                    Creer un compte <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/login" className="btn-secondary flex items-center justify-center gap-2 px-7 py-3.5 text-base">
                    Acceder au tableau de bord
                  </Link>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  { icon: Clock3, label: 'Delais rapides', text: 'Promesse claire et facile a comprendre des la homepage.' },
                  { icon: MapPinned, label: 'Suivi visible', text: 'Le produit met en avant la transparence et la confiance operationnelle.' },
                  { icon: Sparkles, label: 'Look plus premium', text: 'Palette plus froide, typographie plus forte et cartes plus aeriennes.' },
                ].map(({ icon: Icon, label, text }) => (
                  <div key={label} className="rounded-[1.4rem] bg-surface-50 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-card">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-surface-950">{label}</h3>
                    <p className="mt-2 text-sm leading-7 text-surface-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
