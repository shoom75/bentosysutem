export interface BentoInfo {
  bento_id: number;
  bento_name: string;
  price: number;
  explanation: string;
  img_link: string | null;
  allergy_info: string | null;
}

export interface User {
  id: number;
  num: number;
  building_id: number;
  is_root: boolean;
}
