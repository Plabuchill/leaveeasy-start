// ─────────────────────────────────────────────────────────────
// js/auth-guard.js — โหลดในทุกหน้าที่ต้องล็อกอินก่อนถึงจะใช้ได้
// สัปดาห์ที่ 7: คนที่ไม่ได้ล็อกอิน อ่านข้อมูลไม่ได้เลย
// สัปดาห์ที่ 8: อ่าน role มาด้วย ให้หน้าอื่น import getUserInfo() ไปใช้จำกัดปุ่ม/เมนู
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

var พร้อมใช้งาน = new Promise(function (resolve) {
  onAuthStateChanged(auth, async function (user) {
    if (!user) {
      location.href = "login.html";
      return;
    }

    var สแนปช็อต = await getDoc(doc(db, "users", user.uid));
    var role = สแนปช็อต.exists() ? สแนปช็อต.data().role : "employee";
    var ข้อมูลผู้ใช้ = { uid: user.uid, name: user.displayName || user.email, role: role };

    var ช่องผู้ใช้ = document.getElementById("navUser");
    if (ช่องผู้ใช้) {
      ช่องผู้ใช้.innerHTML =
        "<span>" + esc(ข้อมูลผู้ใช้.name) + "</span>" +
        '<button type="button" class="btn-ghost" id="ปุ่มออกจากระบบ">ออกจากระบบ</button>';

      document.getElementById("ปุ่มออกจากระบบ").addEventListener("click", function () {
        signOut(auth).then(function () {
          location.href = "login.html";
        });
      });
    }

    // ซ่อนเมนู "ประเภทการลา" จากคนที่ไม่ใช่ฝ่ายบุคคล
    if (role !== "hr") {
      var ลิงก์ประเภทการลา = document.querySelector('.navbar a[href="leave-types.html"]');
      if (ลิงก์ประเภทการลา) ลิงก์ประเภทการลา.remove();
    }

    resolve(ข้อมูลผู้ใช้);
  });
});

// หน้าอื่นเรียก await getUserInfo() เพื่อรู้ว่าคนที่ล็อกอินอยู่คือใคร บทบาทอะไร
export function getUserInfo() {
  return พร้อมใช้งาน;
}
