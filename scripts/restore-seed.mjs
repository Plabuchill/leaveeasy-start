// ─────────────────────────────────────────────────────────────
// scripts/restore-seed.mjs — คืนค่าข้อมูลตัวอย่างให้ตรงสเปกหัวข้อ 7
// (ใช้หลังทดสอบปุ่มอนุมัติ/ไม่อนุมัติ/ส่งความเห็น แล้วอยากล้างกลับเป็นค่าตั้งต้น)
// รัน: node scripts/restore-seed.mjs
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDtY-G5g1DS2xsrBSr-rTS55-geHpFuAEs",
  authDomain: "plabu-a08a6.firebaseapp.com",
  projectId: "plabu-a08a6",
  storageBucket: "plabu-a08a6.firebasestorage.app",
  messagingSenderId: "781940196681",
  appId: "1:781940196681:web:8af600267f69ab430c0698"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const leaveRequests = {
  lr001: {
    title: "ลาพักร้อนไปเที่ยวกับครอบครัว",
    reason: "วางแผนเดินทางไปต่างจังหวัดกับครอบครัว จองที่พักไว้ล่วงหน้าแล้ว",
    status: "รอพิจารณา",
    requesterId: "u001", requesterName: "สมชาย ใจดี",
    approverId: "u002", approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
    startDate: "2026-09-07", endDate: "2026-09-09",
    createdAt: "2026-09-01 09:15"
  },
  lr002: {
    title: "ลาป่วยไข้หวัดใหญ่",
    reason: "มีไข้สูงและไอมาก แพทย์แนะนำให้พักอยู่บ้าน 2 วัน",
    status: "อนุมัติ",
    requesterId: "u001", requesterName: "สมชาย ใจดี",
    approverId: "u002", approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
    startDate: "2026-08-24", endDate: "2026-08-25",
    createdAt: "2026-08-24 08:05"
  },
  lr003: {
    title: "ลากิจไปทำบัตรประชาชน",
    reason: "บัตรประชาชนหมดอายุ ต้องไปทำที่สำนักงานเขตในวันทำการ",
    status: "รอพิจารณา",
    requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
    approverId: "", approverName: "",
    leaveTypeId: "lt003", leaveTypeName: "ลากิจ",
    startDate: "2026-09-15", endDate: "2026-09-15",
    createdAt: "2026-09-10 16:30"
  },
  lr004: {
    title: "ลาพักร้อนช่วงวันหยุดยาว",
    reason: "อยากต่อวันหยุดยาวไปพักผ่อนกับครอบครัวอีก 3 วัน",
    status: "ไม่อนุมัติ",
    requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
    approverId: "u002", approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
    startDate: "2026-10-12", endDate: "2026-10-16",
    createdAt: "2026-09-20 11:00"
  },
  lr005: {
    title: "ลาป่วยไปพบแพทย์ตามนัด",
    reason: "มีนัดตรวจติดตามอาการกับแพทย์ในช่วงเช้า",
    status: "รอพิจารณา",
    requesterId: "u001", requesterName: "สมชาย ใจดี",
    approverId: "u002", approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
    startDate: "2026-09-22", endDate: "2026-09-22",
    createdAt: "2026-09-18 14:45"
  }
};

const approvals = {
  lr001: {
    ap001: { authorId: "u002", authorName: "สมหญิง รักงาน", message: "รับเรื่องแล้ว ขอดูตารางงานของทีมช่วงนั้นก่อนนะครับ", createdAt: "2026-09-01 13:40" },
    ap002: { authorId: "u003", authorName: "สมศรี ตั้งใจ", message: "ตรวจแล้ว วันลาพักร้อนคงเหลือครอบคลุมช่วงที่ขอ ไม่ติดขัดฝั่งฝ่ายบุคคล", createdAt: "2026-09-02 10:05" }
  },
  lr002: {
    ap003: { authorId: "u002", authorName: "สมหญิง รักงาน", message: "อนุมัติแล้ว พักผ่อนให้เต็มที่ งานที่ค้างไว้เดี๋ยวทีมช่วยดูให้", createdAt: "2026-08-24 09:20" }
  },
  lr003: {},
  lr004: {
    ap004: { authorId: "u002", authorName: "สมหญิง รักงาน", message: "ช่วงนั้นทีมมีงานส่งมอบพอดี ขอเลื่อนเป็นสัปดาห์ถัดไปได้ไหมครับ", createdAt: "2026-09-20 15:10" }
  },
  lr005: {}
};

async function restore() {
  for (const [id, data] of Object.entries(leaveRequests)) {
    await setDoc(doc(db, "leaveRequests", id), data);
    console.log("leaveRequests/" + id + " → คืนค่าแล้ว");
  }

  for (const [requestId, docsMap] of Object.entries(approvals)) {
    var สแนปช็อต = await getDocs(collection(db, "leaveRequests", requestId, "approvals"));
    for (const เอกสาร of สแนปช็อต.docs) {
      if (!(เอกสาร.id in docsMap)) {
        await deleteDoc(เอกสาร.ref);
        console.log("leaveRequests/" + requestId + "/approvals/" + เอกสาร.id + " → ลบ (ไม่ใช่ของสเปก)");
      }
    }
    for (const [id, data] of Object.entries(docsMap)) {
      await setDoc(doc(db, "leaveRequests", requestId, "approvals", id), data);
      console.log("leaveRequests/" + requestId + "/approvals/" + id + " → คืนค่าแล้ว");
    }
  }

  console.log("เสร็จแล้ว — ข้อมูลตรงกับสเปกหัวข้อ 7 ทุกใบ");
  process.exit(0);
}

restore().catch((err) => {
  console.error("เกิดข้อผิดพลาด:", err);
  process.exit(1);
});
