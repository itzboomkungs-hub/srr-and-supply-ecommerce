export type ProductQuickViewData = {
  id: number;
  name: string;
  code: string;
  category: string;
  material: string;
  price: number;
  stock: number;

  /* ภายหลังดึงจากฐานข้อมูลได้ */
  image?: string;
};

