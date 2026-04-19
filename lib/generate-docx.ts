import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  Tab,
  TabStopType,
  TabStopPosition,
  convertInchesToTwip,
  UnderlineType,
} from "docx";
import { Client, LigneBudget, Soumission, TypeEtude } from "@/types";
import { formatDateFr, formatMontant } from "./utils";

const PRIMARY = "2E7DB2";
const BLACK = "000000";
const GRAY_LIGHT = "F4F6F7";

function heading1(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        color: PRIMARY,
        size: 24,
      }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        color: PRIMARY,
        size: 22,
      }),
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20 })],
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function bulletPoint(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20 })],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function tableHeaderCell(text: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 18, color: BLACK })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { type: ShadingType.CLEAR, fill: GRAY_LIGHT },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
    },
  });
}

function tableDataCell(text: string, align = AlignmentType.LEFT): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 18 })],
        alignment: align,
      }),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
  });
}

function tableTotalRow(label: string, value: string, bold = false): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold, size: 18 })],
            alignment: AlignmentType.RIGHT,
          }),
        ],
        columnSpan: 3,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: value, bold, size: 18 })],
            alignment: AlignmentType.RIGHT,
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        },
      }),
    ],
  });
}

function getHypotheses(type: TypeEtude): string[] {
  const base = [
    "La classification de l'établissement au titre du décret 07-144 constitue l'étape préalable déterminante pour préciser le régime d'autorisation (Ministère, Wilaya ou APC).",
    "Les informations de base (capacités, procédés, intrants, plans d'implantation disponibles, listes de produits, volumes stockés, etc.) seront fournies par le client et réputées exactes.",
    "Les délais d'exécution s'entendent hors délais d'instruction administrative et hors délais de réalisation d'analyses de laboratoire effectuées par des tiers.",
  ];

  if (type === "EIE+Dangers") {
    return [
      "La classification de l'établissement au titre du décret 07-144 constitue l'étape préalable déterminante pour préciser le régime d'autorisation (Ministère, Wilaya ou APC).",
      "Selon la classification retenue, une Étude d'Impact sur l'Environnement (EIE) accompagnée d'une Étude de Dangers sera réalisée.",
      ...base.slice(1),
    ];
  } else if (type === "Notice+ProduitsDangereux") {
    return [
      "La classification de l'établissement au titre du décret 07-144 constitue l'étape préalable déterminante pour préciser le régime d'autorisation (Ministère, Wilaya ou APC).",
      "Selon la classification retenue, une Notice d'Impact / Audit environnemental accompagnée d'un rapport sur les produits dangereux sera réalisée.",
      ...base.slice(1),
    ];
  }
  return base;
}

export async function generateDocx(
  soumission: Soumission,
  client: Client,
  lignes: LigneBudget[],
  contexteData: { section_1: string; section_1_1: string }
): Promise<Buffer> {
  const dateStr = formatDateFr(soumission.date_offre);
  const civiliteLong =
    client.titre === "M." ? "Monsieur" : client.titre === "Mme" ? "Madame" : client.titre;

  const objectifsBullets = contexteData.section_1_1
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^-\s*/, "").trim());

  const hypotheses = getHypotheses(soumission.type_etude);

  const total_ht = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
  const tva = total_ht * 0.19;
  const total_ttc = total_ht + tva;

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20 },
        },
      },
    },
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "BTH EXPERT", bold: true, size: 20, color: PRIMARY }),
                  new TextRun({ break: 1 }),
                  new TextRun({ text: "ENVIRONNEMENT", size: 16, color: "666666" }),
                  new TextRun({ break: 1 }),
                  new TextRun({ text: "INGÉNIERIE", size: 16, color: "666666" }),
                ],
                alignment: AlignmentType.RIGHT,
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: PRIMARY },
                },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "BTH EXPERT", size: 16, color: "888888" }),
                  new Tab(),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" }),
                ],
                tabStops: [
                  {
                    type: TabStopType.CENTER,
                    position: convertInchesToTwip(3.25),
                  },
                ],
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                },
              }),
            ],
          }),
        },
        children: [
          // Client info block
          new Paragraph({
            children: [
              new TextRun({
                text: `${client.titre} ${client.nom_contact}, ${client.poste}`,
                bold: true,
                size: 20,
              }),
            ],
            spacing: { before: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: client.entreprise, size: 20 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: client.adresse, size: 20 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: client.ville, size: 20 })],
            spacing: { after: 400 },
          }),

          // Offre No
          new Paragraph({
            children: [
              new TextRun({ text: "Offre No : ", bold: true, size: 20 }),
              new TextRun({ text: soumission.numero_offre, bold: true, size: 20, color: PRIMARY }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 200 },
          }),

          // OBJET
          new Paragraph({
            children: [new TextRun({ text: "OBJET :", bold: true, size: 22 })],
            spacing: { before: 200, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Offre de services professionnels",
                bold: true,
                color: PRIMARY,
                size: 22,
              }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: soumission.titre_projet,
                bold: true,
                color: PRIMARY,
                size: 22,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Salutation
          new Paragraph({
            children: [
              new TextRun({ text: `${civiliteLong} ${client.nom_contact.split(" ")[0]},`, size: 20 }),
            ],
            spacing: { after: 200 },
          }),

          // Intro
          bodyParagraph(
            `Sarl BTH EXPERT a le plaisir de vous transmettre son offre de services professionnels relative au projet ${soumission.titre_projet.toLowerCase()}.`
          ),

          // Section 1
          heading1("1.\tContexte et objectifs"),
          ...contexteData.section_1
            .split("\n")
            .filter((p) => p.trim())
            .map((p) => bodyParagraph(p.trim())),

          // Section 1.1
          heading2("1.1\tObjectifs du projet"),
          bodyParagraph("Les objectifs du projet et du mandat sont les suivants :"),
          ...objectifsBullets.map((b) => bulletPoint(b)),

          // Section 1.2
          heading2("1.2\tHypothèses"),
          bodyParagraph(
            "Les hypothèses suivantes ont été prises en compte pour l'élaboration de la présente offre :"
          ),
          ...hypotheses.map((h) => bulletPoint(h)),

          // Section 2
          heading1("2.\tLivrables"),
          bodyParagraph("Les livrables du mandat sont les suivants :"),
          bulletPoint(
            "Attestation (lettre) de classification de l'établissement, incluant l'identification des rubriques applicables et la détermination du régime d'autorisation."
          ),
          bulletPoint("PSI – Plan de Sûreté Interne."),
          bulletPoint(
            "Étude environnementale : Étude d'Impact sur l'Environnement (EIE) OU Notice d'Impact / Audit environnemental, selon la catégorie de l'établissement."
          ),
          bulletPoint(
            "Rapport de risques : Étude de Dangers OU Rapport sur les produits dangereux, selon la catégorie de l'installation."
          ),

          // Section 3
          heading1("3.\tÉchéancier"),
          bodyParagraph(
            `Le délai global d'exécution est de ${soumission.delai_jours} (${numberToWords(soumission.delai_jours)}) jours à compter de la réception de la commande et du paiement de l'avance (voir section Budget). Ce délai couvre la préparation et la remise des livrables prévus au mandat, sous réserve de la disponibilité des informations et accès nécessaires.`
          ),

          // Section 4
          heading1("4.\tBudget"),
          bodyParagraph(
            "Le mandat est réalisé au forfait conformément au devis ci-dessous (montants en DZD, hors taxes) :"
          ),

          // Budget table
          new Paragraph({
            children: [
              new TextRun({ text: "Tableau 4-1 – Détail du devis", bold: true, size: 18 }),
            ],
            spacing: { before: 160, after: 80 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  tableHeaderCell("N°"),
                  tableHeaderCell("Désignation"),
                  tableHeaderCell("Q"),
                  tableHeaderCell("Prix (DZD)"),
                ],
              }),
              ...lignes.map(
                (l) =>
                  new TableRow({
                    children: [
                      tableDataCell(String(l.numero), AlignmentType.CENTER),
                      tableDataCell(l.designation),
                      tableDataCell(String(l.quantite), AlignmentType.CENTER),
                      tableDataCell(formatMontant(l.prix_unitaire), AlignmentType.RIGHT),
                    ],
                  })
              ),
              tableTotalRow("Total hors taxes", formatMontant(total_ht)),
            ],
          }),

          // Récapitulatif
          new Paragraph({
            children: [
              new TextRun({
                text: "Tableau 4-2 – Récapitulation et modalités de paiements",
                bold: true,
                size: 18,
              }),
            ],
            spacing: { before: 240, after: 80 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  tableHeaderCell("N°"),
                  tableHeaderCell("Désignation"),
                  tableHeaderCell("Q"),
                  tableHeaderCell("Prix (DZD)"),
                ],
              }),
              ...lignes.map(
                (l, i) =>
                  new TableRow({
                    children: [
                      tableDataCell(String(i + 1), AlignmentType.CENTER),
                      tableDataCell(l.designation),
                      tableDataCell(String(l.quantite), AlignmentType.CENTER),
                      tableDataCell(formatMontant(l.prix_unitaire), AlignmentType.RIGHT),
                    ],
                  })
              ),
              tableTotalRow("Total hors taxes", formatMontant(total_ht)),
              tableTotalRow("TVA 19%", formatMontant(tva)),
              tableTotalRow("Total TTC", formatMontant(total_ttc), true),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Modalités de paiement : 50 % à l'acceptation / réception de la commande (avance), 50 % à la remise des livrables finaux.",
                bold: true,
                size: 18,
              }),
            ],
            spacing: { before: 160, after: 200 },
          }),

          // Section 5
          heading1("5.\tInclusion et exclusion"),
          heading2("5.1\tInclusions"),
          bodyParagraph("Sont inclus dans le mandat, dans la limite des livrables définis à la section 2 :"),
          bulletPoint("La collecte et revue des informations disponibles auprès du client (réunions de lancement et suivi)."),
          bulletPoint("La veille réglementaire nécessaire à la conformité des livrables."),
          bulletPoint("La rédaction, compilation et remise des rapports et documents finaux (un CD format électronique et/ou une copie papier selon besoin)."),
          bulletPoint("Un échange technique (commentaires/ajustements) par livrable avant émission finale."),

          heading2("5.2\tExclusions du mandat"),
          bodyParagraph("Les éléments suivants ne sont pas inclus dans la présente offre et demeurent à la charge du client, sauf entente additionnelle :"),
          bulletPoint("Les analyses des eaux (rejets, eaux usées, eaux pluviales, etc.) effectuées en laboratoire (coûts et délais d'un tiers)."),
          bulletPoint("La production ou mise à jour des plans d'architecture/implantation détaillés et documents d'ingénierie (plans, coupes, réseaux, etc.)."),
          bulletPoint("Les frais de dépôt et/ou taxes administratives éventuelles auprès des autorités (si applicables)."),
          bulletPoint("Tout service additionnel non explicitement mentionné dans les livrables (section 2)."),

          new Paragraph({
            children: [
              new TextRun({ text: "NOTE - Plan d'Intervention Interne (PII) : ", bold: true, size: 18 }),
              new TextRun({
                text: "La présente soumission ne couvre pas le PII, car son estimation dépend du périmètre et des conclusions de l'Étude de Dangers. Le PII sera discuté et chiffré dans une offre distincte une fois la demande d'autorisation déposée et/ou après finalisation de l'Étude de Dangers.",
                size: 18,
              }),
            ],
            spacing: { before: 160, after: 200 },
          }),

          // Section 6
          heading1("6.\tConditions générales"),
          bodyParagraph("Validité : La présente offre est valide pour une période de trente (30) jours à compter de sa date d'émission."),
          bodyParagraph("Confidentialité : Les informations reçues du client et les documents produits dans le cadre du mandat sont traités de manière confidentielle et utilisés exclusivement pour les fins du projet."),
          bodyParagraph("Accès au site et informations : Le client facilite l'accès au site et fournit les informations nécessaires (procédés, capacités, listes de produits, quantités stockées, plans disponibles, etc.). Les délais peuvent être ajustés en cas de retard de transmission."),
          bodyParagraph("Révisions : Une ronde de commentaires/ajustements par livrable est incluse. Toute révision majeure liée à une modification du projet, du procédé, des capacités ou des exigences administratives fera l'objet d'un avenant."),
          bodyParagraph("Responsabilités : Le consultant s'engage à produire des livrables conformes aux exigences réglementaires applicables. L'obtention de l'autorisation demeure conditionnée à l'instruction et à la décision de l'autorité compétente."),
          bodyParagraph("Paiement : Le démarrage du mandat est conditionné par la réception de l'avance de 50 %."),

          // Closing
          new Paragraph({
            children: [
              new TextRun({
                text: "N'hésitez pas à communiquer avec nous si vous désirez des informations additionnelles.",
                size: 20,
              }),
            ],
            spacing: { before: 400, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Espérant le tout selon vos attentes, nous vous prions d'agréer, ${civiliteLong}, l'expression de nos meilleurs sentiments.`,
                size: 20,
              }),
            ],
            spacing: { after: 600 },
            alignment: AlignmentType.JUSTIFIED,
          }),

          // Signatures
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideH: { style: BorderStyle.NONE },
              insideV: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Responsable de l'offre :", size: 18 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Autorisé par :", size: 18 })],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "", size: 18 })], spacing: { before: 600 } }),
                      new Paragraph({
                        children: [new TextRun({ text: "Hakim Belghouini", bold: true, color: PRIMARY, size: 18 })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: "Expert Co-gérant", size: 16, color: "666666" })],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "", size: 18 })], spacing: { before: 600 } }),
                      new Paragraph({
                        children: [new TextRun({ text: "Amine Lahmer", bold: true, color: PRIMARY, size: 18 })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: "Expert Gérant", size: 16, color: "666666" })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Acceptance
          new Paragraph({
            children: [new TextRun({ text: "Acceptation de l'offre :", size: 18 })],
            spacing: { before: 600, after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${client.titre} ${client.nom_contact}`,
                bold: true,
                color: PRIMARY,
                size: 18,
              }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: `${client.poste} — ${client.entreprise}`, size: 16, color: "666666" })],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

function numberToWords(n: number): string {
  const words: Record<number, string> = {
    15: "quinze",
    20: "vingt",
    30: "trente",
    45: "quarante-cinq",
    60: "soixante",
    90: "quatre-vingt-dix",
    120: "cent vingt",
  };
  return words[n] ?? String(n);
}
