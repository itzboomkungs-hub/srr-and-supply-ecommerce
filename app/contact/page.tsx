"use client";

import { useState } from "react";

import SiteHeader from "../../components/layout/SiteHeader";
import styles from "./ContactPage.module.css";

const LINE_ID = "@";
const LINE_URL = "https://line.me/ti/p/wpZi4v6Ode";

const contactInfo = {
  phone: "093-458-3742",
  email: "srrandsupply@gmail.com",
  addressLine1: "65/38 ถนน ตากวน-หาดทรายทอง ตำบล มาบตาพุด ",
  addressLine2: "อำเภอ เมืองระยอง จังหวัด ระยอง 21150",
  hours: "จันทร์ - ศุกร์ 8:30 - 17:30 น.",
};

const quickActions = [
  { icon: "?", label: "สอบถามสินค้า" },
  { icon: "🧾", label: "ขอใบเสนอราคา" },
  { icon: "📦", label: "เช็กสต็อก" },
  { icon: "🚚", label: "ติดตามออเดอร์" },
];

const services = [
  {
    title: "ให้คำแนะนำการเลือกสินค้า",
    text: "เลือกวัสดุและสเปกให้เหมาะกับการใช้งาน",
  },
  {
    title: "เทียบสเปก / สินค้าทดแทน",
    text: "ช่วยค้นหาสินค้าที่เทียบเท่าที่สุดในงบที่มี",
  },
  {
    title: "จัดหาสินค้ารวดเร็ว",
    text: "สต็อกแน่น พร้อมจัดส่งทั่วประเทศ",
  },
  {
    title: "บริการหลังการขาย",
    text: "ดูแลต่อเนื่อง มั่นใจตลอดการใช้งาน",
  },
];

const faqs = [
  {
    question: "มีสินค้าสต็อกพร้อมส่งหรือไม่?",
    answer:
      "สินค้าบางรายการมีพร้อมส่ง และบางรายการขึ้นอยู่กับขนาด วัสดุ รุ่น และจำนวนที่ต้องการ แนะนำให้ส่งรายละเอียดมาทาง LINE เพื่อให้ทีมงานเช็กสต็อกได้รวดเร็วที่สุด",
  },
  {
    question: "ขอใบเสนอราคาได้อย่างไร?",
    answer:
      "ส่งชื่อสินค้า ขนาด รุ่น จำนวน หรือรูปตัวอย่างมาทาง LINE หรืออีเมลได้เลย ทีมงานจะช่วยตรวจสอบและจัดทำใบเสนอราคาให้ตามข้อมูลที่ได้รับ",
  },
  {
    question: "ระยะเวลาในการจัดส่งสินค้า?",
    answer:
      "ขึ้นอยู่กับประเภทสินค้าและพื้นที่ปลายทาง หากเป็นสินค้าพร้อมส่ง ทีมงานจะรีบประสานจัดส่งให้โดยเร็ว และแจ้งกำหนดส่งก่อนยืนยันคำสั่งซื้อ",
  },
  {
    question: "สามารถเทียบ/เปลี่ยนสินค้าที่ใช้อยู่ได้หรือไม่?",
    answer:
      "ได้ครับ หากไม่ทราบรุ่นหรือสเปกชัดเจน สามารถส่งรูป ขนาด หรือข้อมูลบนชิ้นงานมาให้ทีมงานช่วยเทียบสินค้าและแนะนำรุ่นที่ใกล้เคียงได้",
  },
];

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.6 10.8c1.5 3 3.8 5.4 6.8 6.8l2.3-2.3c.3-.3.8-.4 1.2-.2 1.3.4 2.7.7 4.1.7.6 0 1 .4 1 1V21c0 .6-.4 1-1 1C10.5 22 2 13.5 2 3c0-.6.4-1 1-1h4.2c.6 0 1 .4 1 1 0 1.4.2 2.8.7 4.1.1.4 0 .9-.3 1.2l-2 2.5Z" fill="currentColor" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm9 7L3.5 7.2v9.3h17V7.2L12 12Zm0-2.3L20.3 5H3.7L12 9.7Z" fill="currentColor" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a8 8 0 0 0-8 8c0 5.8 8 12 8 12s8-6.2 8-12a8 8 0 0 0-8-8Zm0 11.2A3.2 3.2 0 1 1 12 6.8a3.2 3.2 0 0 1 0 6.4Z" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9.2 16.2-4.4-4.4L3.4 13.2 9.2 19 21 7.2 19.6 5.8 9.2 16.2Z" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 4 5v5c0 5.2 3.4 10 8 12 4.6-2 8-6.8 8-12V5l-8-3Zm0 16.5c-3.5-1.8-6-5.5-6-9.2V6.4l6-2.2 6 2.2v2.9c0 3.7-2.5 7.4-6 9.2Z" fill="currentColor" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 11a3 3 0 1 0-2.9-3A3 3 0 0 0 16 11ZM8 11a3 3 0 1 0-2.9-3A3 3 0 0 0 8 11Zm0 2c-2.7 0-8 1.3-8 4v2h10v-2c0-1.1.5-2.1 1.3-3-1-.6-2.4-1-3.3-1Zm8 0c-.9 0-2.3.4-3.3 1 .8.9 1.3 1.9 1.3 3v2h10v-2c0-2.7-5.3-4-8-4Z" fill="currentColor" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.5 2 2 5.7 2 10.3c0 4.1 3.6 7.6 8.5 8.2.3.1.8.2.9.5.1.3.1.7 0 1l-.2 1.3c-.1.4-.3 1.5 1.3.8 1.6-.7 8.7-5.1 11.9-8.8 2.2-2.4 3.6-4.7 3.6-7C28 5.7 17.5 2 12 2Z" fill="currentColor" transform="scale(.8) translate(1 2)" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" fill="currentColor" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 3 6.5v11L12 22l9-4.5v-11L12 2Zm0 2.2 6.4 3.2L12 10.6 5.6 7.4 12 4.2Zm-7 4.8 6 3v7.4l-6-3V9Zm14 0v7.4l-6 3V12l6-3Z" fill="currentColor" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 5h11v8h2.5L19 9h2a1 1 0 0 1 1 1v6h-1.2a2.8 2.8 0 0 1-5.6 0H8.8a2.8 2.8 0 0 1-5.6 0H2V6a1 1 0 0 1 1-1Zm3 13a1.3 1.3 0 1 0 0-2.6A1.3 1.3 0 0 0 6 18Zm12 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Zm-1-5h3v-2.4h-1.2L17 13Z" fill="currentColor" />
    </svg>
  );
}

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`${styles.faqItem} ${open ? styles.faqItemOpen : ""}`}>
      <button type="button" onClick={onToggle} aria-expanded={open}>
        <span>{question}</span>

        <span
          className={`${styles.faqArrow} ${open ? styles.faqArrowOpen : ""}`}
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293z"
            />
          </svg>
        </span>
      </button>

      {open ? <p>{answer}</p> : null}
    </div>
  );
}

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className={styles.contactPage}>
      <SiteHeader />

      <main className={styles.mainWrap}>
        <section className={styles.heroSection}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <h1>ติดต่อเรา</h1>
              <div className={styles.heroLine} />

              <h2>
                ปรึกษาและสอบถามข้อมูลสินค้า ซีล, โอริง,
                <br />
                ประเก็น, อะไหล่ปั๊ม, วาล์ว ทุกชนิด
              </h2>

              <p>
                ทีมงานผู้เชี่ยวชาญ พร้อมให้คำแนะนำสินค้า
                <br />
                และโซลูชันที่เหมาะสมกับงานของคุณ
              </p>

              <div className={styles.heroFeatures}>
                <div>
                  <span>
                    <CheckIcon />
                  </span>
                  <div>
                    <strong>ตอบกลับรวดเร็ว</strong>
                    <small>ภายใน 1 วันทำการ</small>
                  </div>
                </div>

                <div>
                  <span>
                    <ShieldIcon />
                  </span>
                  <div>
                    <strong>สินค้าคุณภาพ</strong>
                    <small>ได้มาตรฐาน</small>
                  </div>
                </div>

                <div>
                  <span>
                    <PeopleIcon />
                  </span>
                  <div>
                    <strong>ให้คำปรึกษาโดย</strong>
                    <small>ผู้เชี่ยวชาญ</small>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.heroVisual} aria-hidden="true">
              <img src="/logo/contact-hero-banner.png" alt="" />
            </div>
          </div>
        </section>

        <section className={styles.summarySection}>
          <div className={styles.summaryGrid}>
            <a
              className={styles.summaryCard}
              href={`tel:${contactInfo.phone.replace(/-/g, "")}`}
            >
              <span className={styles.summaryIcon}>
                <PhoneIcon />
              </span>
              <div>
                <small>โทรศัพท์</small>
                <strong>{contactInfo.phone}</strong>
                <p>{contactInfo.hours}</p>
              </div>
            </a>

            <a className={styles.summaryCard} href={`mailto:${contactInfo.email}`}>
              <span className={styles.summaryIcon}>
                <MailIcon />
              </span>
              <div>
                <small>อีเมล</small>
                <strong>{contactInfo.email}</strong>
                <p>ตอบกลับภายใน 1 วันทำการ</p>
              </div>
            </a>

            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon}>
                <PinIcon />
              </span>
              <div>
                <small>ที่อยู่</small>
                <strong>ที่อยู่</strong>
                <p>
                  {contactInfo.addressLine1}
                  <br />
                  {contactInfo.addressLine2}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.contentSection}>
          <div className={styles.contentGrid}>
            <article className={styles.lineCard}>
              <h2>แชทกับเราทาง LINE</h2>
              <p className={styles.lineIntro}>
                พูดคุยกับทีมงานของเราได้ง่าย ๆ ผ่าน LINE
                <br />
                ตอบไว ให้คำแนะนำ และช่วยแก้ปัญหาให้คุณ
              </p>

              <div className={styles.lineLayout}>
                <div className={styles.lineChatArea}>
                  <div className={styles.lineMessageRow}>
                    <span className={styles.chatAvatar}>
                      <UserIcon />
                    </span>
                    <div className={styles.chatBubbleLight}>
                      สวัสดีครับ สนใจสินค้า
                      <br />
                      รุ่นนี้ค่ะ
                    </div>
                  </div>

                  <div
                    className={`${styles.lineMessageRow} ${styles.lineMessageRowRight}`}
                  >
                    <div className={styles.chatBubbleBlue}>
                      ยินดีให้บริการครับ 🙂
                      <br />
                      มีอะไรให้เราช่วยได้เลยครับ
                    </div>
                  </div>

                  <div className={styles.lineTypingRow}>
                    <span className={styles.chatAvatarSmall}>
                      <UserIcon />
                    </span>

                    <div
                      className={styles.typingBubble}
                      aria-label="กำลังพิมพ์"
                    >
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                    </div>
                  </div>
                </div>

                <div className={styles.lineRightColumn}>
                  <a
                    href={LINE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.lineBigButton}
                  >
                    <span className={styles.lineBigIcon}>
                      <img
                        src="/logo/line-icon.png"
                        alt="LINE"
                      />
                    </span>
                    <span>แชทกับเราเลย</span>
                    <b>›</b>
                  </a>

                  <div className={styles.lineIdCard}>
                    <div>
                      <small>LINE ID</small>
                      <strong>{LINE_ID}</strong>
                    </div>
                    <a
                      href={LINE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.fakeQr}
                      aria-label="เพิ่มเพื่อน SRR AND SUPPLY ผ่าน LINE"
                      title="เพิ่มเพื่อนผ่าน LINE"
                    >
                      <img
                        src="/logo/line-qr.png"
                        alt="QR Code LINE SRR AND SUPPLY"
                      />
                    </a>
                  </div>

                  <div className={styles.replyCard}>
                    <span
                      className={styles.replyIcon}
                      aria-hidden="true"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
                        <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
                        <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
                      </svg>
                    </span>

                    <div>
                      <strong>เวลาตอบกลับ</strong>
                      <small>ภายใน 1 วันทำการ</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.quickActions}>
                {quickActions.map((item) => (
                  <a
                    key={item.label}
                    href={LINE_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </a>
                ))}
              </div>
            </article>

            <article className={styles.teamCard}>
              <h2>ทีมงานพร้อมให้คำปรึกษา</h2>
              <p className={styles.teamIntro}>
                เรามีทีมงานผู้เชี่ยวชาญด้าน ซีล โอริง ประเก็น อะไหล่ปั๊ม และวาล์ว
                พร้อมช่วยแนะนำสินค้าที่เหมาะสมกับความต้องการของคุณ
              </p>

              <div className={styles.teamBody}>
                <div className={styles.serviceList}>
                  {services.map((service, index) => {
                    const icon =
                      index === 0 ? (
                        <PeopleIcon />
                      ) : index === 1 ? (
                        <ShieldIcon />
                      ) : index === 2 ? (
                        <TruckIcon />
                      ) : (
                        <PackageIcon />
                      );

                    return (
                      <div key={service.title}>
                        <span>{icon}</span>
                        <div>
                          <strong>{service.title}</strong>
                          <p>{service.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.teamPhotoWrap}>
                  <img
                    src="/logo/contact-support-team.png"
                    alt="ทีมงาน SRR AND SUPPLY"
                    className={styles.teamPhoto}
                  />
                </div>
              </div>

              <a
                href={LINE_URL}
                target="_blank"
                rel="noreferrer"
                className={styles.teamLineButton}
              >
                <span className={styles.teamLineIcon}>
                  <img
                    src="/logo/line-icon.png"
                    alt="LINE"
                  />
                </span>
                <div>
                  <small>ติดต่อเราผ่าน LINE</small>
                  <strong>{LINE_ID}</strong>
                </div>
                <b>›</b>
              </a>
            </article>
          </div>
        </section>

        <section className={styles.faqSection}>
          <h2>คำถามที่พบบ่อย</h2>

          <div className={styles.faqGrid}>
            {faqs.map((faq, index) => (
              <FaqItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
                open={openFaq === index}
                onToggle={() => setOpenFaq(openFaq === index ? null : index)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
