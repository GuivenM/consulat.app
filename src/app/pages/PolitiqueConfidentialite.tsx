import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail } from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-3">{title}</h2>
      <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export function PolitiqueConfidentialite() {
  return (
    <div className="bg-slate-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 text-brand-green-600 font-bold text-sm mb-3">
          <ShieldCheck className="w-4 h-4" /> Vie privée
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Politique de confidentialité</h1>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-10">
          {/* TODO : adresse et détails à confirmer avec le consulat */}
          <Section title="Responsable du traitement">
            <p>
              Le Consulat Honoraire de la République du Congo au Bénin, à Cotonou, est responsable du traitement des données
              personnelles collectées via ce site.
            </p>
          </Section>

          <Section title="Données que nous collectons">
            <p>Selon les démarches que vous effectuez, nous pouvons collecter :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nom, prénom, email, téléphone (formulaire de contact, inscription au registre consulaire) ;</li>
              <li>Données du registre consulaire : état civil, localisation (jusqu'au niveau quartier), copie de pièce d'identité ou de passeport ;</li>
              <li>Documents fournis à l'appui d'une demande de carte consulaire ou de laissez-passer (photos d'identité, copie de pièces) ;</li>
              <li>Identifiants de connexion, si vous créez un compte sur l'espace consulaire ;</li>
              <li>Informations nécessaires au traitement du paiement des frais de dossier.</li>
            </ul>
          </Section>

          {/* TODO : prestataire de paiement pas encore choisi pour les frais de dossier (carte consulaire, laissez-passer) */}
          <Section title="Paiement en ligne">
            <p>
              Le paiement des frais de dossier (carte consulaire, laissez-passer) sera traité par un prestataire de paiement
              tiers. Le consulat ne collecte ni ne conserve aucune donnée de carte bancaire ou de moyen de paiement — celles-ci
              transiteront directement entre vous et ce prestataire, selon sa propre politique de confidentialité.
            </p>
          </Section>

          <Section title="Pourquoi nous utilisons ces données">
            <ul className="list-disc pl-5 space-y-1">
              <li>Traiter votre inscription au registre consulaire et vos demandes de carte consulaire ou de laissez-passer ;</li>
              <li>Vous informer de l'état d'avancement de votre dossier (dossier prêt, changement de statut) ;</li>
              <li>Répondre à vos demandes de contact ;</li>
              <li>Vous donner accès à l'espace consulaire ;</li>
              <li>Assurer le bon fonctionnement et la sécurité du site.</li>
            </ul>
            <p>Nous ne vendons ni ne louons vos données personnelles à des tiers, et ne les partageons qu'avec les prestataires strictement nécessaires au fonctionnement du site (hébergement, paiement).</p>
          </Section>

          <Section title="Durée de conservation">
            <p>
              Vos données sont conservées pour la durée nécessaire aux finalités décrites ci-dessus (gestion de votre inscription
              au registre et de vos demandes), et au maximum jusqu'à votre demande de suppression. Une durée de conservation
              précise par type de donnée sera publiée sur cette page dès qu'elle aura été formellement fixée par le consulat.
            </p>
          </Section>

          <Section title="Cookies et traceurs">
            <p>
              Ce site n'utilise, à ce jour, aucun cookie de suivi publicitaire ni outil d'analyse tiers (type Google Analytics).
              Seuls les éléments techniques strictement nécessaires au fonctionnement du site (ex. maintien de votre session sur
              l'espace membre) sont utilisés.
            </p>
          </Section>

          <Section title="Vos droits">
            <p>
              Conformément à la loi n° 2017-20 portant Code du numérique en République du Bénin, vous disposez d'un droit d'accès,
              de rectification, d'opposition et de suppression de vos données personnelles. Pour l'exercer, contactez-nous à{' '}
              <a href="mailto:contact@consulat-congo-benin.org" className="text-brand-green-600 hover:underline">contact@consulat-congo-benin.org</a>.
            </p>
            <p>
              Vous pouvez également adresser une réclamation à l'Autorité de Protection des Données Personnelles (APDP) du Bénin,
              autorité administrative indépendante compétente en la matière.
            </p>
          </Section>

          <Section title="Contact">
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-green-600 shrink-0" />
              <a href="mailto:contact@consulat-congo-benin.org" className="text-brand-green-600 hover:underline">contact@consulat-congo-benin.org</a>
              {' '}— ou via notre <Link to="/contact" className="text-brand-green-600 hover:underline">page de contact</Link>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
