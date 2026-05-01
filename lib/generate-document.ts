import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'template-standard-v2.docx');

function formatMontant(n: number): string {
  return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

const UNITES = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const DIZAINES = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function dizeineEnLettres(n: number): string {
  if (n < 20) return UNITES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (d === 7) return u === 0 ? 'soixante-dix' : `soixante-${UNITES[10 + u]}`;
  if (d === 9) return u === 0 ? 'quatre-vingt-dix' : `quatre-vingt-${UNITES[10 + u]}`;
  const dizaine = DIZAINES[d];
  if (u === 0) return d === 8 ? 'quatre-vingts' : dizaine;
  const liaison = u === 1 && d !== 8 ? '-et-' : '-';
  return `${dizaine}${liaison}${UNITES[u]}`;
}

function centaineEnLettres(n: number): string {
  if (n < 100) return dizeineEnLettres(n);
  const c = Math.floor(n / 100);
  const reste = n % 100;
  const centaine = c === 1 ? 'cent' : `${UNITES[c]}-cent`;
  if (reste === 0) return c === 1 ? 'cent' : `${UNITES[c]}-cents`;
  return `${centaine}-${dizeineEnLettres(reste)}`;
}

export function nombreEnLettres(n: number): string {
  if (n === 0) return 'zéro';
  if (n < 0) return `moins-${nombreEnLettres(-n)}`;
  const entier = Math.floor(n);
  if (entier < 1000) return centaineEnLettres(entier);
  const milliers = Math.floor(entier / 1000);
  const reste = entier % 1000;
  const prefixe = milliers === 1 ? 'mille' : `${centaineEnLettres(milliers)}-mille`;
  if (reste === 0) return prefixe;
  return `${prefixe}-${centaineEnLettres(reste)}`;
}

export interface LigneBudget {
  numero: number;
  designation: string;
  quantite: number;
  prix_unitaire: number;
}

export interface DocumentData {
  // Client
  titre: string;
  titre_long: string;
  nom_client: string;
  nom_client_majuscule: string;
  poste_client: string;
  entreprise: string;
  adresse: string;
  ville: string;
  code_postal: string;
  // Offre
  numero_offre: string;
  date_offre: string;
  // Projet
  titre_projet: string;
  description_mission: string;
  contexte_paragraphe_1: string;
  contexte_paragraphe_2: string;
  // Objectifs
  objectif_1: string;
  objectif_2: string;
  objectif_3: string;
  objectif_4: string;
  // Hypothèses
  hypothese_1: string;
  hypothese_2_intro: string;
  hypothese_2_a: string;
  hypothese_2_b: string;
  hypothese_3: string;
  hypothese_4: string;
  // Délais
  delai_jours: number;
  validite_jours: number;
  tva_pct: number;
  // Budget
  lignes_budget: LigneBudget[];
  // Totaux
  total_ht: number;
  tva: number;
  total_ttc: number;
  // Signataires
  signataire_1_nom: string;
  signataire_1_titre: string;
  signataire_2_nom: string;
  signataire_2_titre: string;
}

export function generateDocument(data: DocumentData): Buffer {
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(templateBuffer);

  // Fix 1: Remove date picker SDT wrapper so Cloudmersive renders {date_offre} as plain text
  let docXml = zip.files['word/document.xml'].asText();
  docXml = docXml.replace(
    /<w:sdt><w:sdtPr>[\s\S]*?<w:date\b[\s\S]*?<\/w:sdtPr><w:sdtContent>([\s\S]*?)<\/w:sdtContent><\/w:sdt>/g,
    '$1'
  );

  // Fix 2: Change first-page-only header to default header so Cloudmersive renders the logo
  docXml = docXml
    .replace(/<w:titlePg\/>/g, '')
    .replace(/(<w:headerReference\b[^>]*)w:type="first"/g, '$1w:type="default"');

  zip.file('word/document.xml', docXml);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const lignesBudgetFormatees = data.lignes_budget.map((l) => ({
    numero: l.numero,
    designation: l.designation,
    quantite: l.quantite,
    prix_unitaire_formate: formatMontant(l.prix_unitaire),
  }));

  doc.render({
    // Client
    titre: data.titre,
    titre_long: data.titre_long,
    nom_client: data.nom_client,
    nom_client_majuscule: data.nom_client_majuscule,
    poste_client: data.poste_client,
    entreprise: data.entreprise,
    adresse: data.adresse,
    ville: data.ville,
    code_postal: data.code_postal,
    // Offre
    numero_offre: data.numero_offre,
    date_offre: data.date_offre,
    // Projet
    titre_projet: data.titre_projet,
    description_mission: data.description_mission,
    contexte_paragraphe_1: data.contexte_paragraphe_1,
    contexte_paragraphe_2: data.contexte_paragraphe_2,
    // Objectifs
    objectif_1: data.objectif_1,
    objectif_2: data.objectif_2,
    objectif_3: data.objectif_3,
    objectif_4: data.objectif_4,
    // Hypothèses
    hypothese_1: data.hypothese_1,
    hypothese_2_intro: data.hypothese_2_intro,
    hypothese_2_a: data.hypothese_2_a,
    hypothese_2_b: data.hypothese_2_b,
    hypothese_3: data.hypothese_3,
    hypothese_4: data.hypothese_4,
    // Délais
    delai_jours: data.delai_jours,
    delai_jours_lettres: nombreEnLettres(data.delai_jours),
    validite_jours: data.validite_jours,
    validite_jours_lettres: nombreEnLettres(data.validite_jours),
    tva_pct: data.tva_pct,
    // Budget (boucle)
    lignes_budget: lignesBudgetFormatees,
    // Totaux
    total_ht_formate: formatMontant(data.total_ht),
    tva_formate: formatMontant(data.tva),
    total_ttc_formate: formatMontant(data.total_ttc),
    // Signataires
    signataire_1_nom: data.signataire_1_nom,
    signataire_1_titre: data.signataire_1_titre,
    signataire_2_nom: data.signataire_2_nom,
    signataire_2_titre: data.signataire_2_titre,
  });

  return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer;
}

export { formatMontant };
