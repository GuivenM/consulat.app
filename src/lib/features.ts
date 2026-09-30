// Interrupteurs de fonctionnalités, lus à la compilation (relancer le build
// après changement).
//
// Demandes en ligne (carte consulaire, laissez-passer) : masquées tant que
// l'administration n'est pas prête à les traiter. Le backend reste intact ;
// mettre VITE_DEMANDES_ENABLED=true suffit à les réactiver (espace membre,
// écrans admin Demandes/Caisse, notifications, tableau de bord).
export const DEMANDES_ENABLED = import.meta.env.VITE_DEMANDES_ENABLED === 'true';
