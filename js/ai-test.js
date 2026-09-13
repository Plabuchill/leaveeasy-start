// ─────────────────────────────────────────────────────────────
// js/ai-test.js — หน้าทดสอบเล็ก ๆ เชื่อมต่อ OpenRouter
// กดปุ่ม → ส่งข้อความ "สวัสดี" → โชว์คำตอบดิบที่ได้กลับมา
// ─────────────────────────────────────────────────────────────

import { OPENROUTER_API_KEY, AI_MODEL } from "./ai-config.js";

(function () {
  var ปุ่ม = document.getElementById("ปุ่มทดสอบ");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var กล่องคำตอบ = document.getElementById("กล่องคำตอบ");
  var ที่วางคำตอบ = document.getElementById("คำตอบ");

  ปุ่ม.addEventListener("click", ทดสอบ);

  function ทดสอบ() {
    กล่องเตือน.classList.add("hidden");
    กล่องคำตอบ.classList.add("hidden");
    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลังส่ง...";

    fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENROUTER_API_KEY
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "user", content: "สวัสดี" }]
      })
    })
      .then(function (ตอบกลับ) {
        if (!ตอบกลับ.ok) {
          return ตอบกลับ.text().then(function (ข้อความ) {
            throw new Error("HTTP " + ตอบกลับ.status + " — " + ข้อความ);
          });
        }
        return ตอบกลับ.json();
      })
      .then(function (ข้อมูล) {
        var คำตอบ =
          ข้อมูล.choices && ข้อมูล.choices[0] && ข้อมูล.choices[0].message
            ? ข้อมูล.choices[0].message.content
            : "(ไม่มีคำตอบกลับมา)";
        ที่วางคำตอบ.textContent = คำตอบ;
        กล่องคำตอบ.classList.remove("hidden");
      })
      .catch(function (err) {
        กล่องเตือน.textContent = "⚠️ เรียก AI ไม่สำเร็จ — " + err.message;
        กล่องเตือน.classList.remove("hidden");
      })
      .finally(function () {
        ปุ่ม.disabled = false;
        ปุ่ม.textContent = 'ส่งข้อความ "สวัสดี" ให้ AI';
      });
  }
})();
