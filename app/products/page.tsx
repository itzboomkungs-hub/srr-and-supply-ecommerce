import Link from "next/link";

export default function ProductsPage() {
  return (
    <main
      style={{
        maxWidth: "1440px",
        margin: "0 auto",
        padding: "40px 32px",
      }}
    >
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            fontSize: "13px",
            color: "#71829a",
            marginBottom: "8px",
          }}
        >
          หน้าหลัก / สินค้า
        </div>

        <h1
          style={{
            margin: 0,
            color: "#173e6d",
            fontSize: "32px",
          }}
        >
          สินค้าทั้งหมด
        </h1>

        <p
          style={{
            color: "#71829a",
            marginTop: "8px",
          }}
        >
          ซีล โอริง ประเก็น อะไหล่ปั๊ม วาล์ว และอะไหล่อุตสาหกรรม
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "18px",
        }}
      >
        {[
          "O-Ring",
          "Oil Seal",
          "Hydraulic Seal",
          "Pneumatic Seal",
          "Rotary Seal",
          "ประเก็น",
          "อะไหล่ปั๊ม",
          "วาล์ว",
        ].map((category) => (
          <Link
            key={category}
            href="/products"
            style={{
              minHeight: "180px",
              border: "1px solid #e1e7ef",
              borderRadius: "10px",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#173e6d",
              fontSize: "17px",
              fontWeight: 700,
            }}
          >
            {category}
          </Link>
        ))}
      </div>
    </main>
  );
}