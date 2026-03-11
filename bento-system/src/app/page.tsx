"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BentoMenu from '@/components/BentoMenu';
import ReservationForm from '@/components/ReservationForm';
import { BentoItem } from '@/types';

const bentoItems: BentoItem[] = [
  { id: 1, label: "A", name: "弁当A", desc: "定番の幕の内弁当です。", price: 800 },
  { id: 2, label: "B", name: "弁当B", desc: "ボリューム満点の唐揚げ弁当です。", price: 900 },
  { id: 3, label: "C", name: "弁当C", desc: "ヘルシーな焼き魚弁当です。", price: 850 }
];

export default function BentoPage() {
  const [selectedBento, setSelectedBento] = useState(1);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userName = sessionStorage.getItem('userName');
    if (!userName) {
      router.replace('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const selectedBentoItem = bentoItems.find(item => item.id === selectedBento);

  if (!isAuthorized) return <div className="min-h-screen bg-gray-50" />;

  return (
    <main className="min-h-screen bg-[#f8f9fa] pb-20">
      <BentoMenu
        items={bentoItems}
        selectedId={selectedBento}
        onSelect={setSelectedBento}
      />

      <ReservationForm
        selectedBentoItem={selectedBentoItem}
      />
    </main>
  );
}