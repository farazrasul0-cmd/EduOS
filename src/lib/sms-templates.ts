import type { AppLanguage } from '@/i18n'

export interface AbsentSmsParams {
  student: string
  className?: string | null
  date: string
  school: string
}

export interface FeeReceiptSmsParams {
  student: string
  amount: number | string
  receiptNo: string
  school: string
}

export interface ResultSmsParams {
  student: string
  exam: string
  gpa: number | string
  school: string
}

export const smsTemplates = {
  absent: (p: AbsentSmsParams, lang: AppLanguage = 'bn'): string => {
    const classText = p.className ? ` (${p.className})` : ''
    if (lang === 'bn') {
      return `সম্মানিত অভিভাবক, আপনার সন্তান ${p.student}${classText} আজ ${p.date} তারিখে বিদ্যালয়ে অনুপস্থিত। ${p.school}`
    }
    return `Dear Guardian, your child ${p.student}${classText} was marked absent on ${p.date}. ${p.school}`
  },

  feeReceipt: (p: FeeReceiptSmsParams, lang: AppLanguage = 'bn'): string => {
    if (lang === 'bn') {
      return `ফি পরিশোধ সফল: ${p.student}-এর জন্য ৳${p.amount} গ্রহণ করা হয়েছে (রসিদ: ${p.receiptNo})। ধন্যবাদ, ${p.school}।`
    }
    return `Payment received: Tk ${p.amount} for ${p.student} (Receipt: ${p.receiptNo}). Thank you, ${p.school}.`
  },

  result: (p: ResultSmsParams, lang: AppLanguage = 'bn'): string => {
    if (lang === 'bn') {
      return `${p.student}-এর ${p.exam} পরীক্ষার ফলাফল প্রকাশিত হয়েছে। জিপিএ: ${p.gpa}। ${p.school}`
    }
    return `Results for ${p.exam} have been published for ${p.student}. GPA: ${p.gpa}. ${p.school}`
  },

  notice: (text: string, school: string, lang: AppLanguage = 'bn'): string => {
    if (lang === 'bn') {
      return `নোটিশ: ${text}। ${school}`
    }
    return `Notice: ${text}. ${school}`
  },
}
