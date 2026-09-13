// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่าน/แก้ข้อมูลจริงจาก Firestore
// ─────────────────────────────────────────────────────────────

import { db, auth } from "./firebase-config.js";
import { getUserInfo } from "./auth-guard.js";
import {
  doc, getDoc, updateDoc, deleteDoc,
  collection, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { สรุปใบลาด้วยAI } from "./ai-assist.js";

(async function () {
  var ผู้ใช้ = await getUserInfo();
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

  // employee เปิดใบลาของพนักงานคนอื่นไม่ได้
  if (ผู้ใช้.role === "employee" && ใบ.requesterId !== ผู้ใช้.uid) {
    alert("คุณไม่มีสิทธิ์ดูใบลาของคนอื่น");
    location.href = "leave-requests.html";
    return;
  }

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
      ["วันที่ยื่น", esc(ใบ.createdAt)],
      ["สรุปจาก AI", ใบ.aiSuggestion ? esc(ใบ.aiSuggestion) : "ยังไม่มีสรุปจาก AI"]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ/ไม่อนุมัติ: employee ทำไม่ได้เลย (แม้ใบตัวเอง) ตาราง ACL.md
    // ปุ่มลบ: โชว์เฉพาะเจ้าของใบเอง และใบต้องยังรอพิจารณา (US-07)
    var เป็นเจ้าของ = ผู้ใช้.uid === ใบ.requesterId;
    var ปุ่มพิจารณาได้ = ใบ.status === "รอพิจารณา" && ผู้ใช้.role !== "employee";
    var ปุ่มลบได้ = ใบ.status === "รอพิจารณา" && เป็นเจ้าของ;

    if (ปุ่มพิจารณาได้ || ปุ่มลบได้) {
      html += '<div class="btn-row">';
      if (ปุ่มพิจารณาได้) {
        html +=
          '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
          '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
          '<button type="button" class="btn-ghost" id="ปุ่มสรุปAI">🤖 ให้ AI ช่วยสรุปใบลา</button>';
      }
      if (ปุ่มลบได้) {
        html += '<button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบลา</button>';
      }
      html += "</div>";
      if (ปุ่มพิจารณาได้) {
        html += '<div id="ข้อความAIสรุป" class="alert alert-ai hidden"></div>';
      }
    } else if (ใบ.status !== "รอพิจารณา") {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    if (ปุ่มพิจารณาได้) {
      document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
      document.getElementById("ปุ่มสรุปAI").addEventListener("click", สรุปด้วยAI);
    }
    if (ปุ่มลบได้) {
      document.getElementById("ปุ่มลบ").addEventListener("click", ลบใบลา);
    }
  }

  // ── ให้ AI ช่วยสรุปใบลาให้หัวหน้าอ่านก่อนตัดสินใจ ──
  // แก้เฉพาะช่อง aiSuggestion เท่านั้น ไม่แตะช่อง status — สถานะจริงต้องรอคนกดอนุมัติ/ไม่อนุมัติเองเสมอ
  function สรุปด้วยAI() {
    var ปุ่ม = document.getElementById("ปุ่มสรุปAI");
    var กล่องข้อความ = document.getElementById("ข้อความAIสรุป");
    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "🤖 กำลังสรุป...";
    กล่องข้อความ.classList.add("hidden");

    สรุปใบลาด้วยAI(ใบ)
      .then(function (ผลลัพธ์) {
        // บันทึกลง aiLog ทุกครั้งที่เรียก ไม่ว่าจะสำเร็จหรือไม่
        var งานบันทึกล็อก = addDoc(collection(db, "leaveRequests", รหัสใบลา, "aiLog"), {
          input: ผลลัพธ์.input,
          output: ผลลัพธ์.output,
          createdAt: เวลาตอนนี้()
        });

        if (!ผลลัพธ์.output) {
          กล่องข้อความ.textContent = "⚠️ AI สรุปให้ไม่ได้ในตอนนี้ ลองใหม่อีกครั้ง";
          กล่องข้อความ.className = "alert alert-error";
          กล่องข้อความ.classList.remove("hidden");
          return งานบันทึกล็อก;
        }

        return Promise.all([
          งานบันทึกล็อก,
          updateDoc(refใบ, { aiSuggestion: ผลลัพธ์.output })
        ]).then(function () {
          ใบ.aiSuggestion = ผลลัพธ์.output;
          วาดใบลา();
        });
      })
      .catch(function (err) {
        กล่องข้อความ.textContent = "⚠️ บันทึกสรุปไม่สำเร็จ ลองใหม่อีกครั้ง (" + err.message + ")";
        กล่องข้อความ.className = "alert alert-error";
        กล่องข้อความ.classList.remove("hidden");
      })
      .finally(function () {
        var ปุ่มล่าสุด = document.getElementById("ปุ่มสรุปAI");
        if (ปุ่มล่าสุด) {
          ปุ่มล่าสุด.disabled = false;
          ปุ่มล่าสุด.textContent = "🤖 ให้ AI ช่วยสรุปใบลา";
        }
      });
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

    getDocs(collection(db, "leaveRequests", รหัสใบลา, "aiLog"))
      .then(function (สแนปช็อตล็อก) {
        var ลบล็อกทั้งหมด = สแนปช็อตล็อก.docs.map(function (เอกสาร) {
          return deleteDoc(doc(db, "leaveRequests", รหัสใบลา, "aiLog", เอกสาร.id));
        });
        var ลบความเห็นทั้งหมด = ความเห็น.map(function (c) {
          return deleteDoc(doc(db, "leaveRequests", รหัสใบลา, "approvals", c.id));
        });
        return Promise.all(ลบล็อกทั้งหมด.concat(ลบความเห็นทั้งหมด));
      })
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

    var ผู้ใช้ = auth.currentUser;
    var ความเห็นใหม่ = {
      authorId: ผู้ใช้.uid, authorName: ผู้ใช้.displayName || ผู้ใช้.email,
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
