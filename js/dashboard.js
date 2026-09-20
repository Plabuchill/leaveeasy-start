// ─────────────────────────────────────────────────────────────
// js/dashboard.js — หน้าที่ 5 แดชบอร์ดสรุป
// สัปดาห์ที่ 6: โครงหน้า (ตัวเลขและรายการสมมติ) ยังไม่ต่อ Firestore จริง
// สัปดาห์ที่ 7 ขึ้นไป: ต่อฐานข้อมูลจริง (ส่วนนี้เก็บไว้สำหรับ Module 3)
// ─────────────────────────────────────────────────────────────

import { getUserInfo } from "./auth-guard.js";

(async function () {
  // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือ
  // สัปดาห์ที่ 8: ต้องเป็น HR เท่านั้นที่ดูแดชบอร์ดได้
  var ผู้ใช้ = await getUserInfo();

  // ตัวเลข: นับจากข้อมูล window.LEAVE_DATA (ชั่วคราวจนกว่าจะต่อ Firestore)
  // สัปดาห์ที่ 7 ขึ้นไป: ต้องอ่านจากฐานข้อมูลจริง และเห็นเฉพาะที่ผู้ใช้มีสิทธิ์เห็น
  var ใบลาทั้งหมด = window.LEAVE_DATA ? window.LEAVE_DATA.leaveRequests : [];

  var นับรอพิจารณา = ใบลาทั้งหมด.filter(function (ร) { return ร.status === "รอพิจารณา"; }).length;
  var นับอนุมัติ = ใบลาทั้งหมด.filter(function (ร) { return ร.status === "อนุมัติ"; }).length;
  var นับไม่อนุมัติ = ใบลาทั้งหมด.filter(function (ร) { return ร.status === "ไม่อนุมัติ"; }).length;

  document.getElementById("นับรอพิจารณา").textContent = นับรอพิจารณา;
  document.getElementById("นับอนุมัติ").textContent = นับอนุมัติ;
  document.getElementById("นับไม่อนุมัติ").textContent = นับไม่อนุมัติ;

  // รายการใบลา 5 รายการล่าสุด — เรียงจากใหม่ไปเก่า
  var ล่าสุด = ใบลาทั้งหมด
    .slice()
    .sort(function (a, b) {
      // เรียงจากใหม่ไปเก่า ต้อง reverse logic
      return a.createdAt > b.createdAt ? -1 : 1;
    })
    .slice(0, 5);

  var htmlตาราง = "";
  if (ล่าสุด.length === 0) {
    htmlตาราง = "<p>ยังไม่มีใบขอลาในระบบ</p>";
  } else {
    htmlตาราง =
      '<table>' +
      '<thead><tr><th>หัวข้อ</th><th>ประเภทการลา</th><th>สถานะ</th><th>ผู้ขอลา</th><th>วันที่ลา</th></tr></thead>' +
      '<tbody>';

    ล่าสุด.forEach(function (ร) {
      var ป้าย = '<span class="badge badge-' + ร.status + '">' + ร.status + '</span>';
      htmlตาราง +=
        '<tr onclick="location.href=\'leave-request-detail.html?id=' + ร.id + '\'" style="cursor:pointer">' +
        '<td>' + esc(ร.title) + '</td>' +
        '<td>' + esc(ร.leaveTypeName) + '</td>' +
        '<td>' + ป้าย + '</td>' +
        '<td>' + esc(ร.requesterName) + '</td>' +
        '<td>' + esc(ร.startDate) + ' ถึง ' + esc(ร.endDate) + '</td>' +
        '</tr>';
    });

    htmlตาราง += '</tbody></table>';
  }

  document.getElementById("ตารางล่าสุด").innerHTML = htmlตาราง;
})();
