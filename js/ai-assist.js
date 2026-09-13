// ─────────────────────────────────────────────────────────────
// js/ai-assist.js — ผู้ช่วย AI ของ LeaveEasy (สัปดาห์ที่ 8)
// เรียก OpenRouter ตรงจากเบราว์เซอร์ (ไม่มีเซิร์ฟเวอร์ของตัวเอง ตามข้อกำหนดของโปรเจกต์)
//
// 1) จัดประเภทการลาด้วยAI — US-09: ผลต้องเป็นประเภทที่มีอยู่จริงในระบบเท่านั้น
//    ไม่ตรง/เรียกไม่สำเร็จ/เกิน 15 วิ ถือว่าจัดให้ไม่ได้
// 2) สรุปใบลาด้วยAI — สรุปสั้น ๆ ให้หัวหน้าอ่านก่อนกดอนุมัติ ไม่แตะสถานะใบลาเอง
// ─────────────────────────────────────────────────────────────

import { OPENROUTER_API_KEY, AI_MODEL } from "./ai-config.js";

var เวลาสูงสุดมิลลิวินาที = 15000;

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

  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: ตัวตัดเวลา.signal,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + OPENROUTER_API_KEY
    },
    body: JSON.stringify({
      model: AI_MODEL,
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
    })
    .catch(function () {
      return null; // เรียกไม่สำเร็จ หรือหมดเวลา — ไม่ให้ระบบค้าง ถือว่าจัดให้ไม่ได้
    })
    .finally(function () {
      clearTimeout(นับเวลา);
    });
}

// ใบ: ออบเจ็กต์ใบลา { title, reason, leaveTypeName, requesterName, startDate, endDate, ... }
// คืนค่า Promise<{input, output}> เสมอ — input ไว้บันทึกลง aiLog ทุกครั้งที่เรียกไม่ว่าสำเร็จหรือไม่
// output เป็น null ถ้าเรียกไม่สำเร็จหรือหมดเวลา — ไม่แตะสถานะใบลาเอง รอคนกดยืนยันเสมอ
export function สรุปใบลาด้วยAI(ใบ) {
  var ตัวตัดเวลา = new AbortController();
  var นับเวลา = setTimeout(function () { ตัวตัดเวลา.abort(); }, เวลาสูงสุดมิลลิวินาที);

  var คำสั่ง =
    "ต่อไปนี้คือใบขอลาหนึ่งใบ ช่วยเขียนสรุปสั้น ๆ ไม่เกิน 2 ประโยค ให้หัวหน้าอ่านก่อนตัดสินใจอนุมัติ " +
    "ตอบเป็นข้อความสรุปเพียงอย่างเดียว ห้ามใส่คำนำหรือคำลงท้าย\n\n" +
    "ผู้ขอลา: " + ใบ.requesterName + "\n" +
    "ประเภทการลา: " + ใบ.leaveTypeName + "\n" +
    "หัวข้อ: " + ใบ.title + "\n" +
    "เหตุผล: " + ใบ.reason + "\n" +
    "วันที่ลา: " + ใบ.startDate + " ถึง " + ใบ.endDate;

  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: ตัวตัดเวลา.signal,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + OPENROUTER_API_KEY
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: "user", content: คำสั่ง }],
      temperature: 0.3
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
      return { input: คำสั่ง, output: ข้อความตอบ || null };
    })
    .catch(function () {
      return { input: คำสั่ง, output: null }; // เรียกไม่สำเร็จ หรือหมดเวลา — ยังส่ง input กลับไปให้บันทึกลง aiLog ได้
    })
    .finally(function () {
      clearTimeout(นับเวลา);
    });
}
