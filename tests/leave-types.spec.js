// ─────────────────────────────────────────────────────────────
// tests/leave-types.spec.js — US-06: จัดการประเภทการลา (เฉพาะ hr)
// ครอบคลุม: ตารางแสดงประเภททั้งหมด · เพิ่มประเภทใหม่ · แก้ไข/ลบแต่ละแถว ·
// ประเภทใหม่โผล่ในรายการเลื่อนลงของหน้ายื่นใบลาใหม่ทันที ·
// คนที่ไม่ใช่ hr เข้าหน้านี้ไม่ได้ (ACL.md)
//
// เทสต์ที่ต้องเพิ่ม/แก้/ลบข้อมูลจริง ใช้ชื่อประเภทที่มีคำว่า "ทดสอบ" + timestamp เสมอ
// และลบตัวเองทิ้งหลังเทสต์เสร็จ (afterEach) เพื่อไม่ให้ค้างปนกับประเภทจริงตามสเปคหัวข้อ 7
// (ลาพักร้อน/ลาป่วย/ลากิจ) ที่ scripts/restore-seed.mjs และผู้สอนใช้อ้างอิง
// ─────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');
const {
  สมัครพนักงานใหม่,
  ล็อกอิน,
  credHr,
  เหตุผลข้ามHr,
  จับกล่องโต้ตอบถัดไป,
} = require('./helpers');

test.describe('US-06 คนที่ไม่ใช่ hr เข้าหน้าจัดการประเภทการลาไม่ได้', () => {
  test('employee เปิด leave-types.html ตรง ๆ ทาง URL ต้องถูกเด้งออก', async ({ page }) => {
    await สมัครพนักงานใหม่(page);
    const กล่องโต้ตอบ = จับกล่องโต้ตอบถัดไป(page);
    await page.goto('/leave-types.html');
    const dialog = await กล่องโต้ตอบ;
    expect(dialog.message).toContain('สำหรับฝ่ายบุคคลเท่านั้น');
    await page.waitForURL(/\/(index\.html)?$/, { timeout: 10000 });
  });
});

test.describe('US-06 จัดการประเภทการลา — ต้องใช้บัญชี hr จริง', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!credHr(), เหตุผลข้ามHr);
    const { email, password } = credHr();
    await ล็อกอิน(page, email, password);
  });

  test('หน้าแสดงตารางประเภทการลาที่มีอยู่ พร้อมปุ่มแก้ไขและลบทุกแถว', async ({ page }) => {
    await page.goto('/leave-types.html');
    const แถวแรก = page.locator('#ตารางประเภท table tbody tr').first();
    await expect(แถวแรก).toBeVisible();
    await expect(แถวแรก.locator('[data-edit]')).toBeVisible();
    await expect(แถวแรก.locator('[data-del]')).toBeVisible();
  });

  test('เพิ่มประเภทใหม่ ต้องโผล่ในตารางทันที และโผล่ในรายการเลื่อนลงของหน้ายื่นใบลาใหม่ด้วย', async ({ page }) => {
    const ชื่อใหม่ = 'ทดสอบประเภท-' + Date.now();
    await page.goto('/leave-types.html');
    await page.locator('#ชื่อประเภทใหม่').fill(ชื่อใหม่);
    await page.locator('[id="ปุ่มเพิ่ม"]').click();

    await expect(page.locator('#ตารางประเภท')).toContainText(ชื่อใหม่);

    await page.goto('/new-leave-request.html');
    const ตัวเลือกทั้งหมด = await page.locator('#leaveTypeId option').allTextContents();
    expect(ตัวเลือกทั้งหมด).toContain(ชื่อใหม่);

    // ล้างข้อมูลทดสอบทิ้ง ไม่ให้ประเภทปลอมค้างอยู่ถาวร
    await page.goto('/leave-types.html');
    const แถวที่เพิ่ม = page.locator('#ตารางประเภท table tbody tr', { hasText: ชื่อใหม่ });
    const กล่องโต้ตอบลบ = จับกล่องโต้ตอบถัดไป(page);
    await แถวที่เพิ่ม.locator('[data-del]').click();
    await กล่องโต้ตอบลบ;
    await expect(page.locator('#ตารางประเภท')).not.toContainText(ชื่อใหม่);
  });

  test('แก้ไขชื่อประเภท ต้องอัปเดตในตารางทันที', async ({ page }) => {
    const ชื่อเดิม = 'ทดสอบแก้ไข-' + Date.now();
    const ชื่อใหม่ = ชื่อเดิม + '-แก้แล้ว';

    await page.goto('/leave-types.html');
    await page.locator('#ชื่อประเภทใหม่').fill(ชื่อเดิม);
    await page.locator('[id="ปุ่มเพิ่ม"]').click();
    await expect(page.locator('#ตารางประเภท')).toContainText(ชื่อเดิม);

    const แถว = page.locator('#ตารางประเภท table tbody tr', { hasText: ชื่อเดิม });
    const กล่องโต้ตอบแก้ = จับกล่องโต้ตอบถัดไป(page, { promptText: ชื่อใหม่ });
    await แถว.locator('[data-edit]').click();
    await กล่องโต้ตอบแก้;

    await expect(page.locator('#ตารางประเภท')).toContainText(ชื่อใหม่);

    // ล้างข้อมูลทดสอบทิ้ง
    const แถวหลังแก้ = page.locator('#ตารางประเภท table tbody tr', { hasText: ชื่อใหม่ });
    const กล่องโต้ตอบลบ = จับกล่องโต้ตอบถัดไป(page);
    await แถวหลังแก้.locator('[data-del]').click();
    await กล่องโต้ตอบลบ;
  });

  test('เพิ่มประเภทโดยไม่กรอกชื่อ ต้องขึ้นข้อความเตือน', async ({ page }) => {
    await page.goto('/leave-types.html');
    await page.locator('[id="ปุ่มเพิ่ม"]').click();
    await expect(page.locator('#เตือนประเภท')).toBeVisible();
    await expect(page.locator('#เตือนประเภท')).toContainText('พิมพ์ชื่อประเภทการลาก่อน');
  });
});
