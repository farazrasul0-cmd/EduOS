export interface QuestionPaperInput { school: string; exam: string; className: string; subject: string; date: string; totalMarks: number; questions: { prompt: string; marks: number; options?: string[] | null }[] }
const esc = (value: string) => value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

export function createQuestionPaperPdf(input: QuestionPaperInput): Uint8Array {
  const content = [
    `BT /F1 17 Tf 50 790 Td (${esc(input.school)}) Tj`,
    `0 -25 Td /F1 13 Tf (${esc(input.exam)}) Tj`,
    `0 -20 Td /F1 10 Tf (Class: ${esc(input.className)}   Subject: ${esc(input.subject)}) Tj`,
    `0 -16 Td (Date: ${esc(input.date || '-')}   Total marks: ${input.totalMarks}) Tj`,
    '0 -24 Td (Answer all questions. Show your working where applicable.) Tj',
    ...input.questions.flatMap((question, index) => {
      const rows = [`0 -24 Td /F1 11 Tf (${index + 1}. ${esc(question.prompt.slice(0, 78))}  [${question.marks}]) Tj`]
      question.options?.forEach((option, optionIndex) => rows.push(`0 -16 Td /F1 9 Tf (${String.fromCharCode(65 + optionIndex)}. ${esc(option.slice(0, 72))}) Tj`))
      return rows
    }),
    '0 -30 Td /F1 9 Tf (End of question paper) Tj ET',
  ].join('\n')
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>', `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
  let pdf = '%PDF-1.4\n'; const offsets = [0]
  objects.forEach((object, index) => { offsets.push(new TextEncoder().encode(pdf).length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n` })
  const xref = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => String(offset).padStart(10, '0') + ' 00000 n ').join('\n')}\ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(pdf)
}
