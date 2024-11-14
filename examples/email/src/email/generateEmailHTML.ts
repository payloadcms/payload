import ejs from 'ejs'
import fs from 'fs'
import juice from 'juice'
import path from 'path'

export const generateEmailHTML = async (data: any): Promise<string> => {
  const templatePath = path.join(process.cwd(), 'src/email/template.ejs')
  const templateContent = fs.readFileSync(templatePath, 'utf8')

  // Compile and render the template with EJS
  const preInlinedCSS = ejs.render(templateContent, { ...data, cta: data.cta || {} })

  // Inline CSS
  const html = juice(preInlinedCSS)

  return Promise.resolve(html)
}
