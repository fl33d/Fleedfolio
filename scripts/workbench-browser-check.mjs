import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
const browserModule = process.env.PLAYWRIGHT_IMPORT
if (!browserModule) throw new Error('Provide an installed Playwright module with PLAYWRIGHT_IMPORT')
const { chromium } = await import(browserModule)
const base = process.env.WORKBENCH_BASE_URL || 'http://127.0.0.1:3000'
const artifact = process.env.WORKBENCH_SCREENSHOTS || 'artifacts/workbench-review'
await mkdir(artifact, { recursive:true })
const browser = await chromium.launch({ headless:true, args:['--no-sandbox'] })
const results = []
let failing=false
try {
  for (const width of [320,390,768,1024,1440]) {
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',colorScheme:'light'})
    const page=await context.newPage()
    await page.addInitScript(() => {
      localStorage.setItem('fleedfolio:tour:v1','1')
      localStorage.removeItem('blank:draft')
      localStorage.removeItem('blank:published')
    })
    const errors=[]
    page.on('pageerror', error=>errors.push(error.message))
    try {
      const response=await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:60000})
      if (!response?.ok()) throw new Error('Classic HTTP '+response?.status())
      await page.waitForTimeout(700) // Allow the legacy draft restoration effect to complete.
      const toolbar=page.getByRole('banner',{name:'Fleedfolio editor toolbar'})
      await toolbar.waitFor({timeout:30000})
      const field=page.locator('.pf-name .field-input').first()
      await field.waitFor({timeout:20000})
      await field.fill('Riley Example')
      await page.waitForTimeout(600)
      if (!(await field.inputValue()).includes('Riley Example')) throw new Error('Inline name change failed')
      await toolbar.getByRole('button',{name:'Open elements library'}).click()
      await page.getByRole('complementary',{name:'Elements library'}).waitFor()
      // Critical regression: library must be non-modal, and the canvas stays writable.
      await field.fill('Riley Portfolio')
      if (!(await field.inputValue()).includes('Riley Portfolio')) throw new Error('Inline editing blocked while library is open')
      if (!(await page.getByRole('complementary',{name:'Elements library'}).isVisible())) throw new Error('Library closed while typing')
      const search=page.getByRole('textbox',{name:'Search elements'})
      await search.fill('Text')
      await page.locator('.ff-library .element-option').first().click()
      await page.waitForTimeout(260)
      if (!(await page.locator('.portfolio').innerText()).includes('Riley Portfolio')) throw new Error('Adding element discarded existing text')
      await toolbar.getByRole('button',{name:'Close elements library'}).click()
      // Autocomplete for programming languages is presented with an actual logo.
      const skillInput=page.locator('.pf-chip-input')
      await skillInput.fill('Python')
      await skillInput.press('Enter')
      await page.waitForTimeout(180)
      if (!(await page.locator('.pf-chip').innerText()).includes('Python')) throw new Error('Python autocomplete could not add skill')
      const customise=toolbar.getByRole('button',{name:'Customise your portfolio'})
      await customise.click()
      const inspector=page.getByRole('dialog',{name:'Customise portfolio'})
      await inspector.waitFor()
      await inspector.getByRole('button',{name:'Hidden',exact:true}).click()
      await inspector.getByRole('button',{name:'Logo + name',exact:true}).click()
      if (width===390||width===1440) {
        await page.screenshot({path:path.join(artifact,width+'-inspector.png'),fullPage:true,animations:'disabled'})
      }
      await customise.click()
      if (width===390||width===1440) await page.screenshot({path:path.join(artifact,width+'-editor.png'),fullPage:true,animations:'disabled'})
      await toolbar.getByRole('button',{name:/Preview/}).click()
      await page.locator('.mode-view .portfolio').waitFor()
      if (await page.locator('.pf-identity').count() !== 0) throw new Error('Identity hidden mode not respected')
      const list=page.locator('.pf-skills-list')
      await list.waitFor()
      if (await list.getAttribute('data-skill-display')!=='both') throw new Error('Skill appearance preference lost')
      if (!(await page.locator('.mode-view .portfolio').innerText()).includes('Riley Portfolio')) throw new Error('Preview lost inline editing')
      if (width===390||width===1440) await page.screenshot({path:path.join(artifact,width+'-preview.png'),fullPage:true,animations:'disabled'})
      const dims=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}))
      if (dims.scroll > dims.viewport+1) throw new Error('Horizontal overflow '+JSON.stringify(dims))
      if(errors.length) throw new Error('Page errors: '+errors.join('; '))
      results.push({width,result:'PASS',dimensions:dims})
    } catch (error) {
      failing=true
      results.push({width,result:'FAIL',error:String(error),pageErrors:errors})
      try { await page.screenshot({path:path.join(artifact,width+'-failed.png'),fullPage:true,animations:'disabled'}) } catch {}
    } finally { await context.close() }
  }
} finally {
  await browser.close()
  await writeFile(path.join(artifact,'results.json'),JSON.stringify(results,null,2)+'\n')
  console.log('Fleedfolio workbench browser QA:\n'+JSON.stringify(results,null,2))
}
if(failing) process.exitCode=1
