// ─────────────────────────────────────────────────────────────
// tests/new-request.spec.js — US-02: ยื่นใบขอลาใหม่
// ครอบคลุม: ฟอร์มมีช่องครบ · ประเภทการลาอ่านจาก leaveTypes จริง ·
// บันทึกสำเร็จสร้างใบใหม่ + กลับหน้ารายการ · สถานะเริ่มต้น รอพิจารณา + createdAt อัตโนมัติ ·
// ปุ่มยกเลิกกลับหน้ารายการโดยไม่บันทึก
// ─────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');
const { สมัครพนักงานใหม่ } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await สมัครพนักงานใหม่(page);
});

test('ฟอร์มยื่นใบลาใหม่มีช่องครบตามสเปค', async ({ page }) => {
  await page.goto('/new-leave-request.html');
  await expect(page.locator('#title')).toBeVisible();
  await expect(page.locator('#reason')).toBeVisible();
  await expect(page.locator('#leaveTypeId')).toBeVisible();
  await expect(page.locator('#startDate')).toBeVisible();
  await expect(page.locator('#endDate')).toBeVisible();
  await expect(page.locator('[id="ปุ่มบันทึก"]')).toBeVisible();
  await expect(page.locator('a', { hasText: 'ยกเลิก' })).toBeVisible();
});

test('รายการเลื่อนลงประเภทการลา อ่านมาจากโฟลเดอร์ leaveTypes จริง', async ({ page }) => {
  await page.goto('/new-leave-request.html');
  const ตัวเลือก = page.locator('#leaveTypeId option');
  // อย่างน้อยต้องมีตัวเลือกว่าง + ประเภทตัวอย่าง 3 แบบตามหัวข้อ 7 ของสเปค
  const ข้อความทั้งหมด = await ตัวเลือก.allTextContents();
  expect(ข้อความทั้งหมด.length).toBeGreaterThanOrEqual(4); // ตัวเลือกว่าง + อย่างน้อย 3 ประเภท
  expect(ข้อความทั้งหมด).toContain('ลาพักร้อน');
  expect(ข้อความทั้งหมด).toContain('ลาป่วย');
  expect(ข้อความทั้งหมด).toContain('ลากิจ');
});

test('กรอกครบแล้วกดบันทึก ต้องสร้างใบลาใหม่จริง สถานะเริ่มต้น รอพิจารณา และกลับหน้ารายการ', async ({ page }) => {
  await page.goto('/new-leave-request.html');

  const หัวข้อ = 'ทดสอบยื่นใบลาใหม่ - ' + Date.now();
  await page.locator('#title').fill(หัวข้อ);
  await page.locator('#reason').fill('เหตุผลทดสอบอัตโนมัติโดย Playwright');
  await page.locator('#leaveTypeId').selectOption({ label: 'ลากิจ' });
  await page.locator('#startDate').fill('2026-11-01');
  await page.locator('#endDate').fill('2026-11-02');
  await page.locator('[id="ปุ่มบันทึก"]').click();

  // บันทึกแล้วต้องพากลับไปหน้ารายการ
  await page.waitForURL(/leave-requests(\.html)?$/, { timeout: 15000 });

  const แถวใหม่ = page.locator('#ผลลัพธ์ table tbody tr').first();
  await expect(แถวใหม่).toContainText(หัวข้อ);
  await expect(แถวใหม่).toContainText('ลากิจ');
  await expect(แถวใหม่).toContainText('รอพิจารณา'); // สถานะเริ่มต้นต้องเป็นรอพิจารณาเสมอ

  // เปิดดูรายละเอียด ต้องเห็นวันเวลาที่ยื่น (createdAt) ติดมาอัตโนมัติ ไม่ว่างเปล่า
  await แถวใหม่.click();
  await page.waitForURL(/leave-request-detail(\.html)?\?id=/, { timeout: 10000 });
  const กล่องใบลา = page.locator('#กล่องใบลา');
  await expect(กล่องใบลา).toContainText('วันที่ยื่น');
  const วันที่ยื่นแถว = กล่องใบลา.locator('.field-row', { hasText: 'วันที่ยื่น' });
  const ข้อความวันที่ยื่น = await วันที่ยื่นแถว.locator('span').nth(1).textContent();
  expect(ข้อความวันที่ยื่น && ข้อความวันที่ยื่น.trim().length).toBeGreaterThan(0);
});

test('กรอกไม่ครบ ต้องขึ้นข้อความเตือน และไม่บันทึกใบลา', async ({ page }) => {
  await page.goto('/new-leave-request.html');
  await page.locator('#title').fill('กรอกไม่ครบตั้งใจ');
  // ไม่กรอกเหตุผล/ประเภท/วันที่ ตั้งใจปล่อยว่าง
  await page.locator('[id="ปุ่มบันทึก"]').click();

  await expect(page.locator('#ข้อความเตือน')).toBeVisible();
  await expect(page.locator('#ข้อความเตือน')).toContainText('กรอกไม่ครบ');
  // ต้องยังอยู่หน้าเดิม ไม่ถูกพาไปหน้ารายการ
  expect(page.url()).toContain('new-leave-request');
});

test('ปุ่มยกเลิก ต้องพากลับหน้ารายการโดยไม่บันทึกใบลาใหม่', async ({ page }) => {
  await page.goto('/leave-requests.html');
  const กล่องก่อนยกเลิก = page.locator('#ผลลัพธ์');
  await expect(กล่องก่อนยกเลิก).toContainText('ยังไม่มีใบขอลาในระบบ'); // บัญชีใหม่ ยังไม่มีใบลา

  await page.goto('/new-leave-request.html');
  await page.locator('#title').fill('ใบลาที่จะกดยกเลิก ไม่ควรถูกบันทึก');
  await page.locator('a', { hasText: 'ยกเลิก' }).click();

  await page.waitForURL(/leave-requests(\.html)?$/, { timeout: 10000 });
  const กล่องหลังยกเลิก = page.locator('#ผลลัพธ์');
  await expect(กล่องหลังยกเลิก).toContainText('ยังไม่มีใบขอลาในระบบ'); // ยังว่างเหมือนเดิม ไม่มีใบใหม่เกิดขึ้น
});
