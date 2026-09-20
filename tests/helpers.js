// ─────────────────────────────────────────────────────────────
// tests/helpers.js — ฟังก์ชันช่วยที่ใช้ร่วมกันหลายไฟล์เทสต์
// สัปดาห์ที่ 9: Tester + Playwright
//
// หมายเหตุเรื่องบัญชีทดสอบ (อ่านก่อนแก้ไฟล์นี้):
// - สมัครสมาชิกผ่านหน้าเว็บจริง (signup.html) จะได้ role "employee" เสมอ
//   (js/signup.js ตั้งค่า role: "employee" ตายตัว ตรงตาม US-08)
//   จึงใช้ signup จริงสร้างบัญชีทดสอบ employee ได้ตรง ๆ ไม่ต้องพึ่งพา service account
// - บัญชี manager / hr ตั้ง role ให้ผ่าน self-signup ไม่ได้ (สเปคตั้งใจให้เป็นแบบนั้น)
//   และไม่มีสคริปต์ firebase-admin + service account key ในโปรเจกต์นี้ที่จะตั้ง role
//   ให้บัญชี Auth จริงได้โดยไม่ต้องคลายกฎ firestore.rules — โปรเจกต์นี้จึงยังไม่มีบัญชี
//   manager/hr ที่ล็อกอินได้จริงสำหรับเทสต์อัตโนมัติ (ดูรายละเอียดในรายงานสรุป)
//   เทสต์ที่ต้องใช้สิทธิ์ manager/hr จึงอ่านอีเมล/รหัสผ่านจาก environment variable
//   (MANAGER_EMAIL/MANAGER_PASSWORD, HR_EMAIL/HR_PASSWORD) — ถ้าไม่มีค่า จะข้ามเทสต์นั้น
//   พร้อมบอกเหตุผลชัดเจน แทนที่จะสมมุติบัญชีขึ้นมาเองหรือลดกฎ security rules
// ─────────────────────────────────────────────────────────────

const { expect } = require('@playwright/test');

// สร้างอีเมลทดสอบที่ไม่ซ้ำกันทุกครั้งที่รัน (โดเมนตัวอย่างเดียวกับที่สเปคหัวข้อ 7 ใช้)
// ทำแบบนี้เพื่อให้แต่ละเทสต์ได้บัญชี employee ของตัวเอง ไม่ชนกันตอนรันพร้อมกัน (fullyParallel: true)
function สุ่มอีเมลทดสอบ(prefix) {
  const ts = Date.now();
  const rnd = Math.floor(Math.random() * 1e6);
  return `${prefix || 'test-employee'}-${ts}-${rnd}@example.com`;
}

const รหัสผ่านทดสอบมาตรฐาน = 'Test123456';

// สมัครสมาชิกใหม่ผ่านหน้า signup.html จริง แล้วรอจนล็อกอินสำเร็จ (พากลับ index.html)
// คืนค่า { email, password, name } ของบัญชีที่สร้าง
async function สมัครพนักงานใหม่(page, { name, email, password } = {}) {
  const อีเมล = email || สุ่มอีเมลทดสอบ('test-employee');
  const รหัสผ่าน = password || รหัสผ่านทดสอบมาตรฐาน;
  const ชื่อ = name || 'ทดสอบ พนักงาน';

  await page.goto('/signup.html');
  await page.locator('#name').fill(ชื่อ);
  await page.locator('#email').fill(อีเมล);
  await page.locator('#password').fill(รหัสผ่าน);
  await page.locator('[id="ปุ่มสมัคร"]').click();

  // สมัครสำเร็จ -> เด้งไป index.html (ไม่มี query, path ว่างหรือ index.html)
  await page.waitForURL(/\/(index\.html)?$/, { timeout: 15000 });

  return { email: อีเมล, password: รหัสผ่าน, name: ชื่อ };
}

// ล็อกอินด้วยอีเมล/รหัสผ่านที่มีอยู่แล้ว
async function ล็อกอิน(page, email, password) {
  await page.goto('/login.html');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('[id="ปุ่มเข้าสู่ระบบ"]').click();
  await page.waitForURL(/\/(index\.html)?$/, { timeout: 15000 });
}

// อ่านค่า credential ของ manager/hr จาก environment variable
// คืนค่า null ถ้าไม่มี — ให้เทสต์เรียก test.skip() ต่อเอง
function credManager() {
  const email = process.env.MANAGER_EMAIL;
  const password = process.env.MANAGER_PASSWORD;
  return email && password ? { email, password } : null;
}

function credHr() {
  const email = process.env.HR_EMAIL;
  const password = process.env.HR_PASSWORD;
  return email && password ? { email, password } : null;
}

// ข้อความอธิบายเหตุผลที่ต้องข้ามเทสต์ — ใช้ข้อความเดียวกันทุกที่ให้รายงานอ่านง่าย
const เหตุผลข้ามManager =
  'ข้ามเทสต์นี้: ยังไม่มีบัญชี manager จริงสำหรับทดสอบ (self-signup ตั้ง role เป็น employee เสมอตามสเปค ' +
  'และไม่มีสคริปต์ firebase-admin + service account key ในเครื่องที่จะตั้ง role ให้บัญชี Auth จริงได้ ' +
  'โดยไม่คลาย firestore.rules) — ตั้งค่า MANAGER_EMAIL / MANAGER_PASSWORD เพื่อรันเทสต์นี้';

const เหตุผลข้ามHr =
  'ข้ามเทสต์นี้: ยังไม่มีบัญชี hr จริงสำหรับทดสอบ (เหตุผลเดียวกับ manager) ' +
  'ตั้งค่า HR_EMAIL / HR_PASSWORD เพื่อรันเทสต์นี้';

// ยื่นใบลาใหม่ผ่านฟอร์มจริง (สมมุติว่า login อยู่แล้วและอยู่หน้าไหนก็ได้)
// คืนค่ารหัสใบลาที่สร้างใหม่ (อ่านจาก data-id ของแถวในตารางหลังบันทึกเสร็จ)
async function ยื่นใบลาใหม่(page, { title, reason, leaveTypeLabel, startDate, endDate } = {}) {
  await page.goto('/new-leave-request.html');

  await page.locator('#title').fill(title || 'ทดสอบอัตโนมัติ - ' + Date.now());
  await page.locator('#reason').fill(reason || 'เหตุผลทดสอบที่เขียนโดย Playwright');
  await page.locator('#leaveTypeId').selectOption({ label: leaveTypeLabel || 'ลาป่วย' });
  await page.locator('#startDate').fill(startDate || '2026-09-25');
  await page.locator('#endDate').fill(endDate || '2026-09-26');

  await page.locator('[id="ปุ่มบันทึก"]').click();
  await page.waitForURL(/leave-requests(\.html)?$/, { timeout: 15000 });

  // บัญชีที่เพิ่งสมัครใหม่มีใบลาแค่ใบเดียว (ใบที่เพิ่งสร้าง) จึงหยิบแถวแรกได้เลย
  const แถว = page.locator('tr.clickable').first();
  await expect(แถว).toBeVisible({ timeout: 10000 });
  return แถว.getAttribute('data-id');
}

// จับ dialog (alert/confirm/prompt) ตัวถัดไปแล้วตอบให้อัตโนมัติ
// ต้องเรียกก่อน action ที่จะเปิด dialog เสมอ (เช่นเรียกก่อน .click())
function จับกล่องโต้ตอบถัดไป(page, { accept = true, promptText } = {}) {
  return new Promise((resolve) => {
    page.once('dialog', async (dialog) => {
      const ข้อความ = dialog.message();
      const ชนิด = dialog.type();
      if (accept) {
        await dialog.accept(promptText);
      } else {
        await dialog.dismiss();
      }
      resolve({ message: ข้อความ, type: ชนิด });
    });
  });
}

module.exports = {
  สุ่มอีเมลทดสอบ,
  รหัสผ่านทดสอบมาตรฐาน,
  สมัครพนักงานใหม่,
  ล็อกอิน,
  credManager,
  credHr,
  เหตุผลข้ามManager,
  เหตุผลข้ามHr,
  ยื่นใบลาใหม่,
  จับกล่องโต้ตอบถัดไป,
};
