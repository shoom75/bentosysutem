"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReservationForm from '@/components/ReservationForm';
import { getHistoryAction, reserveAction } from '@/actions';
import { ALL_BENTO_ITEMS, BENTO_SCHEDULE } from '@/constants/bento';

export default function BentoPage() {
  const [selectedBento, setSelectedBento] = useState(1);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [reservedDates, setReservedDates] = useState<string[]>([]); // 予約済みリスト
  
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const [date, setDate] = useState<Date>(tomorrow);
  const [currentItems, setCurrentItems] = useState<any[]>([]);
  const router = useRouter();

  // 日付を "2026-03-14" 形式にする関数
  const formatDateKey = (d: Date) => {
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replaceAll('/', '-');
  };

  // 予約済みリストを取得
  const fetchReservedDates = useCallback(async () => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;
    const data = await getHistoryAction(userId);
    if (data.success && data.history) {
      const formatted = data.history.map((h: any) => {
        const d = new Date(h.date);
        return isNaN(d.getTime()) ? null : formatDateKey(d);
      }).filter((d): d is string => d !== null);
      setReservedDates(formatted);
    }
  }, []);

  // 認証 & 初回取得
  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      router.replace('/login');
    } else {
      setIsAuthorized(true);
      fetchReservedDates();
    }
  }, [router, fetchReservedDates]);

  // 日付に基づいたお弁当リストの更新
  useEffect(() => {
    if (date instanceof Date) {
      const day = date.getDay();
      const itemIds = BENTO_SCHEDULE[day] || BENTO_SCHEDULE[1];
      const sortedItems = itemIds.map(id => ALL_BENTO_ITEMS.find(item => item.id === id)).filter(Boolean) as any[];
      setCurrentItems(sortedItems);
      if (sortedItems.length > 0) setSelectedBento(sortedItems[0].id);
    }
  }, [date]);

  // ★ 今の日付が予約済みか判定
  const isReserved = reservedDates.includes(formatDateKey(date));

  const handleReserve = async () => {
    const userId = sessionStorage.getItem('userId') || "";
    const selectedItem = ALL_BENTO_ITEMS.find(item => item.id === selectedBento);
    if (!selectedItem || !userId) return;

    setIsSubmitting(true);
    const selectedDateStr = formatDateKey(date);

    try {
      const result = await reserveAction(userId, selectedItem.name, selectedDateStr);
      if (result.success) {
        setIsCompleted(true);
       await fetchReservedDates(); 
            window.dispatchEvent(new Event('reservation-updated'));
            setIsCompleted(true);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("送信エラー:", error);
      alert("送信に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const closeOverlay = () => {
    setShowOverlay(false);
    // 完了後の再読み込みは fetchReservedDates で対応しているため reload は不要だが
    // 画面全体をリセットしたい場合は window.location.reload() でもOK
    setIsCompleted(false);
    setIsSubmitting(false);
  };

  if (!isAuthorized) return <div className="min-h-screen bg-gray-50" />;

  return (
    <main className="min-h-screen bg-[#f8f9fa] pb-20">
      <ReservationForm
        date={date}
        setDate={setDate}
        reservedDates={reservedDates} // ★これを追加！
        onDateClick={() => {
            setIsCompleted(false);
            setShowOverlay(true);
        }}
      />

      {showOverlay && (
        <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeOverlay}></div>
          <div className="relative bg-white w-full max-w-[850px] h-[90vh] md:h-auto rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
            
            {!isCompleted ? (
              <>
                {/* 予約済みならヘッダーを青、未予約なら赤に */}
                <div className={`${isReserved ? 'bg-[#d63031]' : 'bg-[#d63031]'} p-5 md:p-8 text-white shrink-0 transition-colors`}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xl md:text-2xl font-black">
                      {isReserved ? '予約内容の確認' : 'お弁当を選択'}
                    </h3>
                    <button onClick={closeOverlay} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all active:scale-90">✕</button>
                  </div>
                  <p className="text-sm md:text-base opacity-90">
                    {date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })} の{isReserved ? '予約を変更または解除' : '新規予約'}
                  </p>
                </div>

                <div className="p-5 md:p-8 overflow-y-auto flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                    {currentItems.map((item: any) => (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedBento(item.id)}
                        className={`flex md:flex-col border-2 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                          selectedBento === item.id 
                          ? `border-${isReserved ? '[#0984e3]' : '[#d63031]'} bg-${isReserved ? 'blue' : 'red'}-50 ring-4 ring-${isReserved ? '[#0984e3]' : '[#d63031]'}/10 shadow-lg md:translate-y-[-4px]` 
                          : 'border-gray-100 bg-white'
                        }`}
                      >
                        <div className="w-24 h-24 md:w-full md:h-40 bg-gray-100 relative shrink-0 overflow-hidden">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3 md:p-4 flex-grow flex flex-col min-w-0">
                          <span className={`font-bold text-base md:text-lg leading-tight truncate ${selectedBento === item.id ? (isReserved ? 'text-[#0984e3]' : 'text-[#d63031]') : 'text-gray-800'}`}>
                            {item.name}
                          </span>
                          <span className="text-base md:text-xl font-black mt-2">¥{item.price.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm pt-4 pb-2 md:relative md:bg-transparent md:p-0">
                    <button
                      onClick={handleReserve}
                      disabled={isSubmitting}
                      className={`w-full p-4 md:p-5 rounded-2xl text-white font-black text-base md:text-lg shadow-xl transition-all active:scale-[0.98] ${
                        isSubmitting ? 'bg-gray-400' : isReserved ? 'bg-[#0984e3] hover:bg-[#0873c4]' : 'bg-[#d63031] hover:bg-[#b82728]'
                      }`}
                    >
                      {isSubmitting ? '送信中...' : isReserved ? '予約をキャンセル / 変更する' : 'この内容で予約を確定する'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 md:p-20 text-center">
                <div className={`w-20 h-20 bg-[#2ecc71] rounded-full flex items-center justify-center mb-6 text-white text-[2.5rem] shadow-lg`}>✓</div>
                <h3 className="text-2xl font-black text-gray-800 mb-2">更新完了！</h3>
                <p className="text-gray-500 mb-8">予約情報を最新に更新しました。</p>
                <button onClick={closeOverlay} className="w-full max-w-[280px] p-4 bg-gray-900 text-white rounded-2xl font-black">OK</button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}