"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReservationForm from '@/components/ReservationForm';
import { getHistoryAction, reserveAction, getFullBentoScheduleAction, type HistoryRecord, getJSTTodayStr } from '@/actions';
import { BentoInfo } from '@/types';
import { useToast } from '@/components/ToastProvider';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function BentoPage() {
  const [selectedBentoId, setSelectedBentoId] = useState<number | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  const [reservations, setReservations] = useState<Record<string, string>>({});
  const [bentoScheduleMap, setBentoScheduleMap] = useState<Record<string, BentoInfo[]>>({});
  const [currentItems, setCurrentItems] = useState<BentoInfo[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const [date, setDate] = useState<Date>(tomorrow);

  const router = useRouter();
  const { showToast } = useToast();

  const formatDateKey = (d: Date): string => {
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replaceAll('/', '-');
  };

  const fetchAllData = useCallback(async (isInitial = false) => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      router.replace('/login');
      return;
    }
    
    setIsSyncing(true);
    setLoadError(false);

    try {
      const [historyRes, scheduleRes] = await Promise.all([
        getHistoryAction(userId),
        getFullBentoScheduleAction()
      ]);

      if (historyRes.success && historyRes.history) {
        const resMap: Record<string, string> = {};
        (historyRes.history as any[]).forEach((h) => {
          const d = new Date(h.date);
          if (!isNaN(d.getTime())) resMap[formatDateKey(d)] = h.bento;
        });
        setReservations(resMap);
      } else if (!historyRes.success) {
        setLoadError(true);
      }

      if (scheduleRes.success) {
        setBentoScheduleMap(scheduleRes.scheduleMap);
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error("Data load error:", err);
      setLoadError(true);
      showToast('データの取得に失敗しました。再試行してください。', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    setIsAuthorized(true);
    fetchAllData(true);
  }, [fetchAllData]);

  useEffect(() => {
    const dateKey = formatDateKey(date);
    const bentos = bentoScheduleMap[dateKey] || [];
    setCurrentItems(bentos);
    
    const reservedBentoName = reservations[dateKey];
    if (reservedBentoName) {
      const found = bentos.find(b => b.bento_name === reservedBentoName);
      if (found) {
        setSelectedBentoId(found.bento_id);
      } else if (bentos.length > 0) {
        setSelectedBentoId(bentos[0].bento_id);
      }
    } else if (bentos.length > 0) {
      setSelectedBentoId(bentos[0].bento_id);
    } else {
      setSelectedBentoId(null);
    }
  }, [date, bentoScheduleMap, reservations]);

  const dateKey = formatDateKey(date);
  const reservedBentoName = reservations[dateKey];
  const isReserved = !!reservedBentoName;
  
  const selectedBento = currentItems.find(item => item.bento_id === selectedBentoId);
  const isChanging = isReserved && selectedBento && selectedBento.bento_name !== reservedBentoName;

  const handleReserveAction = async (targetBentoId: number, targetBentoName: string) => {
    const userId = sessionStorage.getItem('userId') || "";
    if (!targetBentoId || !targetBentoName || !userId) return;

    // 重大対策2: 予約直前にサーバー時間と比較して「今日」を再定義
    const currentJSTToday = await getJSTTodayStr();
    if (dateKey <= currentJSTToday) {
       showToast("当日・過去の予約は変更できません", "error");
       return;
    }

    setIsSubmitting(true);
    try {
      const result = await reserveAction(userId, targetBentoId, targetBentoName, dateKey);
      if (result.success) {
        await fetchAllData();
        window.dispatchEvent(new Event('reservation-updated'));
        setIsCompleted(true);
        showToast(result.message || '予約を更新しました', 'success');
      } else {
        showToast(result.message || '失敗しました', 'error');
      }
    } catch (error) {
      console.error("送信エラー:", error);
      showToast('送信に失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeOverlay = () => {
    setShowOverlay(false);
    setIsCompleted(false);
    setIsSubmitting(false);
  };

  if (!isAuthorized) return <div className="min-h-screen bg-gray-50" />;

  return (
    <main className="min-h-screen bg-[#f8f9fa] pb-20 relative">
      {/* 重大対策3: 同期失敗時のリトライボタン */}
      {loadError && !isSyncing && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[3000] w-[90%] max-w-sm">
          <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-xs font-black">データが正しく読み込めませんでした</span>
            </div>
            <button 
              onClick={() => fetchAllData()}
              className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-black shadow-sm active:scale-95 flex items-center gap-1 shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              再試行
            </button>
          </div>
        </div>
      )}

      {isSyncing && (
        <div className="fixed top-6 right-6 z-[3000] bg-white/90 backdrop-blur px-5 py-3 rounded-2xl shadow-2xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-5 h-5 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-black text-gray-800">最新情報を同期中...</span>
        </div>
      )}

      <ReservationForm
        date={date}
        setDate={setDate}
        reservedDates={Object.keys(reservations)}
        scheduleDates={Object.keys(bentoScheduleMap)}
        onDateClick={() => {
          setIsCompleted(false);
          setShowOverlay(true);
        }}
      />

      {showOverlay && (
        <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeOverlay}></div>
          <div className="relative bg-white w-full max-w-[850px] h-[90vh] md:max-h-[90vh] md:h-fit rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col mx-4">
            {!isCompleted ? (
              <>
                <div className="bg-[#d63031] p-5 md:p-8 text-white shrink-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xl md:text-2xl font-black">
                      {isReserved ? '予約内容の確認・変更' : 'お弁当を選択'}
                    </h3>
                    <button type="button" onClick={closeOverlay} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all active:scale-90">✕</button>
                  </div>
                  <p className="text-sm md:text-base opacity-90">
                    {date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })} の{isReserved ? '予約内容' : '新規予約'}
                  </p>
                </div>

                <div className="p-5 md:p-8 overflow-y-auto flex-grow text-black">
                  {currentItems.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-2xl">
                      <div className="text-4xl mb-3">🍱</div>
                      <p className="font-bold">この日の弁当情報がありません</p>
                      <p className="text-sm text-gray-400 mt-1">別の日を選択してください</p>
                      <button onClick={() => fetchAllData()} className="mt-4 text-xs font-bold text-red-600 border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 transition-colors">情報を再取得</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                      {currentItems.map((item) => (
                        <div
                          key={item.bento_id}
                          onClick={() => setSelectedBentoId(item.bento_id)}
                          className={`flex md:flex-col border-2 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${selectedBentoId === item.bento_id
                            ? 'border-[#d63031] bg-red-50 ring-4 ring-[#d63031]/10 shadow-lg md:translate-y-[-4px]'
                            : 'border-gray-100 bg-white'
                            }`}
                        >
                          <div className="w-24 h-24 md:w-full md:h-40 bg-gray-100 relative shrink-0 overflow-hidden flex items-center justify-center">
                            {item.img_link ? (
                              <img src={item.img_link} alt={item.bento_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-5xl">🍱</span>
                            )}
                          </div>
                          <div className="p-3 md:p-4 flex-grow flex flex-col min-w-0">
                                <span className={`font-bold text-base md:text-lg leading-tight truncate ${selectedBentoId === item.bento_id ? 'text-[#d63031]' : 'text-gray-800'}`}>
                                  {item.bento_name}
                                </span>
                                {reservedBentoName === item.bento_name && (
                                    <span className="inline-block mt-1 text-[0.6rem] font-bold bg-[#0984e3] text-white px-2 py-0.5 rounded-full w-fit">予約中</span>
                                )}
                                <p className="mt-1 text-[10px] md:text-xs text-gray-500 line-clamp-2 min-h-[2.5em]">
                                  {item.explanation || 'お弁当の詳細はスタッフまで。'}
                                </p>
                                <span className="text-base md:text-xl font-black mt-2">¥{item.price.toLocaleString()}</span>
                            </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedBento && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black px-2 py-0.5 bg-[#d63031] text-white rounded-md uppercase">Selected</span>
                        <h4 className="font-black text-gray-800">{selectedBento.bento_name}</h4>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {selectedBento.explanation || 'おいしいお弁当をお届けします。'}
                      </p>
                      {selectedBento.allergy_info && (
                        <p className="mt-2 text-[10px] text-orange-600 font-bold flex items-center gap-1">
                          ⚠️ アレルギー：{selectedBento.allergy_info}
                        </p>
                      )}
                    </div>
                  )}

                  {currentItems.length > 0 && (
                    <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm pt-4 pb-2 md:relative md:bg-transparent md:p-0 flex flex-row gap-4">
                      {/* メメインアクション：確定または変更 */}
                      {(isChanging || !isReserved) && (
                        <button
                          type="button"
                          onClick={() => handleReserveAction(selectedBento?.bento_id || 0, selectedBento?.bento_name || "")}
                          disabled={isSubmitting || !selectedBentoId}
                          className={`flex-1 p-4 md:p-5 rounded-2xl text-white font-black text-sm md:text-lg shadow-xl transition-all active:scale-[0.98] ${
                            isSubmitting ? 'bg-gray-400' : 
                            isChanging ? 'bg-[#f39c12] hover:bg-[#e67e22]' :
                            'bg-[#d63031] hover:bg-[#b82728]'}`}
                        >
                          {isSubmitting ? '送信中...' : 
                           isChanging ? '種類を変更' :
                           '予約確定'}
                        </button>
                      )}

                      {/* キャンセルアクション */}
                      {isReserved && (
                        <button
                          type="button"
                          onClick={() => handleReserveAction(selectedBentoId || 0, reservedBentoName)}
                          disabled={isSubmitting}
                          className={`flex-1 p-4 md:p-5 rounded-2xl font-black text-sm md:text-lg shadow-xl transition-all active:scale-[0.98] border-2 ${
                            isSubmitting ? 'bg-gray-100 text-gray-400 border-gray-100' : 
                            'bg-white text-[#0984e3] border-[#0984e3] hover:bg-blue-50'}`}
                        >
                          {isSubmitting ? '処理中...' : '予約取消'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 md:p-20 text-center text-black">
                <div className="w-20 h-20 bg-[#2ecc71] rounded-full flex items-center justify-center mb-6 text-white text-[2.5rem] shadow-lg">✓</div>
                <h3 className="text-2xl font-black text-gray-800 mb-2">更新完了！</h3>
                <p className="text-gray-500 mb-8">予約情報を最新に更新しました。</p>
                <button type="button" onClick={closeOverlay} className="w-full max-w-[280px] p-4 bg-gray-900 text-white rounded-2xl font-black">OK</button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}