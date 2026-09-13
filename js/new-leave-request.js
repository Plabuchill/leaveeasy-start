// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกใบลาใหม่ลง Firestore จริง (collection "leaveRequests")
// requesterId/requesterName มาจากคนที่ล็อกอินอยู่จริง
// ─────────────────────────────────────────────────────────────

import { db, auth } from "./firebase-config.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { จัดประเภทการลาด้วยAI } from "./ai-assist.js";

(async function () {
  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องเหตุผล = document.getElementById("reason");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
  var ปุ่มAI = document.getElementById("ปุ่มAI");
  var กล่องข้อความAI = document.getElementById("ข้อความAI");

  // เติมรายการเลื่อนลงด้วยประเภทการลาจริงจาก Firestore
  var สแนปช็อตประเภท = await getDocs(collection(db, "leaveTypes"));
  var ประเภทการลาทั้งหมด = สแนปช็อตประเภท.docs.map(function (เอกสาร) {
    return Object.assign({ id: เอกสาร.id }, เอกสาร.data());
  });
  ประเภทการลาทั้งหมด.forEach(function (ประเภท) {
    var ตัวเลือก = document.createElement("option");
    ตัวเลือก.value = ประเภท.id;
    ตัวเลือก.textContent = ประเภท.name;
    ช่องประเภท.appendChild(ตัวเลือก);
  });

  ปุ่มAI.addEventListener("click", function () {
    var เหตุผล = ช่องเหตุผล.value.trim();
    if (!เหตุผล) {
      แสดงข้อความAI("⚠️ พิมพ์เหตุผลการลาก่อน แล้วค่อยกดให้ AI ช่วยจัดประเภท", "alert-error");
      return;
    }

    ปุ่มAI.disabled = true;
    ปุ่มAI.textContent = "🤖 กำลังคิด...";
    แสดงข้อความAI("", null, true);

    จัดประเภทการลาด้วยAI(เหตุผล, ประเภทการลาทั้งหมด)
      .then(function (รหัสประเภทที่เลือก) {
        if (!รหัสประเภทที่เลือก) {
          แสดงข้อความAI("⚠️ AI จัดประเภทให้ไม่ได้ ลองเลือกเองจากรายการด้านล่าง", "alert-error");
          return;
        }
        ช่องประเภท.value = รหัสประเภทที่เลือก;
        แสดงข้อความAI("🤖 ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน", "alert-ai");
      })
      .finally(function () {
        ปุ่มAI.disabled = false;
        ปุ่มAI.textContent = "🤖 ให้ AI ช่วยจัดประเภทการลา";
      });
  });

  function แสดงข้อความAI(ข้อความ, คลาส, ซ่อนไว้ก่อน) {
    กล่องข้อความAI.className = "alert " + (คลาส || "alert-ai");
    กล่องข้อความAI.textContent = ข้อความ;
    if (ซ่อนไว้ก่อน || !ข้อความ) {
      กล่องข้อความAI.classList.add("hidden");
    } else {
      กล่องข้อความAI.classList.remove("hidden");
    }
  }

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: document.getElementById("reason").value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    var ประเภท = ประเภทการลาทั้งหมด.find(function (t) { return t.id === ค่า.leaveTypeId; });
    var ผู้ใช้ = auth.currentUser;

    var ใบใหม่ = {
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
      requesterId: ผู้ใช้.uid, requesterName: ผู้ใช้.displayName || ผู้ใช้.email,
      approverId: "",      approverName: "",
      leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
      startDate: ค่า.startDate,
      endDate: ค่า.endDate,
      createdAt: เวลาตอนนี้()
    };

    ปุ่มบันทึก.disabled = true;
    addDoc(collection(db, "leaveRequests"), ใบใหม่)
      .then(function () {
        location.href = "leave-requests.html";
      })
      .catch(function (err) {
        ปุ่มบันทึก.disabled = false;
        เตือน("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง (" + err.message + ")");
      });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();
