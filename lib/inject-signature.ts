import type PizZip from "pizzip";

/**
 * Injection de signatures dans un DOCX par manipulation OOXML directe.
 *
 * Pourquoi cette approche plutôt qu'un module image docxtemplater :
 * les modules image (docxtemplater-image-module-free, forks) partagent un vieux
 * code incompatible avec l'API interne de docxtemplater 3.68+ (crash
 * "Cannot read properties of undefined (reading '0')"). Ici on n'a AUCUNE
 * dépendance de module : on écrit directement le XML OOXML standard.
 * Conséquence : ça ne recassera pas au prochain upgrade de docxtemplater.
 *
 * Principe : le template contient un marqueur texte (@@SIG1@@). Après le rendu
 * docxtemplater, on remplace ce marqueur par une image inline (ou on le retire
 * si aucune signature n'est fournie).
 */

type ImageType = "png" | "jpeg" | null;

/** Détecte le vrai format via les magic bytes (évite le piège du JPEG renommé .png). */
function detectImageType(buffer: Buffer | null): ImageType {
  if (!buffer || buffer.length < 4) return null;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
    return "png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  return null;
}

/** Lit les dimensions natives (PNG/JPEG) pour préserver le ratio. */
function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  const type = detectImageType(buffer);
  if (type === "png") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (type === "jpeg") {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  }
  return null;
}

/**
 * Remplace un marqueur texte par une image inline dans un DOCX déjà rendu.
 *
 * @param zip            le PizZip du document rendu (doc.getZip())
 * @param marker         ex: "@@SIG1@@"
 * @param imageBuffer    bytes de l'image, ou null/undefined si pas de signature
 * @param targetWidthPx  largeur cible en px (hauteur calculée pour garder le ratio)
 * @param maxHeightPx    hauteur max en px (contrainte si signature très haute)
 * @returns true si une image a été injectée, false si le marqueur a été retiré / absent
 */
export function placeSignature(
  zip: PizZip,
  marker: string,
  imageBuffer: Buffer | null | undefined,
  targetWidthPx = 150,
  maxHeightPx = 60
): boolean {
  let docXml = zip.file("word/document.xml")!.asText();
  if (!docXml.includes(marker)) return false;

  const buf = imageBuffer ?? null;
  const type = detectImageType(buf);

  // Pas d'image valide → retirer le marqueur proprement (signature optionnelle)
  if (!buf || buf.length === 0 || !type) {
    docXml = docXml.replace(marker, "");
    zip.file("word/document.xml", docXml);
    return false;
  }

  // Dimensions en préservant le ratio
  const dims = getImageDimensions(buf);
  let widthPx = targetWidthPx;
  let heightPx = Math.round(targetWidthPx * 0.3);
  if (dims && dims.width > 0 && dims.height > 0) {
    heightPx = Math.round(targetWidthPx * (dims.height / dims.width));
    if (heightPx > maxHeightPx) {
      heightPx = maxHeightPx;
      widthPx = Math.round(maxHeightPx * (dims.width / dims.height));
    }
  }

  const EMU = 9525; // 1px = 9525 EMU à 96 DPI
  const cx = Math.round(widthPx * EMU);
  const cy = Math.round(heightPx * EMU);
  const ext = type === "jpeg" ? "jpeg" : "png";
  const contentType = type === "jpeg" ? "image/jpeg" : "image/png";

  // 1. Image dans word/media/
  const safeName = marker.replace(/[^a-zA-Z0-9]/g, "");
  const mediaName = `${safeName}.${ext}`;
  zip.file(`word/media/${mediaName}`, buf);

  // 2. Content type
  let ct = zip.file("[Content_Types].xml")!.asText();
  if (!ct.includes(`Extension="${ext}"`)) {
    ct = ct.replace(
      "</Types>",
      `<Default Extension="${ext}" ContentType="${contentType}"/></Types>`
    );
    zip.file("[Content_Types].xml", ct);
  }

  // 3. Relationship (rId libre)
  const relsPath = "word/_rels/document.xml.rels";
  let rels = zip.file(relsPath)!.asText();
  const existingIds = [...rels.matchAll(/Id="rId(\d+)"/g)].map((m) => parseInt(m[1], 10));
  const newId = (existingIds.length ? Math.max(...existingIds) : 0) + 1;
  const rId = `rId${newId}`;
  rels = rels.replace(
    "</Relationships>",
    `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${mediaName}"/></Relationships>`
  );
  zip.file(relsPath, rels);

  // 4. Drawing inline (ferme le <w:t> courant, insère l'image, rouvre un <w:t>)
  const drawing =
    `</w:t></w:r><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${1000 + newId}" name="${mediaName}"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${1000 + newId}" name="${mediaName}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r><w:r><w:t xml:space="preserve">`;

  docXml = docXml.replace(marker, drawing);
  zip.file("word/document.xml", docXml);
  return true;
}