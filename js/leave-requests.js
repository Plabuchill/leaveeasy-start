// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// สัปดาห์ที่ 6: อ่านใบลาจริงจาก Firestore (collection "leaveRequests")
// สัปดาห์ที่ 8: employee เห็นเฉพาะใบของตัวเอง (กรองฝั่งหน้าจอ)
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { getUserInfo } from "./auth-guard.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(async function () {
  var กล่อง = document.getElementById("ผลลัพธ์");
  var ผู้ใช้ = await getUserInfo();

  var สแนปช็อต = await getDocs(collection(db, "leaveRequests"));
  var ใบลาทั้งหมด = สแนปช็อต.docs.map(function (เอกสาร) {
    return Object.assign({ id: เอกสาร.id }, เอกสาร.data());
  });

  // employee เห็นเฉพาะใบของตัวเอง · manager/hr เห็นทุกใบ
  if (ผู้ใช้.role === "employee") {
    ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) { return ใบ.requesterId === ผู้ใช้.uid; });
  }

  // ถ้ามีสถานะติดมาท้าย URL ให้กรองเฉพาะสถานะนั้น
  var สถานะที่กรอง = ค่าจากURL("status");
  if (สถานะที่กรอง) {
    ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
    document.querySelector(".subtitle").textContent =
      "กำลังแสดงเฉพาะใบลาที่สถานะ " + สถานะที่กรอง + " · กดเมนู รายการใบลา เพื่อดูทั้งหมด";
  }

  แสดงตาราง(ใบลาทั้งหมด);

  function แสดงตาราง(รายการ) {
    if (รายการ.length === 0) {
      กล่อง.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
      return;
    }

    var html =
      "<table><thead><tr>" +
      "<th>หัวข้อ</th>" +
      "<th>ประเภทการลา</th>" +
      "<th>สถานะ</th>" +
      '<th class="hide-mobile">ผู้ขอลา</th>' +
      '<th class="hide-mobile">วันที่ลา</th>' +
      "</tr></thead><tbody>";

    รายการ.forEach(function (ใบ) {
      html +=
        '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
        "<td>" + esc(ใบ.title) + "</td>" +
        "<td>" + esc(ใบ.leaveTypeName) + "</td>" +
        "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate) + "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    กล่อง.innerHTML = html;

    // กดที่แถวไหน ไปหน้ารายละเอียดของใบนั้น
    กล่อง.querySelectorAll("tr.clickable").forEach(function (แถว) {
      แถว.addEventListener("click", function () {
        location.href = "leave-request-detail?id=" + แถว.dataset.id;
      });
    });
  }
})();
