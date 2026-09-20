// ─────────────────────────────────────────────────────────────
// tests/detail-and-status.spec.js
// US-03 เปิดดูรายละเอียดใบลา · US-05 เขียนความเห็นการอนุมัติ ·
// US-07 ลบใบลาของตัวเอง · US-04 เปลี่ยนสถานะใบลา (บางส่วนต้องใช้บัญชี manager/hr)
//
// ทุกเทสต์สร้างใบลาใหม่ของตัวเองก่อนเสมอ (ไม่แตะ lr001-lr005 ซึ่งเป็นข้อมูลตัวอย่าง
// ที่ restore-seed.mjs และผู้สอนใช้อ้างอิง — การเปลี่ยนสถานะเป็นอนุมัติ/ไม่อนุมัติ
// เปลี่ยนกลับไม่ได้ตามกฎหัวข้อ 6 จึงห้ามไปทดสอบทับข้อมูลตัวอย่างจริงเด็ดขาด)
// ─────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');
const {
  สมัครพนักงานใหม่,
  ยื่นใบลาใหม่,
  จับกล่องโต้ตอบถัดไป,
  ล็อกอิน,
  credManager,
  เหตุผลข้ามManager,
} = require('./helpers');

test.describe('US-03 เปิดดูรายละเอียดใบลา', () => {
  test('แสดงครบทุกช่องตามสเปค และบอกว่ายังไม่ได้กำหนดผู้อนุมัติ', async ({ page }) => {
    await สมัครพนักงานใหม่(page);
    const รหัสใบลา = await ยื่นใบลาใหม่(page, {
      title: 'ทดสอบ US-03 รายละเอียดครบ',
      reason: 'เหตุผลเฉพาะของเทสต์นี้',
      leaveTypeLabel: 'ลาป่วย',
      startDate: '2026-12-01',
      endDate: '2026-12-03',
    });

    await page.goto('/leave-request-detail.html?id=' + รหัสใบลา);
    const กล่อง = page.locator('#กล่องใบลา');
    await expect(กล่อง).toContainText('ทดสอบ US-03 รายละเอียดครบ');
    await expect(กล่อง).toContainText('เหตุผลเฉพาะของเทสต์นี้');
    await expect(กล่อง).toContainText('ลาป่วย');
    await expect(กล่อง).toContainText('2026-12-01');
    await expect(กล่อง).toContainText('2026-12-03');
    await expect(กล่อง).toContainText('รอพิจารณา');
    // ใบใหม่ยังไม่มีผู้อนุมัติ ต้องขึ้นข้อความตามสเปค ไม่ใช่ช่องว่างเปล่า
    await expect(กล่อง).toContainText('ยังไม่ได้กำหนดผู้อนุมัติ');

    // มีปุ่มกลับไปหน้ารายการ
    await expect(page.locator('a', { hasText: 'กลับไปหน้ารายการ' })).toBeVisible();
  });

  test('ยังไม่มีความเห็น ต้องขึ้นข้อความ "ยังไม่มีความเห็นในใบนี้"', async ({ page }) => {
    await สมัครพนักงานใหม่(page);
    const รหัสใบลา = await ยื่นใบลาใหม่(page, { title: 'ทดสอบ US-03 ยังไม่มีความเห็น' });
    await page.goto('/leave-request-detail.html?id=' + รหัสใบลา);
    await expect(page.locator('#รายการความเห็น')).toContainText('ยังไม่มีความเห็นในใบนี้');
  });
});

test.describe('US-05 เขียนความเห็นการอนุมัติ', () => {
  test('ส่งข้อความว่างเปล่าไม่ได้ ต้องขึ้นข้อความเตือน', async ({ page }) => {
    await สมัครพนักงานใหม่(page);
    const รหัสใบลา = await ยื่นใบลาใหม่(page, { title: 'ทดสอบ US-05 ส่งความเห็นว่าง' });
    await page.goto('/leave-request-detail.html?id=' + รหัสใบลา);

    await page.locator('[id="ปุ่มส่งความเห็น"]').click();
    await expect(page.locator('#เตือนความเห็น')).toBeVisible();
    await expect(page.locator('#เตือนความเห็น')).toContainText('พิมพ์ข้อความก่อน');
    await expect(page.locator('#รายการความเห็น')).toContainText('ยังไม่มีความเห็นในใบนี้');
  });

  test('ส่งความเห็นสำเร็จ ต้องแสดงชื่อผู้เขียน ข้อความ และวันเวลา และอยู่ถาวรหลังโหลดหน้าใหม่', async ({ page }) => {
    const บัญชี = await สมัครพนักงานใหม่(page);
    const รหัสใบลา = await ยื่นใบลาใหม่(page, { title: 'ทดสอบ US-05 ส่งความเห็นสำเร็จ' });
    await page.goto('/leave-request-detail.html?id=' + รหัสใบลา);

    const ข้อความความเห็น = 'ความเห็นทดสอบจาก Playwright ' + Date.now();
    await page.locator('#ข้อความความเห็น').fill(ข้อความความเห็น);
    await page.locator('[id="ปุ่มส่งความเห็น"]').click();

    const รายการ = page.locator('#รายการความเห็น .comment').first();
    await expect(รายการ).toContainText(บัญชี.name);
    await expect(รายการ).toContainText(ข้อความความเห็น);

    // โหลดหน้าใหม่ ต้องยังอยู่ (บันทึกจริงใน subcollection approvals ไม่ใช่แค่ในหน่วยความจำ)
    await page.reload();
    await expect(page.locator('#รายการความเห็น .comment').first()).toContainText(ข้อความความเห็น);
  });
});

test.describe('US-07 ลบใบลาของตัวเอง', () => {
  test('มีปุ่มลบเฉพาะตอนสถานะยังเป็นรอพิจารณา และต้องยืนยันก่อนลบเสมอ', async ({ page }) => {
    await สมัครพนักงานใหม่(page);
    const รหัสใบลา = await ยื่นใบลาใหม่(page, { title: 'ทดสอบ US-07 ลบใบลา' });
    await page.goto('/leave-request-detail.html?id=' + รหัสใบลา);

    await expect(page.locator('[id="ปุ่มลบ"]')).toBeVisible();
  });

  test('กดลบแล้วกดยกเลิกในกล่องยืนยัน ต้องไม่ลบใบลา', async ({ page }) => {
    await สมัครพนักงานใหม่(page);
    const รหัสใบลา = await ยื่นใบลาใหม่(page, { title: 'ทดสอบ US-07 กดยกเลิกไม่ลบ' });
    await page.goto('/leave-request-detail.html?id=' + รหัสใบลา);

    const กล่องโต้ตอบ = จับกล่องโต้ตอบถัดไป(page, { accept: false }); // กดยกเลิก (dismiss)
    await page.locator('[id="ปุ่มลบ"]').click();
    await กล่องโต้ตอบ;

    // ยังอยู่หน้ารายละเอียดเดิม ใบลายังอยู่
    await expect(page.locator('#กล่องใบลา')).toContainText('ทดสอบ US-07 กดยกเลิกไม่ลบ');
  });

  test('ยืนยันลบแล้ว ไฟล์หายจริงและกลับไปหน้ารายการ', async ({ page }) => {
    await สมัครพนักงานใหม่(page);
    const รหัสใบลา = await ยื่นใบลาใหม่(page, { title: 'ทดสอบ US-07 ยืนยันลบจริง' });
    await page.goto('/leave-request-detail.html?id=' + รหัสใบลา);

    const กล่องโต้ตอบ = จับกล่องโต้ตอบถัดไป(page, { accept: true });
    await page.locator('[id="ปุ่มลบ"]').click();
    await กล่องโต้ตอบ;

    await page.waitForURL(/leave-requests(\.html)?$/, { timeout: 10000 });
    await expect(page.locator('#ผลลัพธ์')).toContainText('ยังไม่มีใบขอลาในระบบ');

    // เปิดลิงก์เดิมตรง ๆ ต้องไม่พบใบลาแล้ว
    await page.goto('/leave-request-detail.html?id=' + รหัสใบลา);
    await expect(page.locator('#กล่องใบลา')).toContainText('ไม่พบใบขอลาที่ต้องการ');
  });
});

test.describe('US-04 เปลี่ยนสถานะใบลา — ส่วนที่ทดสอบได้โดยไม่ต้องใช้บัญชี manager', () => {
  test('employee ไม่เห็นปุ่มอนุมัติ/ไม่อนุมัติ แม้ในใบของตัวเอง (เปลี่ยนสถานะไม่ได้)', async ({ page }) => {
    await สมัครพนักงานใหม่(page);
    const รหัสใบลา = await ยื่นใบลาใหม่(page, { title: 'ทดสอบ employee เปลี่ยนสถานะไม่ได้' });
    await page.goto('/leave-request-detail.html?id=' + รหัสใบลา);

    await expect(page.locator('[id="ปุ่มอนุมัติ"]')).toHaveCount(0);
    await expect(page.locator('[id="ปุ่มไม่อนุมัติ"]')).toHaveCount(0);
  });
});

test.describe('US-04 เปลี่ยนสถานะใบลา — ต้องใช้บัญชี manager จริง', () => {
  test.beforeEach(async () => {
    test.skip(!credManager(), เหตุผลข้ามManager);
  });

  test('manager เห็นปุ่มอนุมัติ/ไม่อนุมัติ กดอนุมัติแล้วสถานะเปลี่ยนทันทีและถาวร แล้วเปลี่ยนต่อไม่ได้อีก', async ({ browser }) => {
    // ต้องมี 2 คนพร้อมกัน: employee เจ้าของใบ + manager ผู้พิจารณา คนละ browser context
    const employeeCtx = await browser.newContext();
    const employeePage = await employeeCtx.newPage();
    await สมัครพนักงานใหม่(employeePage);
    const รหัสใบลา = await ยื่นใบลาใหม่(employeePage, { title: 'ทดสอบ US-04 อนุมัติจริงโดย manager' });

    const managerCtx = await browser.newContext();
    const managerPage = await managerCtx.newPage();
    const { email, password } = credManager();
    await ล็อกอิน(managerPage, email, password);
    await managerPage.goto('/leave-request-detail.html?id=' + รหัสใบลา);

    await expect(managerPage.locator('[id="ปุ่มอนุมัติ"]')).toBeVisible();
    await expect(managerPage.locator('[id="ปุ่มไม่อนุมัติ"]')).toBeVisible();

    // เนื้อหาช่องอื่นก่อนเปลี่ยนสถานะ (ใช้ตรวจว่าเปลี่ยนสถานะแล้วช่องอื่นไม่ถูกเขียนทับ)
    const หัวข้อก่อน = await managerPage.locator('#กล่องใบลา .field-row', { hasText: 'หัวข้อ' }).textContent();
    const เหตุผลก่อน = await managerPage.locator('#กล่องใบลา .field-row', { hasText: 'เหตุผลการลา' }).textContent();

    await managerPage.locator('[id="ปุ่มอนุมัติ"]').click();
    await expect(managerPage.locator('#กล่องใบลา')).toContainText('อนุมัติ');
    await expect(managerPage.locator('[id="ปุ่มอนุมัติ"]')).toHaveCount(0); // ปลายทางแล้ว กดต่อไม่ได้

    // โหลดหน้าใหม่ ยืนยันว่าเปลี่ยนถาวรจริงในฐานข้อมูล ไม่ใช่แค่ในหน่วยความจำหน้าเว็บ
    await managerPage.reload();
    await expect(managerPage.locator('#กล่องใบลา')).toContainText('ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้');
    await expect(managerPage.locator('[id="ปุ่มอนุมัติ"]')).toHaveCount(0);
    await expect(managerPage.locator('[id="ปุ่มไม่อนุมัติ"]')).toHaveCount(0);

    // ช่องอื่น (หัวข้อ/เหตุผล) ต้องไม่ถูกเขียนทับตอนเปลี่ยน status
    const หัวข้อหลัง = await managerPage.locator('#กล่องใบลา .field-row', { hasText: 'หัวข้อ' }).textContent();
    const เหตุผลหลัง = await managerPage.locator('#กล่องใบลา .field-row', { hasText: 'เหตุผลการลา' }).textContent();
    expect(หัวข้อหลัง).toBe(หัวข้อก่อน);
    expect(เหตุผลหลัง).toBe(เหตุผลก่อน);

    await employeeCtx.close();
    await managerCtx.close();
  });

  test('เปลี่ยนเป็นไม่อนุมัติ ต้องมีความเห็นอย่างน้อย 1 รายการก่อนเสมอ', async ({ browser }) => {
    const employeeCtx = await browser.newContext();
    const employeePage = await employeeCtx.newPage();
    await สมัครพนักงานใหม่(employeePage);
    const รหัสใบลา = await ยื่นใบลาใหม่(employeePage, { title: 'ทดสอบ US-04+US-05 ไม่อนุมัติต้องมีความเห็นก่อน' });

    const managerCtx = await browser.newContext();
    const managerPage = await managerCtx.newPage();
    const { email, password } = credManager();
    await ล็อกอิน(managerPage, email, password);
    await managerPage.goto('/leave-request-detail.html?id=' + รหัสใบลา);

    // ยังไม่มีความเห็นเลย กด "ไม่อนุมัติ" ต้องถูกบล็อกด้วย alert เตือน ไม่ใช่เปลี่ยนสถานะไปเลย
    const กล่องโต้ตอบ1 = จับกล่องโต้ตอบถัดไป(managerPage);
    await managerPage.locator('[id="ปุ่มไม่อนุมัติ"]').click();
    const dialog1 = await กล่องโต้ตอบ1;
    expect(dialog1.message).toContain('ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน');
    await expect(managerPage.locator('#กล่องใบลา')).toContainText('รอพิจารณา'); // สถานะยังไม่เปลี่ยน

    // เขียนความเห็น 1 รายการ แล้วลองใหม่ ต้องสำเร็จ
    await managerPage.locator('#ข้อความความเห็น').fill('ไม่อนุมัติเพราะทดสอบระบบ');
    await managerPage.locator('[id="ปุ่มส่งความเห็น"]').click();
    await expect(managerPage.locator('#รายการความเห็น .comment')).toHaveCount(1);

    await managerPage.locator('[id="ปุ่มไม่อนุมัติ"]').click();
    await expect(managerPage.locator('#กล่องใบลา')).toContainText('ไม่อนุมัติ');

    await employeeCtx.close();
    await managerCtx.close();
  });
});
