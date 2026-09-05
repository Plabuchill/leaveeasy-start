// ─────────────────────────────────────────────────────────────
// js/auth-guard.js — โหลดในทุกหน้าที่ต้องล็อกอินก่อนถึงจะใช้ได้
// สัปดาห์ที่ 7: คนที่ไม่ได้ล็อกอิน อ่านข้อมูลไม่ได้เลย
// ─────────────────────────────────────────────────────────────

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, function (user) {
  if (!user) {
    location.href = "login.html";
    return;
  }

  var ช่องผู้ใช้ = document.getElementById("navUser");
  if (!ช่องผู้ใช้) return;

  ช่องผู้ใช้.innerHTML =
    "<span>" + esc(user.displayName || user.email) + "</span>" +
    '<button type="button" class="btn-ghost" id="ปุ่มออกจากระบบ">ออกจากระบบ</button>';

  document.getElementById("ปุ่มออกจากระบบ").addEventListener("click", function () {
    signOut(auth).then(function () {
      location.href = "login.html";
    });
  });
});
