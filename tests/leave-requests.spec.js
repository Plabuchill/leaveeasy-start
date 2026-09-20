// ─────────────────────────────────────────────────────────────
// tests/leave-requests.spec.js — US-01: ดูรายการใบลาทั้งหมด
// ครอบคลุม: คอลัมน์ครบ · ชื่อคนเป็นภาษาไทย (ไม่ใช่รหัส) · ป้ายสถานะสี ·
// กดแถวไปหน้ารายละเอียด · ไม่มีใบลาแสดงข้อความที่ถูกต้อง
//
// ใช้บัญชี employee ที่สมัครใหม่ทุกเทสต์ (สร้างใบลาของตัวเอง 1 ใบให้มีข้อมูลในตาราง)
// เพื่อไม่ต้องพึ่งบัญชี manager/hr และไม่ไปแตะข้อมูลตัวอย่าง lr001-lr005 ที่ผู้สอน/
// scripts/restore-seed.mjs อ้างอิงอยู่
// ─────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');
const { สมัครพนักงานใหม่, ยื่นใบลาใหม่ } = require('./helpers');

test('หน้ารายการใบลาว่างเปล่า ต้องขึ้นข้อความ "ยังไม่มีใบขอลาในระบบ" ไม่ใช่ตารางว่าง', async ({ page }) => {
  await สมัครพนักงานใหม่(page); // บัญชีใหม่ ยังไม่มีใบลาเลย
  await page.goto('/leave-requests.html');

  const กล่อง = page.locator('#ผลลัพธ์');
  await expect(กล่อง).toContainText('ยังไม่มีใบขอลาในระบบ');
  await expect(กล่อง.locator('table')).toHaveCount(0);
});

test.describe('ตารางรายการใบลา เมื่อมีข้อมูลอยู่จริง', () => {
  test('ตารางมีคอลัมน์ หัวข้อ · ประเภทการลา · สถานะ · ผู้ขอลา · วันที่ลา', async ({ page }) => {
    const บัญชี = await สมัครพนักงานใหม่(page);
    await ยื่นใบลาใหม่(page, {
      title: 'ทดสอบตาราง US-01',
      leaveTypeLabel: 'ลาพักร้อน',
      startDate: '2026-10-01',
      endDate: '2026-10-02',
    });

    await page.goto('/leave-requests.html');
    const หัวตาราง = page.locator('#ผลลัพธ์ table thead th');
    await expect(หัวตาราง).toHaveCount(5);
    await expect(หัวตาราง.nth(0)).toHaveText('หัวข้อ');
    await expect(หัวตาราง.nth(1)).toHaveText('ประเภทการลา');
    await expect(หัวตาราง.nth(2)).toHaveText('สถานะ');
    await expect(หัวตาราง.nth(3)).toHaveText('ผู้ขอลา');
    await expect(หัวตาราง.nth(4)).toHaveText('วันที่ลา');

    const แถว = page.locator('#ผลลัพธ์ table tbody tr').first();
    await expect(แถว).toContainText('ทดสอบตาราง US-01');
    await expect(แถว).toContainText('ลาพักร้อน');
    await expect(แถว).toContainText('รอพิจารณา');
    // ต้องแสดงชื่อภาษาไทยของผู้ขอลา ไม่ใช่รหัสเอกสารอย่าง u001 หรือ uid ยาว ๆ
    await expect(แถว).toContainText(บัญชี.name);
    await expect(แถว).toContainText('2026-10-01');
    await expect(แถว).toContainText('2026-10-02');
  });

  test('สถานะแสดงเป็นป้ายสี (badge) ตามค่าสถานะจริง', async ({ page }) => {
    await สมัครพนักงานใหม่(page);
    await ยื่นใบลาใหม่(page, { title: 'ทดสอบป้ายสถานะ' });

    await page.goto('/leave-requests.html');
    const ป้าย = page.locator('#ผลลัพธ์ table tbody tr').first().locator('span.badge');
    await expect(ป้าย).toBeVisible();
    await expect(ป้าย).toHaveText('รอพิจารณา');
    const class1 = await ป้าย.getAttribute('class');
    expect(class1).toContain('badge-รอพิจารณา');
  });

  test('กดที่แถว ต้องไปหน้ารายละเอียดของใบนั้น', async ({ page }) => {
    await สมัครพนักงานใหม่(page);
    const รหัสใบลา = await ยื่นใบลาใหม่(page, { title: 'ทดสอบกดแถวไปหน้ารายละเอียด' });

    await page.goto('/leave-requests.html');
    await page.locator('#ผลลัพธ์ table tbody tr').first().click();

    await page.waitForURL(/leave-request-detail(\.html)?\?id=/, { timeout: 10000 });
    expect(page.url()).toContain('id=' + รหัสใบลา);
    await expect(page.locator('#กล่องใบลา')).toContainText('ทดสอบกดแถวไปหน้ารายละเอียด');
  });
});
