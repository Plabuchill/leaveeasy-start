// ─────────────────────────────────────────────────────────────
// tests/auth-and-acl.spec.js — US-08: ล็อกอินและเห็นเฉพาะใบลาของตัวเอง
// ครอบคลุม: หน้าสมัคร/ล็อกอินมีจริง · สมัครแล้ว role เริ่มต้นเป็น employee ·
// requesterId ของใบใหม่ตรงกับคนที่ล็อกอินจริง · ไม่ล็อกอินอ่านอะไรไม่ได้เลย ·
// employee เปิดใบลาของคนอื่นไม่ได้
// ─────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');
const { สมัครพนักงานใหม่, ยื่นใบลาใหม่, จับกล่องโต้ตอบถัดไป } = require('./helpers');

test.describe('US-08 หน้าสมัครสมาชิกและหน้าล็อกอิน', () => {
  test('มีฟอร์มสมัครสมาชิกครบทุกช่อง', async ({ page }) => {
    await page.goto('/signup.html');
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('[id="ปุ่มสมัคร"]')).toBeVisible();
  });

  test('มีฟอร์มล็อกอินครบทุกช่อง', async ({ page }) => {
    await page.goto('/login.html');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('[id="ปุ่มเข้าสู่ระบบ"]')).toBeVisible();
  });
});

test.describe('US-08 คนที่ไม่ได้ล็อกอิน อ่านข้อมูลไม่ได้เลย', () => {
  // แต่ละ test เริ่มด้วย browser context ใหม่ (ไม่มี session) ตามค่าเริ่มต้นของ Playwright
  // จึงเทียบเท่ากับ "ยังไม่ได้ล็อกอิน" อยู่แล้วโดยไม่ต้องตั้งค่าเพิ่ม

  const หน้าที่ต้องล็อกอินก่อน = [
    'index.html',
    'leave-requests.html',
    'new-leave-request.html',
    'leave-types.html',
    'leave-request-detail.html?id=lr001',
  ];

  for (const หน้า of หน้าที่ต้องล็อกอินก่อน) {
    test(`เปิด ${หน้า} โดยไม่ล็อกอิน ต้องถูกเด้งไปหน้าล็อกอิน`, async ({ page }) => {
      await page.goto('/' + หน้า);
      await page.waitForURL(/login(\.html)?(\?.*)?$/, { timeout: 10000 });
      await expect(page.locator('#email')).toBeVisible();
    });
  }
});

test.describe('US-08 สมัครสมาชิกใหม่ ได้ role เริ่มต้นเป็น employee', () => {
  test('สมัครสำเร็จ ไม่เห็นเมนู/หน้า "ประเภทการลา" (เมนูนี้มีแต่ hr เห็น)', async ({ page }) => {
    await สมัครพนักงานใหม่(page);

    // อยู่หน้า index.html หลังสมัครสำเร็จ — เมนู "ประเภทการลา" ต้องไม่โผล่ให้ employee เห็น
    await expect(page.locator('.navbar a[href="leave-types.html"]')).toHaveCount(0);

    // ต่อให้พิมพ์ URL เข้าไปตรง ๆ ก็ต้องถูกเด้งออกเพราะ role ไม่ใช่ hr (js/leave-types.js เช็ก role)
    const กล่องโต้ตอบ = จับกล่องโต้ตอบถัดไป(page);
    await page.goto('/leave-types.html');
    await กล่องโต้ตอบ;
    await page.waitForURL(/\/(index\.html)?$/, { timeout: 10000 });
  });

  test('ใบลาที่สร้างใหม่บันทึก requesterId เป็นคนที่ล็อกอินอยู่จริง ไม่ใช่รหัสสมมติอย่าง u001', async ({ page }) => {
    const บัญชี = await สมัครพนักงานใหม่(page);
    const รหัสใบลา = await ยื่นใบลาใหม่(page, {
      title: 'ทดสอบ requesterId ตรงกับคนล็อกอิน',
    });

    await page.goto('/leave-request-detail.html?id=' + รหัสใบลา);
    // ชื่อผู้ขอลาที่แสดงต้องเป็นชื่อบัญชีที่เพิ่งสมัคร ไม่ใช่ชื่อจากข้อมูลตัวอย่าง (สมชาย/สมศรี)
    await expect(page.locator('#กล่องใบลา')).toContainText(บัญชี.name);
    await expect(page.locator('#กล่องใบลา')).not.toContainText('สมชาย ใจดี');
    await expect(page.locator('#กล่องใบลา')).not.toContainText('สมศรี ตั้งใจ');
  });
});

test.describe('US-08 ผู้ขอลาคนหนึ่ง เปิดใบลาของผู้ขอลาอีกคนไม่ได้', () => {
  test('employee เปิดใบลาของ u001 (ไม่ใช่ของตัวเอง) ตรง ๆ ทาง URL ต้องถูกบล็อก', async ({ page }) => {
    await สมัครพนักงานใหม่(page);

    const กล่องโต้ตอบ = จับกล่องโต้ตอบถัดไป(page);
    await page.goto('/leave-request-detail.html?id=lr001'); // lr001 เป็นของ u001 ตามข้อมูลตัวอย่างหัวข้อ 7
    const dialog = await กล่องโต้ตอบ;
    expect(dialog.message).toContain('ไม่มีสิทธิ์ดูใบลาของคนอื่น');

    await page.waitForURL(/leave-requests(\.html)?$/, { timeout: 10000 });
  });

  test('รายการใบลาของ employee แสดงเฉพาะใบของตัวเอง ไม่มีใบของ u001/u003 จากข้อมูลตัวอย่าง', async ({ page }) => {
    await สมัครพนักงานใหม่(page);
    await ยื่นใบลาใหม่(page, { title: 'ใบลาของฉันเอง - ไม่ควรเห็นใบของคนอื่นปนมา' });

    await page.goto('/leave-requests.html');
    const กล่อง = page.locator('#ผลลัพธ์');
    await expect(กล่อง).toContainText('ใบลาของฉันเอง');
    // ชื่อจากข้อมูลตัวอย่าง (ของ u001/u003) ต้องไม่ปรากฏในรายการของ employee คนนี้
    await expect(กล่อง).not.toContainText('สมชาย ใจดี');
    await expect(กล่อง).not.toContainText('สมศรี ตั้งใจ');
  });
});
