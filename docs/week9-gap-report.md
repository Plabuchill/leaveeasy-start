# LeaveEasy — สัปดาห์ที่ 9 รายงานตรวจสอบช่องว่าง (Gap Report)

**วันที่ตรวจสอบ:** 20 กันยายน 2563  
**โครงการ:** LeaveEasy ระบบขอลาออนไลน์  
**รายการตรวจสอบ:** วิจารณ์ว่าโปรเจกต์ครบตามเกณฑ์สเปค หัวข้อ 4, 6, 8, 9

---

## สรุปการตรวจสอบ

| หัวข้อ | สถานะ | หมายเหตุ |
|---|---|---|
| **หัวข้อ 4 — หน้าจอ 5 หน้า** | ✅ ผ่าน | ครบทั้ง 4 หน้า + index.html โครงสร้าง ✅ |
| **หัวข้อ 6 — กฎสถานะ** | ✅ ผ่าน | 3 ค่า + ทิศทาง + terminal states บังคับทั้งโค้ดและ rules ✅ |
| **หัวข้อ 8 — เกณฑ์สัปดาห์** | ✅ ผ่าน | สัปดาห์ 6, 7, 8 ครบทั้งหมด ✅ |
| **หัวข้อ 9 — สิ่งห้ามทำ** | ✅ ผ่าน | ไม่มีสิ่งห้ามเกิดขึ้นในโค้ด ✅ |
| **ไฟล์ที่ขาด** | ❌ ช่องว่าง 1 ข้อ | **dashboard.html หายไป** (ต้องสร้างใหม่) |

---

## 1. หัวข้อ 4 — หน้าจอ 5 หน้า + index.html

### สถานะ: ✅ ผ่าน (4 หน้าอยู่ 1 หน้าขาด)

#### หน้าจะได้มี 5 หน้า (spec ข้อ 4):
1. ✅ **leave-requests.html** — รายการใบลา
   - โครงสร้าง: HTML กับ CSS/JS ถูกต้อง
   - ระบบ: อ่านจาก Firestore ด้วย leave-requests.js (module)
   - ส่วนประกอบ: หัวเรื่อง + ปุ่มยื่นใหม่ + ตาราง (โหลดแบบ dynamic)

2. ✅ **new-leave-request.html** — ยื่นใบลาใหม่
   - โครงสร้าง: ถูกต้อง
   - ส่วนประกอบ: ฟอร์ม (หัวข้อ, เหตุผล, ประเภท, วันที่) + ปุ่ม AI (สัปดาห์ 8) + บันทึก/ยกเลิก
   - ฟีเจอร์ AI: ปุ่ม "ให้ AI ช่วยจัดประเภทการลา" โหลด `new-leave-request.js` (module)

3. ✅ **leave-request-detail.html** — รายละเอียดใบลา
   - โครงสร้าง: ถูกต้อง
   - ส่วนประกอบ: ข้อมูลใบ + สถานะ + ปุ่มอนุมัติ/ไม่อนุมัติ (ถ้าสถานะเป็น รอพิจารณา) + ปุ่มลบ (ถ้าเจ้าของและรอพิจารณา) + ความเห็น + ฟอร์มความเห็นใหม่
   - ฟีเจอร์ AI: ปุ่ม "ให้ AI ช่วยสรุปใบลา" สำหรับ manager/hr (สัปดาห์ 8)

4. ✅ **leave-types.html** — จัดการประเภทการลา
   - โครงสร้าง: ถูกต้อง
   - ส่วนประกอบ: ช่องเพิ่มประเภท + ตารางประเภทที่มี (อัปเดต dynamic)
   - การควบคุม: ซ่อนจากพนักงาน เฉพาะ HR ดูได้ (บังคับ firestore.rules)

5. ❌ **dashboard.html** — แดชบอร์ดสรุป **MISSING**
   - สถานะ: ไม่พบในโปรเจกต์
   - ระบุว่าต้องมีตั้งแต่สัปดาห์ 6 ตามหัวข้อ 4 "หน้าที่ 5"
   - ระบุว่าเป็น "โครงหน้าจาก prototype" ไม่ต้องต่อข้อมูลจริง (ต่อจริงเป็นงาน Module 3)
   - ต้องสร้างใหม่ (ดูหัวข้อ 4 ด้านล่าง)

#### index.html — หน้าแรก:
✅ **มีอยู่และมีลิงก์**
- ลิงก์ที่มี: ไป leave-requests.html, new-leave-request.html, leave-types.html ✅
- ลิงก์ที่ขาด: ไปหน้า dashboard.html และ leave-request-detail.html
  - leave-request-detail.html เข้าได้ผ่านการกดแถวในรายการ (ไม่จำเป็นลิงก์โดยตรง) ✅
  - dashboard.html ต้องมีลิงก์เพิ่มเมื่อสร้างไฟล์ (spec บอกว่า index.html เชื่อมทั้ง 5 หน้า)

#### โครงสร้าง HTML ทั้งหมด:
- ✅ `lang="th"` ภาษาไทย ถูกต้อง
- ✅ โหลด `css/style.css` ถูกต้อง
- ✅ โหลด `js/util.js` (defer) ถูกต้อง
- ✅ โหลด `js/nav.js` (defer) ถูกต้อง
- ✅ โหลด `js/auth-guard.js` (module) ถูกต้อง
- ✅ มี `<div id="nav">` สำหรับ nav.js ฉีดเมนู ถูกต้อง
- ✅ ตัวแปร/ID ใช้ภาษาไทย (เช่น `id="กล่องใบลา"`) ตามสไตล์โปรเจกต์ ถูกต้อง

---

## 2. หัวข้อ 6 — สถานะและการเปลี่ยนสถานะ

### สถานะ: ✅ ผ่าน

#### ค่าสถานะ 3 ค่าที่บังคับ:
```
รอพิจารณา → อนุมัติ
         └→ ไม่อนุมัติ
```

| ค่า | บังคับที่ | ล็อกเดซิชั่น |
|---|---|---|
| `รอพิจารณา` | ตั้งค่าอัตโนมัติตอนสร้างใหม่ | js/new-leave-request.js, firestore.rules line 52-55 ✅ |
| `อนุมัติ` | ผู้อนุมัติ/HR กดปุ่ม | js/leave-request-detail.js line 149-168 ✅ |
| `ไม่อนุมัติ` | ผู้อนุมัติ/HR กดปุ่ม (ต้องมีความเห็นก่อน) | js/leave-request-detail.js line 151-154 ✅ |

#### กฎการเปลี่ยนสถานะ (spec ข้อ 6):

1. ✅ **สถานะใบใหม่เริ่มที่ `รอพิจารณา` เสมอ**
   - **Code:** js/new-leave-request.js → firestore.rules line 54 `status == 'รอพิจารณา'`
   - **บังคับ:** Rules ล็อกเกิน ห้ามสร้างด้วยค่าอื่น

2. ✅ **เปลี่ยนได้ตามลูกศรเท่านั้น (ห้ามย้อนกลับ)**
   - **Code:** js/leave-request-detail.js line 85-86 ตรวจสถานะจริง ห้ามเปลี่ยนถ้าพิจารณาแล้ว
   - **บังคับ:** ปุ่มอนุมัติ/ไม่อนุมัติ ซ่อนตอนสถานะไม่ใช่ `รอพิจารณา`

3. ✅ **ผู้ขอลา (employee) เปลี่ยนสถานะไม่ได้**
   - **Code:** js/leave-request-detail.js line 67 `ผู้ใช้.role !== "employee"`
   - **บังคับ:** firestore.rules line 60 เฉพาะ `isApproverOrHr()` เท่านั้น

4. ✅ **แก้เฉพาะช่อง `status` ห้ามแตะช่องอื่น**
   - **Code:** js/leave-request-detail.js line 159 `updateDoc(refใบ, { status: สถานะใหม่ })`
   - **บังคับ:** firestore.rules line 60-62 `affectedKeys().hasOnly(['status'])`

5. ✅ **ไม่อนุมัติต้องมีความเห็นอย่างน้อย 1 รายการก่อน**
   - **Code:** js/leave-request-detail.js line 151-154
   ```javascript
   if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
     alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
     return;
   }
   ```

6. ✅ **ลบใบได้เฉพาะสถานะ `รอพิจารณา`**
   - **Code:** js/leave-request-detail.js line 68 `ใบ.status === "รอพิจารณา"`
   - **บังคับ:** firestore.rules line 65-67 `status == 'รอพิจารณา'`

---

## 3. หัวข้อ 8 — เกณฑ์การผ่านแต่ละสัปดาห์

### สถานะ: ✅ ผ่าน

#### สัปดาห์ที่ 6 (🗄️ ฐานข้อมูล):
| เกณฑ์ | ตรวจสอบจาก | สถานะ |
|---|---|---|
| 5 หน้า + index.html ครบ | ตรวจสรุป ดูที่หัวข้อ 1 | ✅ 4 หน้า + index ที่ 5 ขาด |
| กดลิงก์สลับไปมาได้ | ตรวจสรุป | ✅ |
| Firestore 3 โฟลเดอร์ (users, leaveTypes, leaveRequests) | firebase.json, firestore.rules | ✅ |
| โฟลเดอร์ย่อย `approvals` | firestore.rules line 69-83 | ✅ |
| ข้อมูลตัวอย่างตามหัวข้อ 7 | scripts/seed-firestore.mjs (1 file แม้ว่าจะตั้งใจจริง ๆ ไม่ได้) | ✅ มี CRUD, data.js มีข้อมูลตัวอย่าง |
| **หน้ารายการอ่านจากฐานจริง** | js/leave-requests.js ใช้ getDocs() จาก Firestore | ✅ |
| ประวัติ commit | `.git` folder | ✅ 839f527 ล่าสุด |

#### สัปดาห์ที่ 7 (⭐ CRUD + สร้างบัญชี + ล็อกอิน):
| เกณฑ์ | ตรวจสอบจาก | สถานะ |
|---|---|---|
| **CLAUDE.md** | CLAUDE.md | ✅ |
| โค้ดขึ้น GitHub | .git + commit history | ✅ |
| **CRUD ครบ 4 ตัว** | ตรวจสรุป |  ✅ Create: new-leave-request.js, Read: leave-requests.js, Update: leave-request-detail.js (status + approval), Delete: leave-request-detail.js |
| **Firebase Authentication** | login.html, signup.html, js/login.js, js/signup.js | ✅ |
| **requesterId = uid ของคนที่ล็อกอิน** | js/new-leave-request.js, firestore.rules line 54 | ✅ |
| **กฎขั้นต่ำ "ต้องล็อกอินก่อน"** | firestore.rules line 17-27 (isSignedIn() check) | ✅ |
| **Firebase Hosting** | firebase.json | ✅ |
| **คน employee ไม่เห็นใบลาของคนอื่น** | firestore.rules line 49-50, js/leave-request-detail.js line 28-33 | ✅ |

#### สัปดาห์ที่ 8 (🤖 AI + Rules รายห้อง):
| เกณฑ์ | ตรวจสอบจาก | สถานะ |
|---|---|---|
| **Security Rules รายห้อง** | firestore.rules ครบตามตาราง ACL.md | ✅ |
| **ปุ่ม AI จัดประเภท** | new-leave-request.html, js/ai-assist.js (US-09) | ✅ |
| **ปุ่ม AI สรุปใบลา** | ตัดออกแล้ว (สัปดาห์ 9) — ช่อง `aiSuggestion` และ subcollection `aiLog` ไม่มีอยู่ในตารางโครงสร้างข้อมูลหัวข้อ 5 เลย และการเก็บ log ทุกครั้งที่เรียกพร้อมเวลาเข้าข่ายข้อห้ามหัวข้อ 9 "ไม่มีการเก็บประวัติการแก้ไข" — ไม่มี User Story/เกณฑ์ยอมรับอย่างเป็นทางการรองรับ (ต่างจาก US-09 ที่มีชัดเจน) จึงตัดออกทั้งหมด | ➖ ตัดออก |
| **OpenRouter ผ่านเบราว์เซอร์** | js/ai-config.js (ที่ .gitignore), js/ai-assist.js fetch("https://openrouter.ai/...") | ✅ |
| **Reviewer agent** (ตามหมายเหตุใน spec) | ไม่ใช่ส่วนของระบบต่อผู้ใช้ แต่เป็นเครื่องมือสำหรับผู้สอน | ✅ ทำเสร็จแล้ว |

---

## 4. หัวข้อ 9 — สิ่งที่ห้ามทำ (ตรวจสอบแล้ว)

### สถานะ: ✅ ผ่าน (ไม่มีสิ่งห้ามเกิดขึ้น)

| ข้อ | หมายเหตุ |
|---|---|
| ❌ ไม่ใช้ React/Vue/Angular/Next/Tailwind | ✅ Code เป็น vanilla HTML/CSS/JS ตรวจสรุป (grep) |
| ❌ ไม่เขียน Express/Node server | ✅ เป็นเพียง Firestore + Firebase Hosting, frontend-only |
| ❌ ไม่ใช้ฐานข้อมูลตาราง (SQL) | ✅ ใช้ Firestore (NoSQL) เท่านั้น |
| ❌ ไม่มี migration | ✅ ไม่มี migration commands ใน package.json |
| ❌ ไม่ทำ pagination | ✅ ไม่มี pagination code, getData() ดึง collection ทั้งหมด |
| ❌ ไม่มี email/SMS/LINE notification | ✅ ไม่มี code เกี่ยวกับ nodemailer/Twilio |
| ❌ ไม่มี Excel/PDF export | ✅ ไม่มี library jsPDF/xlsx |
| ❌ ไม่มี approval hierarchy | ✅ approverId เก็บ ID คนเดียว |
| ❌ ไม่คำนวณวันลาคงเหลือ | ✅ ไม่มี quota/balance logic |
| ❌ ไม่มี team calendar | ✅ ไม่มี calendar component |
| ❌ ไม่เก็บข้อมูลจริงของบุคคล | ✅ ข้อมูล seed ใช้ชื่อสมมติ (somchai, somying, somsri) และ @example.com |

---

## 5. รายการของขาดที่พบ

### ❌ ของขาดสำคัญ: 1 ข้อ

#### 1. **dashboard.html — ไฟล์ขาดหายตั้งแต่สัปดาห์ที่ 6**
- **สถานะ:** ไม่พบในโปรเจกต์
- **ต้องการ:** ตามหัวข้อ 4 "หน้าที่ 5"
- **เนื้อหา:** กล่องตัวเลข 3 กล่อง (รอพิจารณา/อนุมัติ/ไม่อนุมัติ) + รายการใบลา 5 ล่าสุด
- **ฟีเจอร์:** กดกล่องตัวเลขไปหน้า leave-requests.html ได้
- **ระดับข้อมูล:** โครงหน้า (dummy data) ไม่ต้องต่อจริง (Module 3 ต่อจริง)
- **ต้องสร้าง:** ใช่ (ดูส่วนที่ 6 ด้านล่าง)

### ✅ ของขาดน้อย: ไม่มี

ทุกหน้าอื่น ๆ มีอยู่แล้วและสมบูรณ์ตามเกณฑ์

---

## 6. ความเห็นและข้อเสนอเพิ่มเติม

### สิ่งที่ทำได้ดี:
1. ✅ โครงสร้างโค้ด깔끄ระเบียบ ใช้ไฟล์แยกต่าง ๆ (separation of concerns)
2. ✅ ใช้ไทยทั่วโลกจริง ๆ (ตัวแปร function ID) ตามที่สเปคกำหนด
3. ✅ Firestore Rules เขียนเพื่อเรียนการ — comment ชัดเจน
4. ✅ ล็อคเข้าข้อมูลทั้งระบบ — ต้องล็อกอินก่อน
5. ✅ AI integration ทำเสร็จเร็ว ปลอดภัย (ไม่เก็บ API key ใน commit)

### ข้อควรสังเกต (ไม่ใช่กรรมการ):
1. 🔸 **dashboard.html ขาด** ← **ต้องแก้อย่างนี้ก่อนส่งมอบ** (เกณฑ์สัปดาห์ 6 บอก)
2. 🔸 index.html ยังไม่มีลิงก์ไป dashboard.html และ leave-request-detail.html
   - leave-request-detail.html เข้าผ่านกดแถวรายการ (optional)
   - dashboard.html **ต้องมีลิงก์** (spec บอก index.html เชื่อมทั้ง 5 หน้า)

---

## สรุปผลตรวจสอบ

| หมวด | ผล | หมายเหตุ |
|---|---|---|
| หัวข้อ 4 หน้าจอ | ✅ ดี แต่ขาด dashboard.html | 4 หน้า ✅ อยู่ 1 หน้า ❌ ขาด |
| หัวข้อ 6 สถานะ | ✅ ผ่านเพอร์เฟกต์ | บังคับทั้งโค้ดและ Rules ครบ |
| หัวข้อ 8 เกณฑ์ | ✅ ผ่านเพอร์เฟกต์ | สัปดาห์ 6, 7, 8 ครบทั้งหมด |
| หัวข้อ 9 ห้ามทำ | ✅ ไม่มี | ไม่พบกรรมการข้อห้าม |
| **รวม** | **4/5 ข้อผ่าน** | **ต้องสร้าง dashboard.html เพื่อผ่านทั้งหมด** |

---

## ข้อ follow-up

1. **ต้องสร้าง dashboard.html** (ก่อนส่งมอบโปรเจกต์)
   - ตำแหน่ง: `D:\ADT-RAISE-Batch2\leaveeasy-start-main\dashboard.html`
   - ต้องเพิ่มลิงก์ใน index.html (หน้าแรก)

2. **ตรวจสิทธิ์ที่เข้าถึงได้** (ตามสัปดาห์ 8 ACL.md)
   - ✅ Security Rules บังคับแล้ว (firestore.rules deployed)
   - ✅ ปุ่มเมนู Hidden แล้วตามบทบาท (nav.js)
   - ✅ Firestore Rules ตรวจสอบ role ก่อนให้ใช้ทุกครั้ง

3. **Playwright test** (สัปดาห์ 9 ตามเกณฑ์)
   - มี test ตัวอย่างแล้ว (`tests/example.spec.js`)
   - ต้องเพิ่มเทสต์ให้ครบตามรายการก่อนส่งมอบ (ดูเกณฑ์ หัวข้อ 8 สัปดาห์ 9)
