import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Mail, MapPin } from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-3">{title}</h2>
      <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export function MentionsLegales() {
  return (
    <div className="bg-slate-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 text-brand-green-600 font-bold text-sm mb-3">
          <Scale className="w-4 h-4" /> Informations légales
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Mentions légales</h1>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-10">
          {/*
            TODO : cette page (statut de l'éditeur, directeur de publication) reprenait
            le statut juridique d'une association (AJDCB) — à réécrire avec le consulat,
            dont le statut juridique est différent (mission consulaire honoraire, pas
            une association). Ne pas publier tel quel.
          */}
          <Section title="Éditeur du site">
            <p>
              Le présent site est édité par le <strong>Consulat Honoraire de la République du Congo au Bénin</strong>,
              dirigé par le Consul Honoraire Dr. Fidèle Elenga, à Cotonou, République du Bénin.
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-green-600 shrink-0" /> contact@consulat-congo-benin.org
            </p>
          </Section>

          <Section title="Directeur de la publication">
            <p>
              Le Consul Honoraire, représentant du consulat, est responsable de la publication du présent site.
            </p>
          </Section>

          <Section title="Hébergement">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-green-600 shrink-0 mt-1" />
              <span>
                Namecheap, Inc.<br />
                4600 East Washington Street, Suite 300<br />
                Phoenix, AZ 85034 — États-Unis d'Amérique<br />
                <a href="https://www.namecheap.com" target="_blank" rel="noopener noreferrer" className="text-brand-green-600 hover:underline">
                  www.namecheap.com
                </a>
              </span>
            </p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              L'ensemble des contenus présents sur ce site (textes, logo, visuels, mise en page) est la propriété du Consulat Honoraire de la République du Congo au Bénin, sauf
              mention contraire. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation préalable
              est interdite.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Pour toute question relative au site, écrivez-nous à{' '}
              <a href="mailto:contact@consulat-congo-benin.org" className="text-brand-green-600 hover:underline">contact@consulat-congo-benin.org</a>, ou
              via notre <Link to="/contact" className="text-brand-green-600 hover:underline">page de contact</Link>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
