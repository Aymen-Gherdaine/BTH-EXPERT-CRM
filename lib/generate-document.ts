import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { placeSignature } from '@/lib/inject-signature';

const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'template-standard-v2.docx');

function formatMontant(n: number): string {
  return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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

interface BudgetLigne {
  numero: number;
  designation: string;
  quantite: number;
  prix_formate: string;
}

interface BudgetGroupe {
  titre_groupe: string;
  lignes: BudgetLigne[];
  sous_total_formate: string;
}

interface ListItem {
  item: string;
}

export interface DocumentData {
  // Client
  titre: string;
  nom_client: string;
  poste_client: string;
  entreprise: string;
  adresse: string;
  ville: string;

  // Offre
  numero_offre: string;
  date_offre: string;
  objet_ligne1: string;

  // Salutations
  salutation: string;
  salutation_fin: string;

  // Section 1 Contexte
  intro_paragraphe: string;
  contexte_paragraphe_1: string;
  contexte_paragraphe_2: string;
  callout_objectif: string;

  // Listes — arrays pour loops paragraphLoop
  perimetre_items: ListItem[];
  objectifs_items: ListItem[];
  hypotheses_items: ListItem[];
  livrables_items: ListItem[];
  inclusions_items: ListItem[];
  exclusions_items: ListItem[];

  // Section 3
  description_echeancier: string;

  // Section 4 Budget
  groupes_budget: BudgetGroupe[];
  recap_lignes: BudgetLigne[];
  total_ht_formate: string;
  tva_pct: number;
  tva_formate: string;
  total_ttc_formate: string;
  modalites_paiement: string;

  // Délais
  validite_jours: number;
  validite_jours_lettres: string;

  // Signataires
  signataire_1_nom: string;
  signataire_1_titre: string;
  signataire_2_nom: string;
  signataire_2_titre: string;
}

/**
 * Adds vertical centering to the table cell containing each signature marker.
 * Must be called BEFORE placeSignature so the marker is still present.
 */
function verticalCenterSignatureCells(zip: PizZip): void {
  let xml = zip.file('word/document.xml')!.asText();
  let changed = false;

  for (const marker of ['@@SIG1@@', '@@SIG2@@']) {
    const idx = xml.indexOf(marker);
    if (idx === -1) continue;

    // Walk backwards to find the nearest <w:tc> opening tag
    let tcStart = -1;
    for (let i = idx - 1; i >= 0; i--) {
      if (xml[i] !== '<') continue;
      if (xml.slice(i, i + 5) === '<w:tc' && (xml[i + 5] === '>' || xml[i + 5] === ' ')) {
        tcStart = i;
        break;
      }
    }
    if (tcStart === -1) continue;

    const tcOpenEnd = xml.indexOf('>', tcStart) + 1;
    const nextTc = xml.indexOf('<w:tc', tcOpenEnd);
    const tcPrStart = xml.indexOf('<w:tcPr', tcStart);
    const hasTcPr = tcPrStart !== -1 && (nextTc === -1 || tcPrStart < nextTc);

    if (!hasTcPr) {
      xml = xml.slice(0, tcOpenEnd) + '<w:tcPr><w:vAlign w:val="center"/></w:tcPr>' + xml.slice(tcOpenEnd);
      changed = true;
    } else {
      const tcPrOpenEnd = xml.indexOf('>', tcPrStart) + 1;
      const isSelfClosing = xml.slice(tcPrStart, tcPrOpenEnd).endsWith('/>');
      const tcPrCloseIdx = xml.indexOf('</w:tcPr>', tcPrStart);
      const checkEnd = isSelfClosing ? tcPrOpenEnd : tcPrCloseIdx;

      if (!xml.slice(tcPrStart, checkEnd).includes('<w:vAlign')) {
        if (isSelfClosing) {
          xml = xml.slice(0, tcPrStart) + '<w:tcPr><w:vAlign w:val="center"/></w:tcPr>' + xml.slice(tcPrOpenEnd);
        } else {
          xml = xml.slice(0, tcPrCloseIdx) + '<w:vAlign w:val="center"/>' + xml.slice(tcPrCloseIdx);
        }
        changed = true;
      }
    }
  }

  if (changed) zip.file('word/document.xml', xml);
}

export function generateDocument(
  data: DocumentData,
  signatures?: { responsable?: Buffer | null; autorise?: Buffer | null }
): Buffer {
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(templateBuffer);

  // Remove date picker SDT wrapper so Cloudmersive renders {date_offre} as plain text.
  let docXml = zip.files['word/document.xml'].asText();
  docXml = docXml.replace(
    /<w:sdt><w:sdtPr>(?:(?!<\/w:sdt>)[\s\S])*?<w:date\b(?:(?!<\/w:sdt>)[\s\S])*?<\/w:sdtPr><w:sdtContent>((?:(?!<\/w:sdt>)[\s\S])*?)<\/w:sdtContent><\/w:sdt>/g,
    '$1'
  );

  zip.file('word/document.xml', docXml);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  try {
    doc.render(data);
  } catch (error: unknown) {
    const e = error as { properties?: { errors?: Array<{ message?: string; properties?: { explanation?: string; context?: string; xtag?: string } }> } };
    if (e?.properties?.errors) {
      console.error("Docxtemplater errors:",
        JSON.stringify(e.properties.errors.map((err) => ({
          message: err.message,
          explanation: err.properties?.explanation,
          context: err.properties?.context,
          tag: err.properties?.xtag,
        })), null, 2)
      );
    }
    throw error;
  }

  const renderedZip = doc.getZip();

  // Vertically center the table cells containing the signature markers
  verticalCenterSignatureCells(renderedZip);

  placeSignature(renderedZip, '@@SIG1@@', signatures?.responsable ?? null);
  placeSignature(renderedZip, '@@SIG2@@', signatures?.autorise ?? null);

  return renderedZip.generate({ type: 'nodebuffer' }) as Buffer;
}

export { formatMontant };
