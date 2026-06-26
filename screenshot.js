const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 900 }
  })
  const page = await browser.newPage()
  await page.goto('http://localhost:3000/crm', { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1800))

  const screens = [
    { name: 'dashboard',  click: null },
    { name: 'estimate',   click: "a[data-section='estimate-new']" },
    { name: 'estimates',  click: "a[data-section='estimates']" },
    { name: 'dispatch',   click: "a[data-section='dispatch']" },
    { name: 'schedule',   click: "a[data-section='schedule']" },
    { name: 'customers',  click: "a[data-section='customers']" },
    { name: 'invoices',   click: "a[data-section='invoices']" },
    { name: 'settings',   click: "a[data-section='settings']" },
  ]

  for (const s of screens) {
    if (s.click) {
      await page.click(s.click)
      await new Promise(r => setTimeout(r, 1000))
    }
    await page.screenshot({ path: `/tmp/${s.name}.png` })
    console.log('✅', s.name)
  }

  await browser.close()
})()
