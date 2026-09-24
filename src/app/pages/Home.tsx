import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Users, GraduationCap, Globe, Handshake, ChevronRight, Play, Loader2,
  UserPlus, BookOpen, FileText, Briefcase, Landmark, PhoneCall, MapPin, Mail, Phone, MessageCircle,
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { api, ApiError } from '../../lib/api';
import { Actualite } from '../admin/types';

// Reprend 4 des grandes rubriques du site (voir le sitemap validé).
const axes = [
  {
    title: "Services consulaires",
    to: "/services",
    icon: <Users className="w-8 h-8" />,
    desc: "Registre consulaire, carte consulaire, laissez-passer et informations pratiques.",
    color: "from-brand-gold-400 to-orange-500",
    bg: "bg-brand-gold-50"
  },
  {
    title: "Diplomatie économique",
    to: "/congo-benin",
    icon: <Handshake className="w-8 h-8" />,
    desc: "Relations Congo–Bénin, coopération et opportunités d'affaires.",
    color: "from-brand-green-400 to-brand-green-600",
    bg: "bg-brand-green-50"
  },
  {
    title: "Culture & Patrimoine",
    to: "/culture",
    icon: <Globe className="w-8 h-8" />,
    desc: "Histoire, musique, danse et littérature congolaises.",
    color: "from-brand-gold-400 to-brand-gold-600",
    bg: "bg-brand-gold-50"
  },
  {
    title: "Diaspora",
    to: "/diaspora",
    icon: <GraduationCap className="w-8 h-8" />,
    desc: "Vie de la communauté congolaise au Bénin et ses talents.",
    color: "from-brand-red-400 to-brand-red-600",
    bg: "bg-brand-red-50"
  }
];

// "Comment pouvons-nous vous aider ?" — 6 entrées du document d'architecture.
// Les liens pointent vers les pages qui existent aujourd'hui ; les entrées
// marquées TODO seront redirigées quand les pages du sitemap seront créées.
const besoins = [
  {
    title: "Je suis Congolais(e) au Bénin",
    desc: "M'inscrire au registre consulaire et créer mon espace.",
    icon: <UserPlus className="w-6 h-6" />,
    to: "/espace-consulaire/inscription",
  },
  {
    title: "Je cherche une information consulaire",
    desc: "Consulter le guide, les documents et les démarches.",
    icon: <BookOpen className="w-6 h-6" />,
    to: "/guide",
  },
  {
    title: "Je dépose ou je suis une demande",
    desc: "Carte consulaire, laissez-passer : dépôt et suivi de mon dossier.",
    icon: <FileText className="w-6 h-6" />,
    to: "/espace-consulaire/login",
  },
  {
    title: "Je veux investir ou proposer un partenariat",
    desc: "Entrer en relation avec le Consulat pour un projet Congo–Bénin.",
    icon: <Briefcase className="w-6 h-6" />,
    to: "/congo-benin",
  },
  {
    title: "Je cherche une information institutionnelle",
    desc: "Missions, vision et organisation du Consulat.",
    icon: <Landmark className="w-6 h-6" />,
    to: "/about",
  },
  {
    title: "Je souhaite contacter le Consulat",
    desc: "Écrire à l'équipe du Consulat ou obtenir une orientation.",
    icon: <PhoneCall className="w-6 h-6" />,
    to: "/contact",
  },
];

// Message du Consul. La citation reprend le texte proposé dans le document
// d'architecture : à faire valider par le Consul. Pour afficher sa photo,
// déposer le fichier dans /public et renseigner `photo` (ex. "/consul.jpeg").
const CONSUL = {
  nom: "Dr. Fidèle Elenga",
  titre: "Consul Honoraire de la République du Congo au Bénin",
  photo: null as string | null,
  citation:
    "Notre mission est de contribuer à rapprocher la République du Congo de la République du Bénin, tout en restant au plus près de nos compatriotes et de leurs préoccupations.",
};

// Coordonnées affichées dans le bandeau final. Une valeur vide = élément masqué.
// TODO : remplacer par les coordonnées officielles (même TODO dans Contact.tsx et Footer.tsx).
// `whatsapp` : numéro au format international, sans « + » ni espaces (ex. "22901000000").
const CONTACT = {
  email: "contact@consulat-congo-benin.org",
  telephone: "",
  whatsapp: "",
};

const contactItems: { label: string; href: string; icon: React.ReactNode }[] = [];
if (CONTACT.telephone) contactItems.push({ label: CONTACT.telephone, href: `tel:${CONTACT.telephone.replace(/\s/g, '')}`, icon: <Phone size={18} /> });
if (CONTACT.whatsapp) contactItems.push({ label: "WhatsApp", href: `https://wa.me/${CONTACT.whatsapp}`, icon: <MessageCircle size={18} /> });
if (CONTACT.email) contactItems.push({ label: CONTACT.email, href: `mailto:${CONTACT.email}`, icon: <Mail size={18} /> });

export function Home() {
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [loadingActualites, setLoadingActualites] = useState(true);
  const [evenements, setEvenements] = useState<Actualite[]>([]);

  useEffect(() => {
    api
      .get<Actualite[]>('/v1/actualites/dernieres')
      .then(setActualites)
      .catch((err) => {
        if (!(err instanceof ApiError)) console.error(err);
      })
      .finally(() => setLoadingActualites(false));
  }, []);

  // Agenda V1 = actualités de type "evenement" dont la date est à venir.
  useEffect(() => {
    api
      .get<Actualite[]>('/v1/actualites/type/evenement')
      .then((items) => {
        if (!Array.isArray(items)) return;
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);
        setEvenements(
          items
            .filter((e) => e.date_evenement && new Date(e.date_evenement) >= aujourdhui)
            .sort((a, b) => new Date(a.date_evenement!).getTime() - new Date(b.date_evenement!).getTime())
            .slice(0, 3)
        );
      })
      .catch((err) => {
        if (!(err instanceof ApiError)) console.error(err);
      });
  }, []);

  return (
    <div className="overflow-hidden bg-white">
      {/* 
        HERO SECTION 
        Modern, Bold, with a deep gradient overlay
      */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax-like fix */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback 
            src="/hero-consulat.jpeg"
            alt="Communauté congolaise du Consulat Honoraire au Bénin"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-green-950/95 via-brand-green-900/80 to-slate-900/40" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 pt-20">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:flex-row gap-2 items-start md:items-center mb-6"
            >
              <div className="h-1 w-20 bg-brand-gold-400 rounded-full"></div>
              <span className="text-brand-gold-400 font-bold tracking-widest uppercase text-sm">Service – Proximité – Intégrité</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[0.9] tracking-tight"
            >
              La République du Congo <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green-400 via-brand-green-200 to-white">
                au cœur du Bénin.
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg md:text-2xl text-slate-300 mb-12 max-w-2xl leading-relaxed font-light"
            >
              Le Consulat Honoraire de la République du Congo au Bénin accompagne les ressortissants congolais
              dans leurs démarches consulaires et renforce les liens entre nos deux pays.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 items-start"
            >
              <Link to="/espace-consulaire/login" className="group relative px-8 py-4 bg-brand-green-600 text-white font-bold text-lg rounded-full overflow-hidden shadow-2xl transition-all hover:scale-105 active:scale-95">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center gap-2">
                  Accéder à l'espace consulaire <ArrowRight size={20} />
                </span>
              </Link>
              <Link to="/about" className="flex items-center gap-4 px-8 py-4 text-white font-medium hover:text-brand-green-300 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
                  <Play size={20} fill="currentColor" className="ml-1" />
                </div>
                <span>Découvrir notre vision</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 
        INTRODUCTION SECTION 
        Clean typography, minimal layout
      */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 relative"
            >
               <div className="absolute -inset-4 bg-gradient-to-tr from-brand-green-100 to-brand-gold-100 rounded-[2rem] rotate-3 opacity-70"></div>
               <ImageWithFallback 
                 src="/us.jpeg" 
                 alt="Communauté congolaise au Bénin" 
                 className="relative rounded-[1.5rem] shadow-2xl w-full object-cover aspect-[4/3]"
               />
               <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hidden md:block">
                 <p className="font-serif italic text-xl text-slate-800">"Service et proximité"</p>
               </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2"
            >
              <h2 className="text-sm font-bold text-brand-green-600 uppercase tracking-widest mb-4">Qui sommes-nous ?</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">
                Un service public de proximité pour la <span className="text-brand-gold-500">communauté congolaise</span>.
              </h3>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Porté par le Consulat Honoraire de la République du Congo au Bénin, ce site est un espace de services et d'information pour la communauté congolaise.
              </p>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                Inscription au registre consulaire, carte consulaire, laissez-passer, informations pratiques : nous accompagnons chaque ressortissant dans ses démarches, où qu'il se trouve au Bénin.
              </p>
              
              <Link to="/about" className="inline-flex items-center gap-2 text-brand-green-800 font-bold border-b-2 border-brand-green-800 pb-1 hover:text-brand-green-600 hover:border-brand-green-600 transition-all">
                En savoir plus <ChevronRight size={18} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/*
        COMMENT POUVONS-NOUS VOUS AIDER ?
        Entrée par besoin : le visiteur choisit sa situation
      */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-brand-green-600 uppercase tracking-widest mb-4">Comment pouvons-nous vous aider ?</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Choisissez votre besoin, nous vous orientons.</h3>
            <p className="text-slate-600 text-lg">Pas besoin de chercher dans le menu : allez directement à ce qui vous concerne.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {besoins.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
              >
                <Link
                  to={b.to}
                  className="group flex items-start gap-4 h-full bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-green-200 transition-all duration-300"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-green-50 text-brand-green-700 flex items-center justify-center group-hover:bg-brand-green-600 group-hover:text-white transition-colors">
                    {b.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1 leading-snug">{b.title}</h4>
                    <p className="text-sm text-slate-500">{b.desc}</p>
                  </div>
                  <ArrowRight size={18} className="shrink-0 mt-1 text-slate-300 group-hover:text-brand-green-600 group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        AXES D'ACTION - BENTO GRID
      */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-sm font-bold text-brand-green-600 uppercase tracking-widest mb-4">Que faisons-nous ?</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Nos domaines d'action</h2>
            <p className="text-slate-600 text-lg">
              Un accompagnement complet de la communauté congolaise au Bénin, de l'administratif à la culture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {axes.map((axis, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border border-slate-100"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${axis.color} opacity-10 rounded-bl-[100px] transition-transform group-hover:scale-150 duration-500`}></div>
                
                <div className={`w-14 h-14 ${axis.bg} rounded-2xl flex items-center justify-center mb-8 text-slate-800 relative z-10 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300`}>
                  {axis.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-3 relative z-10">{axis.title}</h3>
                <p className="text-slate-500 mb-8 relative z-10 group-hover:text-slate-600">{axis.desc}</p>
                
                <Link to={axis.to} aria-label={axis.title} className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-400 group-hover:bg-brand-green-600 group-hover:border-transparent group-hover:text-white transition-all">
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/*
        MESSAGE DU CONSUL HONORAIRE
      */}
      <section className="py-24 bg-brand-green-50">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-5xl mx-auto bg-gradient-to-br from-brand-green-900 via-brand-green-800 to-teal-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            <div className="md:w-2/5 flex items-center justify-center p-10 bg-white/5">
              {CONSUL.photo ? (
                <img src={CONSUL.photo} alt={CONSUL.nom} className="w-56 h-56 md:w-64 md:h-64 rounded-full object-cover border-4 border-brand-gold-400/60 shadow-xl" />
              ) : (
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white/10 border-4 border-brand-gold-400/60 flex items-center justify-center p-6">
                  <img src="/logo-consulat-mark.png" alt="" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
            <div className="md:w-3/5 p-10 md:p-14 text-white">
              <p className="text-sm font-bold text-brand-gold-400 uppercase tracking-widest mb-6">Message du Consul Honoraire</p>
              <p className="font-serif italic text-2xl md:text-3xl leading-relaxed mb-8">« {CONSUL.citation} »</p>
              <div className="mb-8">
                <div className="font-bold text-lg">{CONSUL.nom}</div>
                <div className="text-sm text-brand-green-200">{CONSUL.titre}</div>
              </div>
              <Link to="/about" className="inline-flex items-center gap-2 font-bold text-brand-gold-400 hover:text-white transition-colors">
                Découvrir le Consulat <ChevronRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 
        NEWS HIGHLIGHT - Modern Cards
      */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">Actualités</h2>
              <div className="h-1.5 w-24 bg-brand-green-500 rounded-full"></div>
            </div>
            <Link to="/news" className="px-6 py-3 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
              Voir tout le journal
            </Link>
          </div>

          {loadingActualites && (
            <div className="flex justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {!loadingActualites && actualites.length === 0 && (
            <div className="text-center py-16 text-slate-500">Aucune actualité publiée pour le moment.</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {actualites.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="group cursor-pointer"
              >
                <Link to={`/news/${item.id}`}>
                <div className="relative overflow-hidden rounded-2xl mb-6 aspect-[16/10] bg-slate-100">
                  <ImageWithFallback 
                    src={item.image_url || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800&auto=format&fit=crop'}
                    alt={item.titre} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                     <span className="text-white font-semibold flex items-center gap-2">Lire l'article <ArrowRight size={16} /></span>
                  </div>
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-brand-green-800 shadow-sm">
                    {item.type_label}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                  <span className="font-medium text-brand-green-600">
                    {new Date(item.date_evenement || item.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug group-hover:text-brand-green-700 transition-colors">
                  {item.titre}
                </h3>
                {item.description && (
                  <p className="text-slate-500 line-clamp-2">{item.description}</p>
                )}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/*
        AGENDA - événements à venir (masqué s'il n'y en a pas)
      */}
      {evenements.length > 0 && (
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-2">Agenda</h2>
                <div className="h-1.5 w-24 bg-brand-gold-400 rounded-full"></div>
              </div>
              <Link to="/news" className="px-6 py-3 rounded-full border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 transition-colors">
                Voir toutes les actualités
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {evenements.map((ev) => {
                const date = new Date(ev.date_evenement as string);
                return (
                  <Link
                    key={ev.id}
                    to={`/news/${ev.id}`}
                    className="group flex gap-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="shrink-0 w-16 h-16 rounded-xl bg-brand-green-600 text-white flex flex-col items-center justify-center leading-none">
                      <span className="text-2xl font-bold">{date.getDate()}</span>
                      <span className="text-xs uppercase tracking-wider mt-1">{date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-snug mb-2 group-hover:text-brand-green-700 transition-colors">{ev.titre}</h3>
                      {ev.lieu_evenement && (
                        <p className="flex items-center gap-1.5 text-sm text-slate-500">
                          <MapPin size={14} /> {ev.lieu_evenement}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 
        CTA SECTION - Innovative Gradient
      */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-green-900">
           <div className="absolute inset-0 bg-gradient-to-r from-brand-green-900 via-brand-green-800 to-teal-900"></div>
           <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           {/* Animated blobs */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-green-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-gold-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
              Besoin d'un service consulaire ?
            </h2>
            <p className="text-xl text-brand-green-100 mb-12 max-w-2xl mx-auto font-light">
              Inscrivez-vous au registre consulaire pour déposer une demande de carte consulaire ou de laissez-passer, et suivre son avancement.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/espace-consulaire/inscription" className="px-10 py-5 bg-white text-brand-green-900 font-bold text-lg rounded-full shadow-2xl hover:bg-brand-green-50 hover:scale-105 transition-all duration-300">
                S'inscrire au registre
              </Link>
              <Link to="/contact" className="px-10 py-5 bg-transparent border border-white/30 text-white font-bold text-lg rounded-full hover:bg-white/10 transition-all duration-300">
                Nous contacter
              </Link>
            </div>

            {contactItems.length > 0 && (
              <div className="mt-14 pt-8 border-t border-white/10">
                <p className="text-brand-green-200 mb-5">En cas de situation urgente, contactez directement le Consulat :</p>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
                  {contactItems.map((c) => (
                    <a key={c.href} href={c.href} className="inline-flex items-center gap-2 text-white font-medium hover:text-brand-gold-400 transition-colors">
                      {c.icon} {c.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
