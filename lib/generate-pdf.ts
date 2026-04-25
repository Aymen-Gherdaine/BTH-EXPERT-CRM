import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Client, LigneBudget, Soumission, TypeEtude } from "@/types";
import { formatDateFr, formatMontant } from "./utils";

const PRIMARY_RGB: [number, number, number] = [46, 125, 178];
const GRAY_RGB: [number, number, number] = [244, 246, 247];
const TEXT_RGB: [number, number, number] = [30, 30, 30];

function getHypotheses(type: TypeEtude): string[] {
  const base = [
    "Les informations de base (capacités, procédés, intrants, plans d'implantation, listes de produits, volumes stockés) seront fournies par le client et réputées exactes.",
    "Les délais d'exécution s'entendent hors délais d'instruction administrative et hors délais d'analyses de laboratoire par des tiers.",
  ];

  if (type === "EIE+Dangers") {
    return [
      "La classification de l'établissement au titre du décret 07-144 constitue l'étape préalable déterminante (Ministère, Wilaya ou APC).",
      "Selon la classification, une Étude d'Impact sur l'Environnement (EIE) accompagnée d'une Étude de Dangers sera réalisée.",
      ...base,
    ];
  } else if (type === "Notice+ProduitsDangereux") {
    return [
      "La classification de l'établissement au titre du décret 07-144 constitue l'étape préalable déterminante (Ministère, Wilaya ou APC).",
      "Selon la classification, une Notice d'Impact / Audit environnemental accompagnée d'un rapport sur les produits dangereux sera réalisée.",
      ...base,
    ];
  }
  return [
    "La classification de l'établissement au titre du décret 07-144 constitue l'étape préalable déterminante pour préciser le régime d'autorisation.",
    ...base,
  ];
}

function addHeader(doc: jsPDF) {
  const pw = doc.internal.pageSize.width;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_RGB);
  (doc as jsPDF & { setCharSpace: (v: number) => void }).setCharSpace(1.5);
  doc.text("BTH EXPERT", pw - 15, 11, { align: "right" });
  (doc as jsPDF & { setCharSpace: (v: number) => void }).setCharSpace(0.8);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("ENVIRONNEMENT", pw - 15, 16, { align: "right" });
  doc.text("INGÉNIERIE", pw - 15, 20, { align: "right" });
  (doc as jsPDF & { setCharSpace: (v: number) => void }).setCharSpace(0);
  doc.setDrawColor(...PRIMARY_RGB);
  doc.setLineWidth(0.4);
  doc.line(15, 24, pw - 15, 24);
}

function addFooter(doc: jsPDF, pageNum: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, pageHeight - 15, doc.internal.pageSize.width - 15, pageHeight - 15);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text("BTH EXPERT", doc.internal.pageSize.width / 2, pageHeight - 10, { align: "center" });
  doc.text(String(pageNum), doc.internal.pageSize.width - 15, pageHeight - 10, { align: "right" });
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_RGB);
  doc.text(text, 15, y);
  return y + 7;
}

function bodyText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.setTextColor(...TEXT_RGB);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * 5.2 + 3;
}

function bulletText(doc: jsPDF, text: string, y: number, maxWidth: number): number {
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.setTextColor(...TEXT_RGB);
  const lines = doc.splitTextToSize(`\u25AA ${text}`, maxWidth - 5);
  doc.text(lines, 22, y);
  return y + lines.length * 5.2 + 2;
}

export interface ParametresPdf {
  signataire1_nom?: string;
  signataire1_titre?: string;
  signataire2_nom?: string;
  signataire2_titre?: string;
}

export function generatePdf(
  soumission: Soumission,
  client: Client,
  lignes: LigneBudget[],
  contexteData: { section_1: string; section_1_1: string },
  parametres?: ParametresPdf
): ArrayBuffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - 30;
  let y = 30;
  let page = 1;

  const civiliteLong =
    client.titre === "M." ? "Monsieur" : client.titre === "Mme" ? "Madame" : client.titre;

  addHeader(doc);

  // Client info
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_RGB);
  doc.text(`${client.titre} ${client.nom_contact}, ${client.poste}`, 15, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(client.entreprise, 15, y);
  y += 5;
  doc.text(client.adresse, 15, y);
  y += 5;
  doc.text(client.ville, 15, y);
  y += 5;

  // Offre No (right side) — label line then number line, aligned with client info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_RGB);
  doc.text("Offre No :", pageWidth - 15, 30, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(soumission.numero_offre, pageWidth - 15, 36, { align: "right" });

  // Date (left margin note)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_RGB);
  doc.text("DATE", 15, y + 8);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateFr(soumission.date_offre), 15, y + 13);

  y += 20;

  // OBJET
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_RGB);
  doc.text("OBJET :", 15, y);
  y += 7;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_RGB);
  doc.text("Offre de services professionnels", 15, y);
  y += 6;

  const titleLines = doc.splitTextToSize(soumission.titre_projet, contentWidth);
  doc.text(titleLines, 15, y);
  y += titleLines.length * 5.5 + 10;

  // Salutation + intro
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.setTextColor(...TEXT_RGB);
  doc.text(`${civiliteLong} ${client.nom_contact.split(" ")[0]},`, 15, y);
  y += 7;

  y = bodyText(
    doc,
    `Sarl BTH EXPERT a le plaisir de vous transmettre son offre de services professionnels relative au projet ${soumission.titre_projet.toLowerCase()}.`,
    15,
    y,
    contentWidth
  );
  y += 3;

  // Section 1
  y = sectionTitle(doc, "1.   Contexte et objectifs", y);
  const section1Paragraphs = contexteData.section_1.split("\n").filter((p) => p.trim());
  for (const p of section1Paragraphs) {
    y = bodyText(doc, p.trim(), 15, y, contentWidth);
  }

  // Check page break
  if (y > 240) {
    doc.addPage();
    page++;
    addHeader(doc);
    addFooter(doc, page - 1);
    y = 30;
  }

  // Section 1.1
  y = sectionTitle(doc, "1.1   Objectifs du projet", y);
  y = bodyText(doc, "Les objectifs du projet et du mandat sont les suivants :", 15, y, contentWidth);

  const objectifs = contexteData.section_1_1
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^-\s*/, "").trim());

  for (const obj of objectifs) {
    if (y > 255) {
      doc.addPage();
      page++;
      addHeader(doc);
      addFooter(doc, page - 1);
      y = 30;
    }
    y = bulletText(doc, obj, y, contentWidth);
  }
  y += 3;

  // Section 1.2
  if (y > 220) {
    doc.addPage();
    page++;
    addHeader(doc);
    addFooter(doc, page - 1);
    y = 30;
  }

  y = sectionTitle(doc, "1.2   Hypothèses", y);
  y = bodyText(doc, "Les hypothèses suivantes ont été prises en compte pour l'élaboration de la présente offre :", 15, y, contentWidth);

  const hypotheses = getHypotheses(soumission.type_etude);
  for (const h of hypotheses) {
    if (y > 255) {
      doc.addPage();
      page++;
      addHeader(doc);
      addFooter(doc, page - 1);
      y = 30;
    }
    y = bulletText(doc, h, y, contentWidth);
  }
  y += 3;

  // Section 2
  if (y > 210) {
    doc.addPage();
    page++;
    addHeader(doc);
    addFooter(doc, page - 1);
    y = 30;
  }

  y = sectionTitle(doc, "2.   Livrables", y);
  y = bodyText(doc, "Les livrables du mandat sont les suivants :", 15, y, contentWidth);

  const livrables = [
    "Attestation (lettre) de classification de l'établissement, incluant l'identification des rubriques applicables et la détermination du régime d'autorisation.",
    "PSI – Plan de Sûreté Interne.",
    "Étude environnementale : Étude d'Impact sur l'Environnement (EIE) OU Notice d'Impact / Audit environnemental, selon la catégorie de l'établissement.",
    "Rapport de risques : Étude de Dangers OU Rapport sur les produits dangereux, selon la catégorie de l'installation.",
  ];
  for (const l of livrables) {
    y = bulletText(doc, l, y, contentWidth);
  }
  y += 3;

  // Section 3
  if (y > 220) {
    doc.addPage();
    page++;
    addHeader(doc);
    addFooter(doc, page - 1);
    y = 30;
  }

  y = sectionTitle(doc, "3.   Échéancier", y);
  y = bodyText(
    doc,
    `Le délai global d'exécution est de ${soumission.delai_jours} jours à compter de la réception de la commande et du paiement de l'avance (voir section Budget). Ce délai couvre la préparation et la remise des livrables prévus au mandat, sous réserve de la disponibilité des informations et accès nécessaires.`,
    15,
    y,
    contentWidth
  );
  y += 3;

  // Section 4 - Budget
  doc.addPage();
  page++;
  addHeader(doc);
  addFooter(doc, page - 1);
  y = 30;

  y = sectionTitle(doc, "4.   Budget", y);
  y = bodyText(doc, "Le mandat est réalisé au forfait conformément au devis ci-dessous (montants en DZD, hors taxes) :", 15, y, contentWidth);
  y += 2;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_RGB);
  doc.text("Tableau 4-1 – Détail du devis", 15, y);
  y += 5;

  const total_ht = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
  const tva = total_ht * 0.19;
  const total_ttc = total_ht + tva;

  autoTable(doc, {
    startY: y,
    head: [["N°", "Désignation", "Q", "Prix (DZD)"]],
    body: [
      ...lignes.map((l) => [
        String(l.numero),
        l.designation,
        String(l.quantite),
        formatMontant(l.prix_unitaire),
      ]),
      [{ content: "Total hors taxes", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } }, formatMontant(total_ht)],
    ],
    headStyles: { fillColor: GRAY_RGB, textColor: TEXT_RGB, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      2: { halign: "center", cellWidth: 12 },
      3: { halign: "right", cellWidth: 35 },
    },
    margin: { left: 15, right: 15 },
    theme: "grid",
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_RGB);
  doc.text("Tableau 4-2 – Récapitulation et modalités de paiements", 15, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      [
        { content: "Total hors taxes", styles: { halign: "right" as const, fontStyle: "bold" as const } },
        { content: formatMontant(total_ht), styles: { halign: "right" as const } },
      ],
      [
        { content: "TVA 19%", styles: { halign: "right" as const, fontStyle: "bold" as const } },
        { content: formatMontant(tva), styles: { halign: "right" as const } },
      ],
      [
        { content: "Total TTC", styles: { halign: "right" as const, fontStyle: "bold" as const, fillColor: GRAY_RGB } },
        { content: formatMontant(total_ttc), styles: { halign: "right" as const, fontStyle: "bold" as const, fillColor: GRAY_RGB } },
      ],
    ],
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { halign: "right" as const },
      1: { halign: "right" as const, cellWidth: 40 },
    },
    margin: { left: 15, right: 15 },
    theme: "grid",
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_RGB);
  y = bodyText(
    doc,
    "Modalités de paiement : 50 % à l'acceptation / réception de la commande (avance), 50 % à la remise des livrables finaux.",
    15,
    y,
    contentWidth
  );

  // Section 5
  if (y > 210) {
    doc.addPage();
    page++;
    addHeader(doc);
    addFooter(doc, page - 1);
    y = 30;
  }

  y = sectionTitle(doc, "5.   Inclusion et exclusion", y);
  y = sectionTitle(doc, "5.1   Inclusions", y);
  y = bodyText(doc, "Sont inclus dans le mandat, dans la limite des livrables définis à la section 2 :", 15, y, contentWidth);

  const inclusions = [
    "La collecte et revue des informations disponibles auprès du client (réunions de lancement et suivi).",
    "La veille réglementaire nécessaire à la conformité des livrables.",
    "La rédaction, compilation et remise des rapports et documents finaux.",
    "Un échange technique (commentaires/ajustements) par livrable avant émission finale.",
  ];
  for (const inc of inclusions) y = bulletText(doc, inc, y, contentWidth);
  y += 3;

  y = sectionTitle(doc, "5.2   Exclusions du mandat", y);
  y = bodyText(doc, "Les éléments suivants ne sont pas inclus dans la présente offre :", 15, y, contentWidth);

  const exclusions = [
    "Les analyses des eaux effectuées en laboratoire (coûts et délais d'un tiers).",
    "La production ou mise à jour des plans d'architecture/implantation et documents d'ingénierie.",
    "Les frais de dépôt et/ou taxes administratives éventuelles auprès des autorités.",
    "Tout service additionnel non explicitement mentionné dans les livrables (section 2).",
  ];
  for (const exc of exclusions) y = bulletText(doc, exc, y, contentWidth);

  // Section 6
  if (y > 200) {
    doc.addPage();
    page++;
    addHeader(doc);
    addFooter(doc, page - 1);
    y = 30;
  }

  y += 3;
  y = sectionTitle(doc, "6.   Conditions générales", y);

  const conditions = [
    "Validité : La présente offre est valide pour une période de trente (30) jours à compter de sa date d'émission.",
    "Confidentialité : Les informations reçues du client et les documents produits sont traités de manière confidentielle.",
    "Accès au site : Le client facilite l'accès au site et fournit les informations nécessaires. Les délais peuvent être ajustés en cas de retard.",
    "Révisions : Une ronde de commentaires/ajustements par livrable est incluse. Toute révision majeure fera l'objet d'un avenant.",
    "Responsabilités : Le consultant s'engage à produire des livrables conformes aux exigences réglementaires applicables.",
    "Paiement : Le démarrage du mandat est conditionné par la réception de l'avance de 50 %.",
  ];
  for (const c of conditions) y = bodyText(doc, c, 15, y, contentWidth);

  // Closing + signatures
  if (y > 200) {
    doc.addPage();
    page++;
    addHeader(doc);
    addFooter(doc, page - 1);
    y = 30;
  }

  y += 5;
  y = bodyText(doc, "N'hésitez pas à communiquer avec nous si vous désirez des informations additionnelles.", 15, y, contentWidth);
  y = bodyText(
    doc,
    `Espérant le tout selon vos attentes, nous vous prions d'agréer, ${civiliteLong}, l'expression de nos meilleurs sentiments.`,
    15,
    y,
    contentWidth
  );

  y += 15;

  // Signature blocks — two columns: left = Responsable, right = Autorisé
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_RGB);
  doc.text("Responsable de l'offre :", 15, y);
  doc.text("Autorisé par :", pageWidth / 2 + 10, y);

  // Space for handwritten signatures (~35 mm)
  y += 35;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_RGB);
  doc.text(parametres?.signataire1_nom ?? "Hakim Belghouini", 15, y);
  doc.text(parametres?.signataire2_nom ?? "Amine Lahmer", pageWidth / 2 + 10, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(parametres?.signataire1_titre ?? "Expert Co-gérant", 15, y);
  doc.text(parametres?.signataire2_titre ?? "Expert Gérant", pageWidth / 2 + 10, y);

  y += 25;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_RGB);
  doc.text("Acceptation de l'offre :", 15, y);

  // Space for client handwritten signature (~35 mm)
  y += 35;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_RGB);
  doc.text(`${client.titre} ${client.nom_contact}`, 15, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`${client.poste} — ${client.entreprise}`, 15, y);

  // Add footer to last page
  addFooter(doc, page);

  return doc.output("arraybuffer");
}
