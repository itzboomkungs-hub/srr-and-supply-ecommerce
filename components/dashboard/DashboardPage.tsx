"use client";

import styles from "./DashboardPage.module.css";

export default function DashboardPage() {
  return (
    <div className={styles.dashboardPage}>
      {/* =========================
          PAGE HEADER
      ========================= */}

      <section className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>ภาพรวม</div>

          <h1>Dashboard</h1>

          <p>
            ภาพรวมการขายและการดำเนินงานของ SRR AND SUPPLY
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.dateButton}>
            ▣&nbsp; 31 ส.ค. 2026 - 31 ส.ค. 2026
          </button>

          <button className={styles.exportButton}>
            ↓&nbsp; ส่งออกข้อมูล
          </button>
        </div>
      </section>

      {/* =========================
          SUMMARY
      ========================= */}

      <section className={styles.summaryGrid}>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            ฿
          </div>

          <div className={styles.summaryContent}>
            <span>ยอดขายวันนี้</span>
            <strong>฿125,430</strong>
            <small className={styles.positive}>
              ↑ +12.5%
            </small>
          </div>
        </div>


        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            ▧
          </div>

          <div className={styles.summaryContent}>
            <span>PO วันนี้</span>
            <strong>32</strong>
            <small className={styles.positive}>
              ↑ +6
            </small>
          </div>
        </div>


        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            □
          </div>

          <div className={styles.summaryContent}>
            <span>สินค้าคงคลัง</span>
            <strong>1,245</strong>
            <small className={styles.negative}>
              ↓ -8
            </small>
          </div>
        </div>


        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            ▤
          </div>

          <div className={styles.summaryContent}>
            <span>PO รอตรวจสอบ</span>
            <strong>7</strong>
            <small className={styles.warning}>
              ! ต้องดำเนินการ
            </small>
          </div>
        </div>


        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            ▰
          </div>

          <div className={styles.summaryContent}>
            <span>รอจัดส่ง</span>
            <strong>18</strong>
            <small className={styles.positive}>
              ↑ +3
            </small>
          </div>
        </div>

      </section>


      {/* =========================
          MAIN CONTENT
      ========================= */}

      <section className={styles.mainGrid}>

        {/* SALES */}

        <div className={styles.panel}>

          <div className={styles.panelHeader}>

            <div>
              <h2>ยอดขาย</h2>
              <span>7 วันที่ผ่านมา</span>
            </div>

            <select
              className={styles.chartSelect}
              defaultValue="7"
            >
              <option value="7">7 วัน</option>
              <option value="30">30 วัน</option>
            </select>

          </div>


          <div className={styles.chartArea}>

            <div className={styles.chartGrid}>

              <span>150K</span>
              <span>120K</span>
              <span>90K</span>
              <span>60K</span>
              <span>30K</span>
              <span>0</span>

            </div>


            <div className={styles.chartBars}>

              <div className={styles.barColumn}>
                <div
                  className={styles.bar}
                  style={{ height: "30%" }}
                />
                <span>25</span>
              </div>

              <div className={styles.barColumn}>
                <div
                  className={styles.bar}
                  style={{ height: "55%" }}
                />
                <span>26</span>
              </div>

              <div className={styles.barColumn}>
                <div
                  className={styles.bar}
                  style={{ height: "42%" }}
                />
                <span>27</span>
              </div>

              <div className={styles.barColumn}>
                <div
                  className={styles.bar}
                  style={{ height: "68%" }}
                />
                <span>28</span>
              </div>

              <div className={styles.barColumn}>
                <div
                  className={styles.bar}
                  style={{ height: "88%" }}
                />
                <span>29</span>
              </div>

              <div className={styles.barColumn}>
                <div
                  className={styles.bar}
                  style={{ height: "72%" }}
                />
                <span>30</span>
              </div>

              <div className={styles.barColumn}>
                <div
                  className={styles.bar}
                  style={{ height: "82%" }}
                />
                <span>31</span>
              </div>

            </div>

          </div>

        </div>


        {/* ALERTS */}

        <div className={styles.panel}>

          <div className={styles.panelHeader}>

            <div>
              <h2>การแจ้งเตือน</h2>
            </div>

            <button className={styles.viewAll}>
              ดูทั้งหมด
            </button>

          </div>


          <div className={styles.alertList}>

            <div className={`${styles.alert} ${styles.alertDanger}`}>
              <div className={styles.alertIcon}>!</div>

              <div>
                <strong>สินค้าหมดสต็อก</strong>
                <span>
                  3 รายการ ต้องตรวจสอบและสั่งซื้อ
                </span>
              </div>
            </div>


            <div className={`${styles.alert} ${styles.alertWarning}`}>
              <div className={styles.alertIcon}>△</div>

              <div>
                <strong>สินค้าใกล้หมด</strong>
                <span>
                  8 รายการ ต่ำกว่าจุดสั่งซื้อ
                </span>
              </div>
            </div>


            <div className={`${styles.alert} ${styles.alertInfo}`}>
              <div className={styles.alertIcon}>i</div>

              <div>
                <strong>PO รอตรวจสอบ</strong>
                <span>
                  7 รายการ รอฝ่ายจัดซื้อดำเนินการ
                </span>
              </div>
            </div>


            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              <div className={styles.alertIcon}>✓</div>

              <div>
                <strong>รอจัดส่ง</strong>
                <span>
                  18 ออเดอร์พร้อมดำเนินการ
                </span>
              </div>
            </div>

          </div>

        </div>

      </section>


      {/* =========================
          LOWER CONTENT
      ========================= */}

      <section className={styles.lowerGrid}>

        {/* BEST SELLERS */}

        <div className={styles.panel}>

          <div className={styles.panelHeader}>
            <div>
              <h2>สินค้าขายดี</h2>
              <span>5 อันดับ</span>
            </div>

            <button className={styles.viewAll}>
              ดูทั้งหมด
            </button>
          </div>


          <div className={styles.productList}>

            {[
              ["O-Ring NBR M70", "OR-NBR-M70", "820"],
              ["O-Ring NBR M60", "OR-NBR-M60", "650"],
              ["O-Ring EPDM M50", "OR-EPDM-M50", "540"],
              ["O-Ring Viton M40", "OR-VITON-M40", "410"],
              ["O-Ring Silicone M30", "OR-SIL-M30", "380"],
            ].map((product, index) => (

              <div
                className={styles.productRow}
                key={product[1]}
              >

                <div className={styles.rank}>
                  {index + 1}
                </div>

                <div className={styles.productIcon}>
                  O
                </div>

                <div className={styles.productInfo}>
                  <strong>{product[0]}</strong>
                  <span>{product[1]}</span>
                </div>

                <div className={styles.productQuantity}>
                  <strong>{product[2]}</strong>
                  <span>ชิ้น</span>
                </div>

              </div>

            ))}

          </div>

        </div>


        {/* INVENTORY */}

        <div className={styles.panel}>

          <div className={styles.panelHeader}>

            <div>
              <h2>สินค้าคงคลัง</h2>
            </div>

            <button className={styles.viewAll}>
              ดูทั้งหมด
            </button>

          </div>


          <div className={styles.inventoryList}>

            <div className={styles.inventoryBox}>
              <span>มูลค่าสินค้า</span>
              <strong>฿1,250,000</strong>
              <small>1,245 รายการ</small>
            </div>

            <div className={`${styles.inventoryBox} ${styles.inventoryWarning}`}>
              <span>สินค้าใกล้หมด</span>
              <strong>8</strong>
              <small>รายการ</small>
            </div>

            <div className={`${styles.inventoryBox} ${styles.inventoryDanger}`}>
              <span>สินค้าหมด</span>
              <strong>3</strong>
              <small>รายการ</small>
            </div>

          </div>

        </div>


        {/* CUSTOMERS */}

        <div className={styles.panel}>

          <div className={styles.panelHeader}>

            <div>
              <h2>ลูกค้า</h2>
            </div>

            <button className={styles.viewAll}>
              ดูทั้งหมด
            </button>

          </div>


          <div className={styles.customerList}>

            <div className={styles.customerStat}>
              <span>ลูกค้าทั้งหมด</span>
              <strong>48</strong>
              <small>ราย</small>
            </div>

            <div className={styles.customerStat}>
              <span>ลูกค้าใหม่เดือนนี้</span>
              <strong>5</strong>
              <small>ราย</small>
            </div>

            <div className={styles.customerStat}>
              <span>PO เดือนนี้</span>
              <strong>32</strong>
              <small>รายการ</small>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}