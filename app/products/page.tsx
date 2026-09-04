import { Suspense } from "react";
import ProductsClient from "./ProductsClient";


function ProductsLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f4f7fb",
        color: "#526b82",
        fontFamily: "Arial, Noto Sans Thai, Tahoma, sans-serif",
      }}
    >
      กำลังโหลดสินค้า...
    </div>
  );
}


export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsClient />
    </Suspense>
  );
}