// ─────────────────────────────────────────────────────────────
// playwright.config.js — ตั้งค่า Playwright สำหรับทดสอบเว็บ LeaveEasy
// สัปดาห์ที่ 9: Tester + Playwright MCP ทดสอบอัตโนมัติ
// baseURL ชี้ไปที่เว็บจริงบน Firebase Hosting ไม่ใช่ localhost
// ─────────────────────────────────────────────────────────────

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'html',

  use: {
    baseURL: 'https://plabu-a08a6.web.app',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
