import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'template-standard-v2.docx');

function formatMontant(n: number): string {
  return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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

export function generateDocument(data: DocumentData, forPdf = false): Buffer {
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(templateBuffer);

  // Remove date picker SDT wrapper so Cloudmersive renders {date_offre} as plain text.
  let docXml = zip.files['word/document.xml'].asText();
  docXml = docXml.replace(
    /<w:sdt><w:sdtPr>(?:(?!<\/w:sdt>)[\s\S])*?<w:date\b(?:(?!<\/w:sdt>)[\s\S])*?<\/w:sdtPr><w:sdtContent>((?:(?!<\/w:sdt>)[\s\S])*?)<\/w:sdtContent><\/w:sdt>/g,
    '$1'
  );

  if (forPdf) {
    // Cloudmersive doesn't render Word headers, so copy the logo from header1.xml into the body.
    const headerXml = zip.files['word/header1.xml']?.asText() ?? '';
    const headerRelsXml = zip.files['word/_rels/header1.xml.rels']?.asText() ?? '';

    const drawingMatch = /<w:drawing>[\s\S]*?<\/w:drawing>/.exec(headerXml);
    const embedMatch = drawingMatch ? /r:embed="([^"]+)"/.exec(drawingMatch[0]) : null;

    if (drawingMatch && embedMatch) {
      const headerRId = embedMatch[1];
      const targetMatch = new RegExp(`Id="${headerRId}"[^>]*Target="([^"]+)"`).exec(headerRelsXml);
      const headerTarget = targetMatch ? /Target="([^"]+)"/.exec(targetMatch[0])?.[1] ?? '' : '';
      const imgTarget = headerTarget.startsWith('../') ? headerTarget.slice(3) : headerTarget;

      if (imgTarget) {
        const newRId = 'rIdLogoBody';
        let docRelsXml = zip.files['word/_rels/document.xml.rels'].asText();
        if (!docRelsXml.includes(newRId)) {
          docRelsXml = docRelsXml.replace(
            '</Relationships>',
            `<Relationship Id="${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${imgTarget}"/></Relationships>`
          );
          zip.file('word/_rels/document.xml.rels', docRelsXml);
        }

        const bodyDrawing = drawingMatch[0].replace(`r:embed="${headerRId}"`, `r:embed="${newRId}"`);
        const logoPara = `<w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r>${bodyDrawing}</w:r></w:p>`;
        docXml = docXml.replace('<w:body>', `<w:body>${logoPara}`);
      }
    }
  }

  zip.file('word/document.xml', docXml);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(data);

  return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer;
}

export { formatMontant };
