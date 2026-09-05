// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ
// สัปดาห์ที่ 7
// ─────────────────────────────────────────────────────────────

import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มล็อกอิน");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่ม = document.getElementById("ปุ่มเข้าสู่ระบบ");

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var อีเมล = document.getElementById("email").value.trim();
    var รหัสผ่าน = document.getElementById("password").value;

    if (!อีเมล || !รหัสผ่าน) {
      เตือน("กรอกอีเมลและรหัสผ่านให้ครบ");
      return;
    }

    ปุ่ม.disabled = true;
    signInWithEmailAndPassword(auth, อีเมล, รหัสผ่าน)
      .then(function () {
        location.href = "index.html";
      })
      .catch(function (err) {
        ปุ่ม.disabled = false;
        เตือน(ข้อความข้อผิดพลาด(err.code));
      });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }

  function ข้อความข้อผิดพลาด(code) {
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    }
    if (code === "auth/invalid-email") {
      return "รูปแบบอีเมลไม่ถูกต้อง";
    }
    return "เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง";
  }
})();
