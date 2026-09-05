// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่าน/แก้ข้อมูลจริงจาก Firestore
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import {
  doc, getDoc, updateDoc, deleteDoc,
  collection, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(async function () {
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");
  var refใบ = doc(db, "leaveRequests", รหัสใบลา);

  var สแนปช็อตใบ = await getDoc(refใบ);
  if (!สแนปช็อตใบ.exists()) {
    กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
    return;
  }
  var ใบ = Object.assign({ id: สแนปช็อตใบ.id }, สแนปช็อตใบ.data());

  var สแนปช็อตความเห็น = await getDocs(collection(db, "leaveRequests", รหัสใบลา, "approvals"));
  var ความเห็น = สแนปช็อตความเห็น.docs.map(function (เอกสาร) {
    return Object.assign({ id: เอกสาร.id }, เอกสาร.data());
  });

  วาดใบลา();
  วาดความเห็น();
  กล่องความเห็น.classList.remove("hidden");

  document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ / ไม่อนุมัติ ขึ้นเฉพาะใบที่ยังรอพิจารณา
    if (ใบ.status === "รอพิจารณา") {
      html +=
        '<div class="btn-row">' +
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบลา</button>' +
        "</div>";
    } else {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    if (ใบ.status === "รอพิจารณา") {
      document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
      document.getElementById("ปุ่มลบ").addEventListener("click", ลบใบลา);
    }
  }

  // ── เปลี่ยนสถานะ — แก้เฉพาะช่อง status ในเอกสารจริง ห้ามแตะช่องอื่น ──
  function เปลี่ยนสถานะ(สถานะใหม่) {
    // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }

    var ปุ่มทั้งคู่ = กล่องใบลา.querySelectorAll("button");
    ปุ่มทั้งคู่.forEach(function (ป) { ป.disabled = true; });

    updateDoc(refใบ, { status: สถานะใหม่ })
      .then(function () {
        ใบ.status = สถานะใหม่;
        วาดใบลา();
      })
      .catch(function (err) {
        ปุ่มทั้งคู่.forEach(function (ป) { ป.disabled = false; });
        alert("เปลี่ยนสถานะไม่สำเร็จ ลองใหม่อีกครั้ง (" + err.message + ")");
      });
  }

  // ── ลบใบลา — ต้องยืนยันก่อนทุกครั้ง กดยกเลิกแล้วต้องไม่ลบ ──
  function ลบใบลา() {
    if (!confirm('ยืนยันการลบใบลา "' + ใบ.title + '" หรือไม่ — ลบแล้วกู้คืนไม่ได้')) return;

    var ปุ่มทั้งหมด = กล่องใบลา.querySelectorAll("button");
    ปุ่มทั้งหมด.forEach(function (ป) { ป.disabled = true; });

    Promise.all(ความเห็น.map(function (c) {
      return deleteDoc(doc(db, "leaveRequests", รหัสใบลา, "approvals", c.id));
    }))
      .then(function () { return deleteDoc(refใบ); })
      .then(function () {
        location.href = "leave-requests.html";
      })
      .catch(function (err) {
        ปุ่มทั้งหมด.forEach(function (ป) { ป.disabled = false; });
        alert("ลบไม่สำเร็จ ลองใหม่อีกครั้ง (" + err.message + ")");
      });
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (ความเห็น.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็น
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
               "</div><div>" + esc(c.message) + "</div></div>";
      }).join("");
  }

  // ── ส่งความเห็นใหม่ — บันทึกลง subcollection approvals จริง ──
  function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ปุ่ม = document.getElementById("ปุ่มส่งความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");

    // สัปดาห์ที่ 7 ยังไม่มีล็อกอิน จึงสมมติว่าผู้เขียนคือ สมหญิง รักงาน
    var ความเห็นใหม่ = {
      authorId: "u002", authorName: "สมหญิง รักงาน",
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    };

    ปุ่ม.disabled = true;
    addDoc(collection(db, "leaveRequests", รหัสใบลา, "approvals"), ความเห็นใหม่)
      .then(function (เอกสารใหม่) {
        ความเห็น.push(Object.assign({ id: เอกสารใหม่.id }, ความเห็นใหม่));
        ช่อง.value = "";
        วาดความเห็น();
        ปุ่ม.disabled = false;
      })
      .catch(function (err) {
        ปุ่ม.disabled = false;
        เตือน.textContent = "⚠️ ส่งความเห็นไม่สำเร็จ ลองใหม่อีกครั้ง (" + err.message + ")";
        เตือน.classList.remove("hidden");
      });
  }
})();
