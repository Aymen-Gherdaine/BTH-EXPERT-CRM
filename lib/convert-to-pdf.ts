export async function convertToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const apiKey = process.env.CLOUDMERSIVE_API_KEY;
  if (!apiKey) throw new Error('CLOUDMERSIVE_API_KEY is not set');

  const formData = new FormData();
  const arrayBuf = docxBuffer.buffer.slice(
    docxBuffer.byteOffset,
    docxBuffer.byteOffset + docxBuffer.byteLength,
  ) as ArrayBuffer;
  formData.append('inputFile', new Blob([arrayBuf], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }), 'document.docx');

  const response = await fetch('https://api.cloudmersive.com/convert/docx/to/pdf', {
    method: 'POST',
    headers: { Apikey: apiKey },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Cloudmersive error ${response.status}: ${text}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
