export type CartProduct = {
  id: number;
  name: string;
  code: string;
  category: string;
  material: string;
  price: number;
  stock: number;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
};