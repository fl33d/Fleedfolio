/**
 * Browser-only, staging-safe smoke review of the actual React Studio route.
 * No production credentials, writes, or Cloudflare deployment.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const source = process.env.PLAYWRIGHT_IMPORT
if (!source) throw new Error('Set PLAYWRIGHT_IMPORT to the installed Playwright module')
const { chromium } = await import(source)
const base = process.env.STUDIO_BASE_URL || 'http://127.0.0.1:3000'
const directory = process.env.STUDIO_SCREENSHOTS || 'artifacts/studio-browser'
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const report = []
let failing = false

try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    try {
      const response = await page.goto(base + '/studio', { waitUntil: 'domcontentloaded', timeout: 60000 })
      if (!response?.ok()) throw new Error('Studio HTTP status: ' + (response?.status() ?? 'no response'))
      await page.getByRole('heading', { name: /make it yours/i }).waitFor({ timeout: 20000 })
      await page.locator('.stx-shell[data-hydrated="true"]').waitFor({ timeout: 20000 })
      // React event handlers may not be ready until hydration has finished.
      const name = page.getByRole('textbox', { name: 'Your name' })
      await name.fill('Avery Design Test')
      await page.waitForFunction(() => document.querySelector('main.stx-public h1')?.textContent?.includes('Avery Design Test'), null, { timeout: 10000 })
      const achievementSection = page.locator('section[aria-labelledby="stx-your-achievements"]')
      await achievementSection.getByRole('button', { name: /add an achievement/i }).click()
      await achievementSection.getByRole('textbox', { name: 'Title' }).last().fill('Browser-tested creative milestone')
      await page.waitForFunction(() => document.querySelector('main.stx-public')?.textContent?.includes('Browser-tested creative milestone'), null, { timeout: 10000 })
      await page.waitForTimeout(650)
      const markup = await page.locator('main.stx-public').innerText()
      if (!markup.includes('Avery Design Test') || !markup.includes('Browser-tested creative milestone')) throw new Error('Simple name/achievement edit not reflected in portfolio')
      await page.getByRole('button', { name: 'Studio', exact: true }).click()
      if (!(await page.locator('main.stx-public').innerText()).includes('Avery Design Test') || !(await page.locator('main.stx-public').innerText()).includes('Browser-tested creative milestone')) throw new Error('Studio lost shared edits')
      if (width === 390 || width === 1440) {
        await page.screenshot({ path: path.join(directory, width + '-studio.png'), fullPage: true, animations: 'disabled' })
      }
      await page.getByRole('button', { name: 'Simple', exact: true }).click()
      if (await name.inputValue() !== 'Avery Design Test') throw new Error('Simple lost value after Studio')
      await page.screenshot({ path: path.join(directory, width + '-simple.png'), fullPage: true, animations: 'disabled' })
      const classic = await page.getByRole('link', { name: /classic/i }).first().getAttribute('href')
      if (classic !== '/') throw new Error('Classic legacy route missing')
      await page.getByRole('button', { name: 'Preview', exact: true }).click()
      if (!(await page.locator('main.stx-public').innerText()).includes('Avery Design Test')) throw new Error('Visitor preview lost name')
      if (width === 390 || width === 1440) await page.screenshot({ path: path.join(directory, width + '-preview.png'), fullPage: true, animations: 'disabled' })
      await page.waitForTimeout(500)
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('textbox', { name: 'Your name' }).waitFor({ timeout: 20000 })
      if (await page.getByRole('textbox', { name: 'Your name' }).inputValue() !== 'Avery Design Test') throw new Error('Local draft did not survive reload')
      if (!(await page.locator('main.stx-public').innerText()).includes('Browser-tested creative milestone')) throw new Error('Achievement not restored from local draft')
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        page: document.documentElement.scrollWidth,
      }))
      if (dimensions.page > dimensions.viewport + 1) throw new Error('Horizontal overflow at ' + width + ': ' + JSON.stringify(dimensions))
      if (errors.length) throw new Error('Page exception: ' + errors.join('; '))
      report.push({ width, result: 'PASS', dimensions, errors: [] })
    } catch (error) {
      failing = true
      report.push({ width, result: 'FAIL', error: String(error), errors })
      try { await page.screenshot({ path: path.join(directory, width + '-failed.png'), fullPage: true, animations: 'disabled' }) } catch {}
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
  await writeFile(path.join(directory, 'results.json'), JSON.stringify(report, null, 2) + '\n')
  console.log('Studio browser review:\n' + JSON.stringify(report, null, 2))
}
if (failing) process.exitCode = 1
