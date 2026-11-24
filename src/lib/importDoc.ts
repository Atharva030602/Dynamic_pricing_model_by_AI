// Turn an uploaded PDF or text file into headline / standfirst / body. Runs in the browser; nothing is uploaded.
export interface Imported { title: string; dek: string; body: string; pages?: number; name: string }

export async function importFile(file: File): Promise<Imported> {
  if (file.size > 15 * 1024 * 1024) throw new Error('That file is over 15 MB. Try a smaller PDF.')
  const name = file.name
  let text = ''
  let pages: number | undefined
  if (/\.pdf$/i.test(name) || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
    pages = doc.numPages
    const out: string[] = []
    for (let i = 1; i <= Math.min(doc.numPages, 40); i++) {
      const page = await doc.getPage(i)
      const c = await page.getTextContent()
      let line = ''
      let lastY: number | null = null
      for (const it of c.items as { str: string; transform: number[]; hasEOL?: boolean }[]) {
        const y = it.transform[5]
        if (lastY !== null && Math.abs(y - lastY) > 14) { out.push(line.trim()); line = '' }
        line += it.str + (it.hasEOL ? '\n' : ' ')
        lastY = y
      }
      out.push(line.trim(), '')
    }
    text = out.join('\n')
    if (text.replace(/\s/g, '').length < 40) throw new Error('This PDF has no selectable text (it may be a scan). Paste the text instead.')
  } else if (/\.(txt|md|markdown)$/i.test(name) || file.type.startsWith('text/')) {
    text = await file.text()
  } else {
    throw new Error('Use a PDF, .txt or .md file.')
  }
  return { ...split(text), pages, name }
}

function split(raw: string) {
  const paras = raw.replace(/\r/g, '').split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()).filter(Boolean)
  const title = (paras.shift() || 'Untitled').replace(/^#+\s*/, '').slice(0, 160)
  const dekCandidate = paras[0] && paras[0].length < 260 ? paras.shift()! : ''
  return { title, dek: dekCandidate, body: paras.join('\n\n') }
}
