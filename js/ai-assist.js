// ─────────────────────────────────────────────────────────────
// js/ai-assist.js — ผู้ช่วย AI ของ LeaveEasy (สัปดาห์ที่ 8)
// เรียก OpenRouter ตรงจากเบราว์เซอร์ (ไม่มีเซิร์ฟเวอร์ของตัวเอง ตามข้อกำหนดของโปรเจกต์)
//
// จัดประเภทการลาด้วยAI — US-09: ผลต้องเป็นประเภทที่มีอยู่จริงในระบบเท่านั้น
// ไม่ตรง/เรียกไม่สำเร็จ/เกิน 15 วิ ถือว่าจัดให้ไม่ได้
// ─────────────────────────────────────────────────────────────

var เวลาสูงสุดมิลลิวินาที = 15000;

// ai-config.js เก็บคีย์ลับ ไม่ถูก deploy ขึ้น production (กันคีย์รั่ว ตาม CLAUDE.md)
// โหลดแบบ dynamic import ตอนเรียกใช้จริงแทน static import เพราะถ้าไฟล์นี้ไม่มี (เช่นบน production)
// static import จะทำให้ทั้งไฟล์นี้และไฟล์ที่ import ต่อ (new-leave-request.js, leave-request-detail.js)
// โหลดไม่ขึ้นเลยทั้งไฟล์ — ไม่ใช่แค่ปุ่ม AI ใช้ไม่ได้ แต่ฟอร์ม/หน้าทั้งหน้าพังไปด้วย
function โหลดค่าตั้งค่าAI() {
  return import("./ai-config.js")
    .then(function (ค่า) { return { key: ค่า.OPENROUTER_API_KEY, model: ค่า.AI_MODEL }; })
    .catch(function () { return null; }); // ยังไม่ได้ตั้งค่าไฟล์นี้ — ถือว่าเรียก AI ไม่ได้ ไม่ใช่ error
}

// เหตุผล: ข้อความในช่อง reason ที่ผู้ใช้พิมพ์
// ประเภททั้งหมด: [{ id, name }, ...] รายชื่อ leaveTypes ที่มีอยู่จริงตอนนี้
// คืนค่า Promise<string|null> — id ของประเภทที่ AI เลือก หรือ null ถ้าจัดให้ไม่ได้
export function จัดประเภทการลาด้วยAI(เหตุผล, ประเภททั้งหมด) {
  var ตัวตัดเวลา = new AbortController();
  var นับเวลา = setTimeout(function () { ตัวตัดเวลา.abort(); }, เวลาสูงสุดมิลลิวินาที);

  var รายชื่อประเภท = ประเภททั้งหมด
    .map(function (t) { return t.id + ": " + t.name; })
    .join("\n");

  var คำสั่ง =
    "ต่อไปนี้คือเหตุผลการลาที่พนักงานพิมพ์ และรายชื่อประเภทการลาที่มีอยู่จริงในระบบ " +
    "เลือกประเภทที่ตรงที่สุด 1 ประเภทจากรายชื่อนี้เท่านั้น ตอบกลับเป็นรหัส (id) ของประเภทนั้นเพียงอย่างเดียว " +
    "ห้ามตอบอย่างอื่นเพิ่มเติม ถ้าไม่มีประเภทไหนตรงเลย ให้ตอบว่า none\n\n" +
    "รายชื่อประเภทการลา:\n" + รายชื่อประเภท + "\n\n" +
    "เหตุผลการลา: " + เหตุผล;

  return โหลดค่าตั้งค่าAI()
    .then(function (ตั้งค่า) {
      if (!ตั้งค่า) return null; // ไม่มี ai-config.js — ถือว่าจัดให้ไม่ได้ เหมือนเรียกไม่สำเร็จ

      return fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: ตัวตัดเวลา.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + ตั้งค่า.key
        },
        body: JSON.stringify({
          model: ตั้งค่า.model,
          messages: [{ role: "user", content: คำสั่ง }],
          temperature: 0
        })
      })
        .then(function (ตอบกลับ) {
          if (!ตอบกลับ.ok) throw new Error("เรียก AI ไม่สำเร็จ");
          return ตอบกลับ.json();
        })
        .then(function (ข้อมูล) {
          var ข้อความตอบ =
            ข้อมูล.choices && ข้อมูล.choices[0] && ข้อมูล.choices[0].message
              ? ข้อมูล.choices[0].message.content.trim()
              : "";

          var ตรงกับประเภทไหน =
            ประเภททั้งหมด.find(function (t) { return t.id === ข้อความตอบ; }) ||
            ประเภททั้งหมด.find(function (t) { return ข้อความตอบ.indexOf(t.id) !== -1; });

          return ตรงกับประเภทไหน ? ตรงกับประเภทไหน.id : null;
        });
    })
    .catch(function () {
      return null; // เรียกไม่สำเร็จ หรือหมดเวลา — ไม่ให้ระบบค้าง ถือว่าจัดให้ไม่ได้
    })
    .finally(function () {
      clearTimeout(นับเวลา);
    });
}
