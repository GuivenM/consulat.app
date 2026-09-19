import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { api, ApiError } from '../../lib/api';

interface ContactForm {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  objet: 'question' | 'partenariat' | 'adhesion' | 'urgence' | 'autre';
  message: string;
  organisation: string;
  type_organisation: '' | 'institution' | 'ong' | 'entreprise' | 'media' | 'universite' | 'association';
  secteur_activite: string;
  pays: string;
  ville: string;
  site_web: string;
}

export function Contact() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ContactForm>({
    defaultValues: { objet: 'question' },
  });
  const objet = watch('objet');
  const estPartenariat = objet === 'partenariat';

  const onSubmit = async (data: ContactForm) => {
    setLoading(true);
    try {
      await api.post('/v1/messages', data);
      toast.success('Message envoyé ! Vous recevrez une confirmation par email.');
      reset({ objet: 'question' });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Impossible d'envoyer le message pour l'instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Info Side */}
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold text-slate-900 mb-6"
            >
              Parlons de <br/> <span className="text-brand-green-600">votre projet.</span>
            </motion.h1>
            <p className="text-xl text-slate-500 mb-12">
              Que vous ayez une question sur nos services consulaires, souhaitiez devenir partenaire ou simplement nous contacter, notre équipe est à votre écoute.
            </p>

            {/* TODO : coordonnées à remplacer par celles, réelles, du consulat (adresse, email, téléphone) */}
            <div className="space-y-8 mb-12">
              {[
                { icon: <MapPin />, title: "Adresse", desc: "Cotonou, Bénin" },
                { icon: <Mail />, title: "Email", desc: "contact@consulat-congo-benin.org" },
                { icon: <Phone />, title: "Téléphone", desc: "+229 00 00 00 00" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-slate-50 p-8 md:p-12 rounded-[2.5rem]">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 ml-1">Nom</label>
                  <input type="text" className="w-full px-6 py-4 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none" placeholder="Votre nom" {...register('nom', { required: true })} />
                  {errors.nom && <span className="text-red-500 text-xs ml-1">Requis</span>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 ml-1">Prénom</label>
                  <input type="text" className="w-full px-6 py-4 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none" placeholder="Votre prénom" {...register('prenom', { required: true })} />
                  {errors.prenom && <span className="text-red-500 text-xs ml-1">Requis</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 ml-1">Email</label>
                  <input type="email" className="w-full px-6 py-4 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none" placeholder="nom@exemple.com" {...register('email', { required: true })} />
                  {errors.email && <span className="text-red-500 text-xs ml-1">Requis</span>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 ml-1">Téléphone</label>
                  <input type="text" className="w-full px-6 py-4 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none" placeholder="+229 00 00 00 00" {...register('telephone', { required: true })} />
                  {errors.telephone && <span className="text-red-500 text-xs ml-1">Requis</span>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 ml-1">Objet</label>
                <select className="w-full px-6 py-4 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none" {...register('objet', { required: true })}>
                  <option value="question">Question</option>
                  <option value="partenariat">Partenariat</option>
                  <option value="adhesion">Adhésion</option>
                  <option value="urgence">Urgence</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {estPartenariat && (
                <div className="space-y-6 bg-white/60 rounded-2xl p-5 -mx-1">
                  <p className="text-sm text-slate-500">
                    Quelques informations sur votre structure, pour que notre équipe traite votre demande plus vite.
                  </p>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-900 ml-1">Nom de l'organisation</label>
                    <input
                      type="text"
                      className="w-full px-6 py-4 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none"
                      placeholder="Nom de votre structure"
                      {...register('organisation', { required: estPartenariat })}
                    />
                    {errors.organisation && <span className="text-red-500 text-xs ml-1">Requis</span>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-900 ml-1">Type de structure</label>
                      <select className="w-full px-6 py-4 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none" {...register('type_organisation')}>
                        <option value="">Sélectionner…</option>
                        <option value="institution">Institution</option>
                        <option value="ong">ONG</option>
                        <option value="entreprise">Entreprise</option>
                        <option value="media">Média</option>
                        <option value="universite">Université/École</option>
                        <option value="association">Association</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-900 ml-1">Secteur d'activité</label>
                      <input type="text" className="w-full px-6 py-4 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none" placeholder="Ex. Éducation, Santé…" {...register('secteur_activite')} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-900 ml-1">Pays</label>
                      <input type="text" className="w-full px-6 py-4 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none" placeholder="Bénin" {...register('pays')} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-900 ml-1">Ville</label>
                      <input type="text" className="w-full px-6 py-4 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none" placeholder="Cotonou" {...register('ville')} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-900 ml-1">Site web</label>
                    <input type="text" className="w-full px-6 py-4 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none" placeholder="https://…" {...register('site_web')} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-900 ml-1">Message</label>
                 <textarea rows={4} className="w-full px-6 py-4 rounded-xl border border-transparent bg-white focus:ring-2 focus:ring-brand-green-500 transition-all outline-none" placeholder="Comment pouvons-nous vous aider ?" {...register('message', { required: true })}></textarea>
                 {errors.message && <span className="text-red-500 text-xs ml-1">Requis</span>}
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-brand-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
