// ─────────────────────────────────────────────────────────────
// js/signup.js — หน้าสมัครสมาชิก
// สัปดาห์ที่ 7: สมัครสำเร็จแล้วมีไฟล์ใหม่ใน users พร้อม role เริ่มต้น employee
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มสมัคร");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่ม = document.getElementById("ปุ่มสมัคร");

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var ชื่อ = document.getElementById("name").value.trim();
    var อีเมล = document.getElementById("email").value.trim();
    var รหัสผ่าน = document.getElementById("password").value;

    if (!ชื่อ || !อีเมล || !รหัสผ่าน) {
      เตือน("กรอกให้ครบทุกช่องก่อน จึงจะสมัครได้");
      return;
    }

    ปุ่ม.disabled = true;
    createUserWithEmailAndPassword(auth, อีเมล, รหัสผ่าน)
      .then(function (ผลลัพธ์) {
        var ผู้ใช้ = ผลลัพธ์.user;
        return updateProfile(ผู้ใช้, { displayName: ชื่อ })
          .then(function () {
            return setDoc(doc(db, "users", ผู้ใช้.uid), {
              name: ชื่อ,
              email: อีเมล,
              role: "employee"
            });
          });
      })
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
    if (code === "auth/email-already-in-use") return "อีเมลนี้มีคนใช้สมัครแล้ว";
    if (code === "auth/invalid-email") return "รูปแบบอีเมลไม่ถูกต้อง";
    if (code === "auth/weak-password") return "รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร";
    return "สมัครสมาชิกไม่สำเร็จ ลองใหม่อีกครั้ง";
  }
})();
