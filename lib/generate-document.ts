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
 * Centers the paragraph containing each signature marker.
 * Must be called BEFORE placeSignature so the marker is still present.
 */
function centerSignatureMarkers(zip: PizZip): void {
  let xml = zip.file('word/document.xml')!.asText();
  let changed = false;

  for (const marker of ['@@SIG1@@', '@@SIG2@@']) {
    const idx = xml.indexOf(marker);
    if (idx === -1) continue;

    // Walk backwards to find the nearest <w:p> or <w:p ...> opening tag
    let pStart = -1;
    for (let i = idx - 1; i >= 0; i--) {
      if (xml[i] !== '<') continue;
      const chunk = xml.slice(i, i + 5);
      if (chunk === '<w:p>' || chunk === '<w:p ') { pStart = i; break; }
    }
    if (pStart === -1) continue;

    const pOpenEnd = xml.indexOf('>', pStart) + 1;
    // Boundary of the current paragraph (start of the next <w:p)
    const nextPTag = xml.indexOf('<w:p', pOpenEnd);

    const pPrStart = xml.indexOf('<w:pPr', pStart);
    const hasPPr = pPrStart !== -1 && (nextPTag === -1 || pPrStart < nextPTag);

    if (!hasPPr) {
      // No <w:pPr> at all — insert one with centering right after <w:p...>
      xml = xml.slice(0, pOpenEnd) + '<w:pPr><w:jc w:val="center"/></w:pPr>' + xml.slice(pOpenEnd);
      changed = true;
    } else {
      const pPrOpenEnd = xml.indexOf('>', pPrStart) + 1;
      const isSelfClosing = xml.slice(pPrStart, pPrOpenEnd).endsWith('/>');
      const checkEnd = isSelfClosing ? pPrOpenEnd : xml.indexOf('</w:pPr>', pPrStart);

      if (!xml.slice(pPrStart, checkEnd).includes('<w:jc ')) {
        if (isSelfClosing) {
          // <w:pPr/> → expand to full element with centering
          xml = xml.slice(0, pPrStart) + '<w:pPr><w:jc w:val="center"/></w:pPr>' + xml.slice(pPrOpenEnd);
        } else {
          // Insert <w:jc> as first child inside <w:pPr>
          xml = xml.slice(0, pPrOpenEnd) + '<w:jc w:val="center"/>' + xml.slice(pPrOpenEnd);
        }
        changed = true;
      }
    }
  }

  if (changed) zip.file('word/document.xml', xml);
}

export function generateDocument(
  data: DocumentData,
  signatures?: { responsable?: Buffer | null; autorise?: Buffer | null },
  forPdf = false
): Buffer {
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(templateBuffer);

  // Remove date picker SDT wrapper so Cloudmersive renders {date_offre} as plain text.
  let docXml = zip.files['word/document.xml'].asText();
  docXml = docXml.replace(
    /<w:sdt><w:sdtPr>(?:(?!<\/w:sdt>)[\s\S])*?<w:date\b(?:(?!<\/w:sdt>)[\s\S])*?<\/w:sdtPr><w:sdtContent>((?:(?!<\/w:sdt>)[\s\S])*?)<\/w:sdtContent><\/w:sdt>/g,
    '$1'
  );

  if (forPdf) {
    // LibreOffice (Cloudmersive) does not render Word headers — copy the logo drawing
    // from header1.xml into the document body so it appears in the PDF output.
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

  // Center signature paragraphs before injecting images
  centerSignatureMarkers(renderedZip);

  placeSignature(renderedZip, '@@SIG1@@', signatures?.responsable ?? null);
  placeSignature(renderedZip, '@@SIG2@@', signatures?.autorise ?? null);

  return renderedZip.generate({ type: 'nodebuffer' }) as Buffer;
}

export { formatMontant };
