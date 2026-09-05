// ─────────────────────────────────────────────────────────────
// js/leave-types.js — หน้าที่ 4 จัดการประเภทการลา
// สัปดาห์ที่ 7: เพิ่ม แก้ ลบ ลง Firestore จริง (collection "leaveTypes")
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { getUserInfo } from "./auth-guard.js";
import {
  collection, getDocs, addDoc,
  doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(async function () {
  var ผู้ใช้ = await getUserInfo();
  if (ผู้ใช้.role !== "hr") {
    alert("หน้านี้สำหรับฝ่ายบุคคลเท่านั้น");
    location.href = "index.html";
    return;
  }

  var ที่วางตาราง = document.getElementById("ตารางประเภท");
  var ช่องชื่อใหม่ = document.getElementById("ชื่อประเภทใหม่");
  var กล่องเตือน = document.getElementById("เตือนประเภท");
  var ปุ่มเพิ่ม = document.getElementById("ปุ่มเพิ่ม");

  var สแนปช็อต = await getDocs(collection(db, "leaveTypes"));
  var รายการ = สแนปช็อต.docs.map(function (เอกสาร) {
    return Object.assign({ id: เอกสาร.id }, เอกสาร.data());
  });

  วาดตาราง();
  ปุ่มเพิ่ม.addEventListener("click", เพิ่มประเภท);

  function วาดตาราง() {
    if (รายการ.length === 0) {
      ที่วางตาราง.innerHTML = "<p>ยังไม่มีประเภทการลาในระบบ</p>";
      return;
    }

    var html = "<table><thead><tr><th>ชื่อประเภทการลา</th><th>จัดการ</th></tr></thead><tbody>";
    รายการ.forEach(function (ประเภท) {
      html +=
        "<tr><td>" + esc(ประเภท.name) + "</td><td>" +
        '<button type="button" class="btn-ghost" data-edit="' + esc(ประเภท.id) + '">แก้ไข</button> ' +
        '<button type="button" class="btn-danger" data-del="' + esc(ประเภท.id) + '">ลบ</button>' +
        "</td></tr>";
    });
    html += "</tbody></table>";
    ที่วางตาราง.innerHTML = html;

    ที่วางตาราง.querySelectorAll("[data-edit]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { แก้ประเภท(ปุ่ม.dataset.edit); });
    });
    ที่วางตาราง.querySelectorAll("[data-del]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { ลบประเภท(ปุ่ม.dataset.del); });
    });
  }

  function เพิ่มประเภท() {
    var ชื่อ = ช่องชื่อใหม่.value.trim();
    if (!ชื่อ) {
      กล่องเตือน.textContent = "⚠️ พิมพ์ชื่อประเภทการลาก่อน จึงจะเพิ่มได้";
      กล่องเตือน.classList.remove("hidden");
      return;
    }
    กล่องเตือน.classList.add("hidden");

    ปุ่มเพิ่ม.disabled = true;
    addDoc(collection(db, "leaveTypes"), { name: ชื่อ })
      .then(function (เอกสารใหม่) {
        รายการ.push({ id: เอกสารใหม่.id, name: ชื่อ });
        ช่องชื่อใหม่.value = "";
        วาดตาราง();
        ปุ่มเพิ่ม.disabled = false;
      })
      .catch(function (err) {
        ปุ่มเพิ่ม.disabled = false;
        กล่องเตือน.textContent = "⚠️ เพิ่มไม่สำเร็จ ลองใหม่อีกครั้ง (" + err.message + ")";
        กล่องเตือน.classList.remove("hidden");
      });
  }

  function แก้ประเภท(id) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    var ชื่อใหม่ = prompt("แก้ชื่อประเภทการลา", ประเภท.name);
    if (ชื่อใหม่ === null) return;              // กดยกเลิก
    if (!ชื่อใหม่.trim()) { alert("ชื่อประเภทการลาว่างเปล่าไม่ได้"); return; }

    updateDoc(doc(db, "leaveTypes", id), { name: ชื่อใหม่.trim() })
      .then(function () {
        ประเภท.name = ชื่อใหม่.trim();
        วาดตาราง();
      })
      .catch(function (err) {
        alert("แก้ไขไม่สำเร็จ ลองใหม่อีกครั้ง (" + err.message + ")");
      });
  }

  function ลบประเภท(id) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    if (!confirm('ยืนยันการลบประเภท "' + ประเภท.name + '" หรือไม่')) return;

    deleteDoc(doc(db, "leaveTypes", id))
      .then(function () {
        รายการ = รายการ.filter(function (t) { return t.id !== id; });
        วาดตาราง();
      })
      .catch(function (err) {
        alert("ลบไม่สำเร็จ ลองใหม่อีกครั้ง (" + err.message + ")");
      });
  }
})();
