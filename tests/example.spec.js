// ─────────────────────────────────────────────────────────────
// tests/example.spec.js — เทสต์ตัวอย่างตรวจว่าเว็บ LeaveEasy บน Firebase Hosting เปิดได้จริง
// ใช้ยืนยันว่า playwright.config.js ตั้งค่าถูกต้อง ก่อนเขียนเทสต์เพิ่มเติม
// ─────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');

test('หน้าแรกเปิดได้และมีชื่อระบบถูกต้อง', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/LeaveEasy/);
});
