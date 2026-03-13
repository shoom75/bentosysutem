import { BentoItem } from '@/types';

export const ALL_BENTO_ITEMS: (BentoItem & { image: string })[] = [
  { id: 1, label: "A", name: "弁当A", desc: "定番の幕の内弁当です。栄養バランスを考えた人気メニューです。", price: 800, image: "/hambagu.png" },
  { id: 2, label: "B", name: "弁当B", desc: "ボリューム満点の唐揚げ弁当です。特製スパイスでジューシーに仕上げました。", price: 900, image: "/salmon.png" },
  { id: 3, label: "C", name: "弁当C", desc: "ヘルシーな焼き魚弁当です。旬の素材を活かした優しい味わいです。", price: 850, image: "/sushi.png" },
  { id: 4, label: "D", name: "弁当D", desc: "ジューシーなハンバーグ弁当です。自家製デミグラスソースがたっぷり。", price: 950, image: "/hambagu.png" },
  { id: 5, label: "E", name: "弁当E", desc: "サクサクのとんかつ弁当です。厳選した豚肉を使用しています。", price: 900, image: "/salmon.png" },
  { id: 6, label: "F", name: "弁当F", desc: "彩り豊かな野菜炒め弁当です。シャキシャキの食感が楽しめます。", price: 800, image: "/sushi.png" },
  { id: 7, label: "G", name: "弁当G", desc: "スタミナ抜群の焼肉弁当です。甘辛いタレがご飯によく合います。", price: 1000, image: "/hambagu.png" },
];

export const BENTO_SCHEDULE: { [key: number]: number[] } = {
  1: [1, 2, 3], // 月曜: A, B, C
  2: [4, 5, 6], // 火曜: D, E, F
  3: [2, 5, 7], // 水曜: B, E, G
  4: [1, 4, 7], // 木曜: A, D, G
  5: [3, 6, 2], // 金曜: C, F, B
  0: [1, 2, 3], // 日曜（デフォルト）
  6: [1, 2, 3], // 土曜（デフォルト）
};
