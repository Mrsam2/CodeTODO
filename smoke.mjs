import { chromium } from 'playwright';
import fs from 'fs';

const shots = 'C:/Users/SAURABH/.gemini/antigravity-ide/brain/bc5a6088-8c82-48c6-aece-d7762c5bdc20/temp_screenshots';
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 860 } });
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE ERROR:', m.text()));

// 1. Auth & Onboarding
await page.goto('http://localhost:8099/');
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

// Sign Up
await page.getByText('Sign Up', { exact: true }).click();
await page.waitForTimeout(400);
const testEmail = `test-${Date.now()}@example.com`;
await page.getByPlaceholder('Email address').fill(testEmail);
await page.getByPlaceholder('Password').fill('password123');
await page.getByText('Create Account', { exact: true }).click();

// Wait for Onboarding screen to fully mount
const onboardingInput = page.getByPlaceholder('e.g. DSA, English Speaking…');
await onboardingInput.waitFor({ state: 'visible', timeout: 8000 });

// Onboarding
await onboardingInput.fill('DSA');
await page.getByPlaceholder('What do you want to achieve?').fill('Crack coding interviews');
await page.getByText('Start my day').click();

// Wait for Today tab to fully load and settle
const quickAddInput = page.getByPlaceholder('Add a quick todo…');
await quickAddInput.waitFor({ state: 'visible', timeout: 30000 });
await page.waitForTimeout(2200); // Allow any pending sync/layout updates to settle
await page.screenshot({ path: `${shots}/02-today.png` });

// 2. Quick-add a manual todo on Today
await quickAddInput.fill('Review notes');
await page.screenshot({ path: `${shots}/03-today-filled.png` });
await page.getByText('Add', { exact: true }).filter({ visible: true }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${shots}/03-today-added.png` });
const hasManual = (await page.textContent('body')).includes('Review notes');
console.log('manual todo added:', hasManual);

// 3. Category detail: add roadmap topics manually
await page.getByRole('link', { name: 'Categories' }).filter({ visible: true }).click();
await page.waitForTimeout(1000);
await page.getByText('Crack coding interviews').click();
await page.waitForTimeout(1200);
await page.getByPlaceholder('Add a main topic manually…').fill('Time Complexity');
await page.getByText('Add', { exact: true }).filter({ visible: true }).click();
await page.waitForTimeout(400);
await page.getByPlaceholder('Add a main topic manually…').fill('Arrays & Strings');
await page.getByText('Add', { exact: true }).filter({ visible: true }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${shots}/04-category-detail.png` });
const catBody = await page.textContent('body');
console.log('first topic unlocked (pending ○):', catBody.includes('Time Complexity'));

// 4. Today: generate todos from roadmap
await page.goBack();
await page.waitForTimeout(800);
await page.getByRole('link', { name: 'Today' }).filter({ visible: true }).click();
await page.waitForTimeout(1000);
await page.getByText('Generate from roadmap').click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${shots}/05-today-generated.png` });
const todayBody = await page.textContent('body');
console.log('generated todo for current node:', todayBody.includes('Time Complexity'));

// 5. Complete the generated todo → roadmap node completes
const doneButtons = page.getByText('Done', { exact: true });
await doneButtons.first().click();
await page.waitForTimeout(600);

// 6. Dashboard
await page.getByRole('link', { name: 'Dashboard' }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: `${shots}/06-dashboard.png` });

// 7. Vault: save a note
await page.getByRole('link', { name: 'Vault' }).click();
await page.waitForTimeout(800);
await page.getByPlaceholder('Note title').fill('Big-O cheat sheet');
await page.getByText('Save note').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${shots}/07-vault.png` });

await browser.close();
console.log('SMOKE OK');
