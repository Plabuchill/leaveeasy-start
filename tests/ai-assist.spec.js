// ─────────────────────────────────────────────────────────────
// tests/ai-assist.spec.js — US-09: ปุ่มให้ AI จัดประเภทการลาอัตโนมัติ
// ครอบคลุมเกณฑ์การยอมรับทุกข้อ: ผลต้องเป็นประเภทจริงในระบบเท่านั้น ·
// ไม่ตรง/เรียกไม่สำเร็จ ขึ้นข้อความจัดให้ไม่ได้และไม่เปลี่ยนค่าเดิม ·
// มีป้าย "ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน" · ระหว่างรอปุ่มกดซ้ำไม่ได้ ·
// เรียกไม่สำเร็จ/เกิน 15 วิ ไม่ค้าง และยังกดบันทึกใบลาได้ปกติ · แก้ประเภทที่ AI เลือกเองได้เสมอ
//
// ใช้ page.route ดัก request ไป openrouter.ai แทนการเรียก AI จริง เพื่อ:
// 1) ทดสอบได้แน่นอน ไม่ขึ้นกับผลลัพธ์จริงของโมเดล AI ภายนอก
// 2) ไม่ต้องพึ่งพา js/ai-config.js (คีย์ส่วนตัวของแต่ละคน ที่ .gitignore กันไว้ และ
//    ไม่ได้ถูก deploy ขึ้น Firebase Hosting ตาม firebase.json ignore list)
//
// หมายเหตุสำคัญที่พบระหว่างเขียนเทสต์ชุดนี้ (ดูสรุปในรายงานท้ายงาน):
// เว็บจริงบน Firebase Hosting (baseURL ที่ตั้งไว้ใน playwright.config.js) ยัง เป็นเวอร์ชัน
// ก่อนสัปดาห์ที่ 8 — ปุ่ม "ให้ AI ช่วยจัดประเภทการลา" ยังไม่ถูก deploy ขึ้นจริง
// (เช็กจาก js/new-leave-request.js ที่ /new-leave-request.js บนเว็บจริง ไม่มีการ import
// ai-assist.js เลย) เทสต์ชุดนี้จึงคาดว่าจะไม่ผ่านในการรันรอบแรกจนกว่าจะ deploy ใหม่
// — ปล่อยให้ทดสอบแล้ว "ไม่ผ่าน" ตรง ๆ ตั้งใจ เพื่อให้เห็นบั๊ก/งานค้างนี้ชัดเจน
// ไม่ได้แก้ไฟล์แอปหรือ config ใด ๆ เพื่อทำให้เทสต์นี้ผ่านปลอม ๆ
// ─────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');
const { สมัครพนักงานใหม่ } = require('./helpers');

const AI_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

function mockAiSuccess(page, ตอบเป็นรหัสประเภท) {
  return page.route(AI_ENDPOINT, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { content: ตอบเป็นรหัสประเภท } }],
      }),
    })
  );
}

function mockAiFailure(page) {
  return page.route(AI_ENDPOINT, (route) => route.fulfill({ status: 500, body: 'server error' }));
}

test.beforeEach(async ({ page }) => {
  await สมัครพนักงานใหม่(page);
  await page.goto('/new-leave-request.html');
});

test('มีปุ่ม "ให้ AI ช่วยจัดประเภทการลา" ในหน้ายื่นใบลาใหม่', async ({ page }) => {
  await expect(page.locator('[id="ปุ่มAI"]')).toBeVisible();
});

test('ยังไม่พิมพ์เหตุผล กดปุ่ม AI ต้องขึ้นเตือนให้พิมพ์ก่อน ไม่เรียก AI', async ({ page }) => {
  let เรียกจริงหรือไม่ = false;
  await page.route(AI_ENDPOINT, (route) => {
    เรียกจริงหรือไม่ = true;
    route.abort();
  });

  await page.locator('[id="ปุ่มAI"]').click();
  await expect(page.locator('#ข้อความAI')).toContainText('พิมพ์เหตุผลการลาก่อน');
  expect(เรียกจริงหรือไม่).toBe(false);
});

test('AI เลือกประเภทที่มีอยู่จริงได้สำเร็จ ต้องเปลี่ยนค่าในดรอปดาวน์ และมีป้ายกำกับตามสเปคเป๊ะ ๆ', async ({ page }) => {
  const รหัสลาป่วย = await page
    .locator('#leaveTypeId option', { hasText: 'ลาป่วย' })
    .getAttribute('value');

  await mockAiSuccess(page, รหัสลาป่วย);
  await page.locator('#reason').fill('มีไข้สูง ปวดหัว ต้องพักรักษาตัวที่บ้าน');
  await page.locator('[id="ปุ่มAI"]').click();

  await expect(page.locator('#leaveTypeId')).toHaveValue(รหัสลาป่วย);
  // ป้ายกำกับต้องตรงคำในสเปคเป๊ะ ๆ
  await expect(page.locator('#ข้อความAI')).toHaveText('🤖 ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน');
});

test('AI ตอบรหัสที่ไม่ตรงกับประเภทใดในระบบเลย ต้องขึ้นข้อความจัดให้ไม่ได้ และไม่เปลี่ยนค่าเดิม', async ({ page }) => {
  await page.locator('#leaveTypeId').selectOption({ label: 'ลาพักร้อน' });
  await mockAiSuccess(page, 'ไม่มีรหัสนี้อยู่จริง-xyz');
  await page.locator('#reason').fill('เหตุผลที่ AI ควรจัดให้ไม่ได้');
  await page.locator('[id="ปุ่มAI"]').click();

  await expect(page.locator('#ข้อความAI')).toContainText('AI จัดประเภทให้ไม่ได้');
  // ค่าที่เลือกไว้ก่อนหน้า (ลาพักร้อน) ต้องไม่ถูกเปลี่ยน
  const ค่าปัจจุบัน = await page.locator('#leaveTypeId').inputValue();
  const ป้ายลาพักร้อน = await page
    .locator('#leaveTypeId option', { hasText: 'ลาพักร้อน' })
    .getAttribute('value');
  expect(ค่าปัจจุบัน).toBe(ป้ายลาพักร้อน);
});

test('ระหว่างรอผลจาก AI ปุ่มต้องขึ้นสถานะกำลังทำงานและกดซ้ำไม่ได้', async ({ page }) => {
  let จำนวนครั้งที่เรียกจริง = 0;
  await page.route(AI_ENDPOINT, async (route) => {
    จำนวนครั้งที่เรียกจริง++;
    await new Promise((r) => setTimeout(r, 1500)); // จำลองว่า AI ตอบช้า
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ choices: [{ message: { content: 'lt002' } }] }),
    });
  });

  await page.locator('#reason').fill('เหตุผลทดสอบปุ่มระหว่างรอ');
  const ปุ่มAI = page.locator('[id="ปุ่มAI"]');
  await ปุ่มAI.click();

  await expect(ปุ่มAI).toBeDisabled();
  await expect(ปุ่มAI).toContainText('กำลังคิด');

  // กดซ้ำตอนปุ่ม disabled อยู่ ต้องไม่ยิง request ซ้ำ (Playwright คลิกปุ่มที่ disabled ไม่ได้อยู่แล้ว
  // แต่ยืนยันด้วยว่ามีการเรียกจริงแค่ 1 ครั้งหลังงานเสร็จ)
  await expect(ปุ่มAI).toBeEnabled({ timeout: 5000 });
  expect(จำนวนครั้งที่เรียกจริง).toBe(1);
});

test('เรียก AI ไม่สำเร็จ (server error) ต้องไม่ค้าง ขึ้นข้อความจัดให้ไม่ได้ และยังกดบันทึกใบลาได้ตามปกติ', async ({ page }) => {
  await mockAiFailure(page);
  await page.locator('#title').fill('ทดสอบ AI ล่ม แต่บันทึกได้ปกติ');
  await page.locator('#reason').fill('เหตุผลทดสอบตอน AI เรียกไม่สำเร็จ');
  await page.locator('#leaveTypeId').selectOption({ label: 'ลากิจ' });
  await page.locator('#startDate').fill('2026-11-10');
  await page.locator('#endDate').fill('2026-11-11');

  const ปุ่มAI = page.locator('[id="ปุ่มAI"]');
  await ปุ่มAI.click();

  await expect(page.locator('#ข้อความAI')).toContainText('AI จัดประเภทให้ไม่ได้', { timeout: 20000 });
  await expect(ปุ่มAI).toBeEnabled();

  // ปุ่มบันทึกต้องยังกดได้ตามปกติ ไม่ค้างเพราะ AI ล้มเหลว
  await page.locator('[id="ปุ่มบันทึก"]').click();
  await page.waitForURL(/leave-requests(\.html)?$/, { timeout: 15000 });
  await expect(page.locator('#ผลลัพธ์')).toContainText('ทดสอบ AI ล่ม แต่บันทึกได้ปกติ');
});

test('เรียก AI นานเกิน 15 วินาที ต้องถูกตัดเวลาไม่ค้าง (timeout) และปุ่มกลับมากดได้ตามปกติ', async ({ page }) => {
  test.setTimeout(35000);
  await page.route(AI_ENDPOINT, async (route) => {
    await new Promise((r) => setTimeout(r, 20000)); // ช้ากว่า 15 วิ ที่ ai-assist.js ตั้ง timeout ไว้
    route.fulfill({ status: 200, body: '{}' }).catch(() => {}); // อาจไม่ถึงเพราะฝั่ง client ตัดไปก่อนแล้ว
  });

  await page.locator('#reason').fill('เหตุผลทดสอบ timeout เกิน 15 วินาที');
  const ปุ่มAI = page.locator('[id="ปุ่มAI"]');
  await ปุ่มAI.click();

  await expect(page.locator('#ข้อความAI')).toContainText('AI จัดประเภทให้ไม่ได้', { timeout: 18000 });
  await expect(ปุ่มAI).toBeEnabled();
});

test('ผู้ใช้แก้ประเภทการลาที่ AI เลือกไว้เองได้เสมอ', async ({ page }) => {
  const รหัสลากิจ = await page.locator('#leaveTypeId option', { hasText: 'ลากิจ' }).getAttribute('value');
  await mockAiSuccess(page, รหัสลากิจ);
  await page.locator('#reason').fill('เหตุผลใด ๆ');
  await page.locator('[id="ปุ่มAI"]').click();
  await expect(page.locator('#leaveTypeId')).toHaveValue(รหัสลากิจ);

  // ผู้ใช้เปลี่ยนเองเป็นอย่างอื่นได้ ไม่ถูกล็อกไว้ตามที่ AI เลือก
  await page.locator('#leaveTypeId').selectOption({ label: 'ลาพักร้อน' });
  const รหัสลาพักร้อน = await page
    .locator('#leaveTypeId option', { hasText: 'ลาพักร้อน' })
    .getAttribute('value');
  await expect(page.locator('#leaveTypeId')).toHaveValue(รหัสลาพักร้อน);
});
