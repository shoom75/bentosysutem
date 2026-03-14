"use client";

import React, { useState, useEffect } from 'react';
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
  
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const [date, setDate] = useState<any>(tomorrow);
  const [currentItems, setCurrentItems] = useState<any[]>([]);
  const router = useRouter();

  // 認証チェック
  useEffect(() => {
    const userId = sessionStorage.getItem('userId'); // 大文字小文字をログイン側と統一
    if (!userId) {
      router.replace('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  // 日付に基づいたお弁当リストの更新
  useEffect(() => {
    if (date instanceof Date) {
      const day = date.getDay();
      const itemIds = BENTO_SCHEDULE[day] || BENTO_SCHEDULE[1];
      const sortedItems = itemIds.map(id => ALL_BENTO_ITEMS.find(item => item.id === id)).filter(Boolean) as any[];
      setCurrentItems(sortedItems);
      
      if (sortedItems.length > 0) {
        setSelectedBento(sortedItems[0].id);
      }
    }
  }, [date]);

 const handleReserve = async () => {
    const userId = sessionStorage.getItem('userId') || "";
    const selectedItem = ALL_BENTO_ITEMS.find(item => item.id === selectedBento);
    
    if (!selectedItem || !userId) return;

    setIsSubmitting(true);
    
    let selectedDateStr = "";
    if (date instanceof Date) {
        selectedDateStr = date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    try {
        // 【重要】オブジェクト {} で囲まず、3つの値を直接順番に渡します
        const result = await reserveAction(
            userId,             // student_id に対応
            selectedItem.name,  // bento_type に対応
            selectedDateStr     // order_date に対応
        );

        if (result.success) {
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
    if (isCompleted) {
        window.location.reload(); 
    }
    setIsCompleted(false);
    setIsSubmitting(false);
  };

  if (!isAuthorized) return <div className="min-h-screen bg-gray-50" />;

  return (
    <main className="min-h-screen bg-[#f8f9fa] pb-20">
      <ReservationForm
        date={date}
        setDate={setDate}
        onDateClick={() => {
            setIsCompleted(false);
            setShowOverlay(true);
        }}
      />

      {showOverlay && (
        <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeOverlay}
          ></div>
          
          <div className="relative bg-white w-full max-w-[850px] h-[90vh] md:h-auto rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 flex flex-col">
            
            {!isCompleted ? (
              <>
                <div className="bg-[#d63031] p-5 md:p-8 text-white shrink-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xl md:text-2xl font-black">お弁当を選択</h3>
                    <button 
                      onClick={closeOverlay}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all active:scale-90"
                    >✕</button>
                  </div>
                  <p className="text-sm md:text-base opacity-90 flex items-center gap-2">
                    <span className="bg-white/20 px-3 py-0.5 rounded-full text-sm font-bold">
                      {date instanceof Date ? date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }) : ""} 
                    </span>
                    <span>の予約</span>
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
                          ? 'border-[#d63031] bg-red-50 ring-4 ring-[#d63031]/10 shadow-lg md:translate-y-[-4px]' 
                          : 'border-gray-100 bg-white'
                        }`}
                      >
                        <div className="w-24 h-24 md:w-full md:h-40 bg-gray-100 relative shrink-0 overflow-hidden">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className={`w-full h-full object-cover transition-transform duration-500 ${selectedBento === item.id ? 'scale-110' : 'group-hover:scale-105'}`}
                          />
                          <div className={`absolute top-2 left-2 w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center font-black text-xs md:text-sm shadow-md z-10 ${
                            selectedBento === item.id ? 'bg-[#d63031] text-white' : 'bg-white/90 text-gray-700'
                          }`}>
                            {item.label}
                          </div>
                        </div>

                        <div className="p-3 md:p-4 flex-grow flex flex-col min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className={`font-bold text-base md:text-lg leading-tight truncate ${selectedBento === item.id ? 'text-[#d63031]' : 'text-gray-800'}`}>
                              {item.name}
                            </span>
                          </div>
                          <p className="text-[10px] md:text-xs text-gray-500 mb-2 md:mb-4 line-clamp-2 leading-relaxed">
                            {item.desc}
                          </p>
                          <div className="mt-auto flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                            <span className="text-[10px] font-bold text-gray-400">価格</span>
                            <span className={`text-base md:text-xl font-black ${selectedBento === item.id ? 'text-[#d63031]' : 'text-gray-800'}`}>
                              ¥{item.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm pt-4 pb-2 md:relative md:bg-transparent md:p-0">
                    <button
                      onClick={handleReserve}
                      disabled={isSubmitting}
                      className={`w-full p-4 md:p-5 rounded-2xl text-white font-black text-base md:text-lg shadow-xl shadow-red-200 transition-all active:scale-[0.98] ${
                        isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#d63031] hover:bg-[#b82728]'
                      }`}
                    >
                      {isSubmitting ? '予約送信中...' : 'この内容で予約を確定する'}
                    </button>
                    <button onClick={closeOverlay} className="w-full mt-2 md:mt-4 p-2 text-xs text-gray-400 font-bold hover:text-gray-600 transition-colors md:hidden">
                      閉じる
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 md:p-20 text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-[#2ecc71] rounded-full flex items-center justify-center mb-6 text-white text-[2.5rem] md:text-[3rem] shadow-lg shadow-green-100 animate-bounce-short">
                  ✓
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-800 mb-2">予約完了！</h3>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  お弁当のご予約を承りました。<br />
                  受取時に予約履歴画面を提示してください。
                </p>
                <button
                  onClick={closeOverlay}
                  className="w-full max-w-[280px] p-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-95"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}