"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReservationForm from '@/components/ReservationForm';
import { getHistoryAction, reserveAction, getFullBentoScheduleAction, type HistoryRecord, getJSTTodayStr, getProfileAction, updateProfileAction } from '@/actions';
import { BentoInfo } from '@/types';
import { useToast } from '@/components/ToastProvider';
import { RefreshCw, AlertTriangle, GraduationCap, Users, MapPin, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

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

  // 年度更新（進級）強制用のState
  const [showUpdateOverlay, setShowUpdateOverlay] = useState(false);
  const [newSchoolYear, setNewSchoolYear] = useState(1);
  const [newClass, setNewClass] = useState('A');
  const [newBuildingId, setNewBuildingId] = useState(1);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isConfirmingUpdate, setIsConfirmingUpdate] = useState(false);

  // --- 強力なガード：教員（is_root）がここに来た場合、一瞬もUIを見せずに追い出す ---
  if (typeof window !== 'undefined') {
    const isRootAtTop = sessionStorage.getItem('is_root') === 'true';
    const isPreviewMode = new URLSearchParams(window.location.search).get('preview') === 'true';
    
    if (isRootAtTop && !isPreviewMode) {
      window.location.replace('/teacher');
      return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
          <p className="text-sm font-bold text-gray-400">管理画面へ移動中...</p>
        </div>
      );
    }
  }

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
    const isRootSub = sessionStorage.getItem('is_root') === 'true';
    const isPreviewMode = (typeof window !== 'undefined') && new URLSearchParams(window.location.search).get('preview') === 'true';

    if (!userId) {
      router.replace('/login');
      return;
    }

    if (isRootSub && !isPreviewMode) {
      window.location.replace('/teacher');
      return;
    }
    
    setIsSyncing(true);
    setLoadError(false);

    try {
      if (isPreviewMode) {
        // 教員プレビューモード：献立のみ取得
        const scheduleRes = await getFullBentoScheduleAction();
        if (scheduleRes.success) {
          setBentoScheduleMap(scheduleRes.scheduleMap);
          setIsAuthorized(true);
        } else {
          setLoadError(true);
        }
      } else {
        // 通常の学生モード：履歴、献立、プロフィールを取得
        const [historyRes, scheduleRes, profileData] = await Promise.all([
          getHistoryAction(userId),
          getFullBentoScheduleAction(),
          getProfileAction(userId)
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

        // 年度更新チェック
        if (profileData.success && profileData.profile) {
          const p = profileData.profile as any;
          const now = new Date();
          const currentFiscalYear = now.getMonth() + 1 < 4 ? now.getFullYear() - 1 : now.getFullYear();
          const forcedTest = (typeof window !== 'undefined') && new URLSearchParams(window.location.search).get('test_update') === 'true';

          if (forcedTest || (p.fiscal_year || 0) < currentFiscalYear) {
            setNewSchoolYear(p.school_year || 1);
            setNewClass(p.class || 'A');
            setNewBuildingId(p.building_id || 1);
            setShowUpdateOverlay(true);
          }
        }
      }
    } catch (err) {
      console.error("Data load error:", err);
      setLoadError(true);
      showToast('データの取得に失敗しました。', 'error');
    } finally {
      setIsSyncing(false);
      const isPreview = (typeof window !== 'undefined') && new URLSearchParams(window.location.search).get('preview') === 'true';
      if (!isRootSub || isPreview) {
        setIsAuthorized(true);
      }
    }
  }, [router, showToast]);

  useEffect(() => {
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
    // プレビューモード防止
    const isPreview = (typeof window !== 'undefined') && new URLSearchParams(window.location.search).get('preview') === 'true';
    if (isPreview) {
      showToast("プレビューモードでは予約・取消はできません", "info");
      return;
    }

    const userId = sessionStorage.getItem('userId') || "";
    if (!targetBentoId || !targetBentoName || !userId) return;

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
      showToast('送信に失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfilePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmingUpdate(true);
  };

  const handleUpdateProfileSubmit = async () => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    setIsConfirmingUpdate(false);
    setIsUpdatingProfile(true);
    try {
      const res = await updateProfileAction(userId, {
        school_year: newSchoolYear,
        class: newClass,
        building_id: newBuildingId
      });
      if (res.success) {
        showToast('新年度の情報を更新しました！', 'success');
        setShowUpdateOverlay(false);
        sessionStorage.setItem('building_id', newBuildingId.toString());
        fetchAllData();
      } else {
        showToast('更新に失敗しました', 'error');
      }
    } catch (err) {
      showToast('エラーが発生しました', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const closeOverlay = () => {
    setShowOverlay(false);
    setIsCompleted(false);
    setIsSubmitting(false);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // プレビューモード判定
  const isPreviewMode = (typeof window !== 'undefined') && new URLSearchParams(window.location.search).get('preview') === 'true';

  return (
    <main className="min-h-screen bg-[#f8f9fa] pb-20 relative text-slate-800">
      {loadError && !isSyncing && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[3000] w-[90%] max-w-sm">
          <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-xs font-black">データを読み込めませんでした</span>
            </div>
            <button onClick={() => fetchAllData()} className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-black">再試行</button>
          </div>
        </div>
      )}

      {isSyncing && (
        <div className="fixed top-6 right-6 z-[3000] bg-white/90 backdrop-blur px-5 py-3 rounded-2xl shadow-2xl border border-red-100 flex items-center gap-3">
          <div className="w-5 h-5 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-black text-slate-700">同期中...</span>
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
        <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeOverlay}></div>
          <div className="relative bg-white w-full max-w-[850px] h-[75vh] md:max-h-[85vh] md:h-fit rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col pt-3 md:pt-0 animate-in slide-in-from-bottom-8 duration-500">
            {/* スマホのみ：視覚的な「引き手」インジケーター */}
            <div className="md:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 shrink-0" />
            {!isCompleted ? (
              <>
                <div className="bg-[#d63031] p-5 md:p-8 text-white shrink-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xl md:text-2xl font-black">
                      {isReserved ? '予約内容の確認・変更' : 'お弁当を選択'}
                    </h3>
                    <button type="button" onClick={closeOverlay} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all">✕</button>
                  </div>
                  <p className="text-sm md:text-base opacity-90">
                    {date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })} の{isReserved ? '予約内容' : '新規予約'}
                  </p>
                </div>

                <div className="p-5 md:p-8 overflow-y-auto flex-grow bg-white">
                  {currentItems.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl">
                      <p className="font-bold">この日の弁当情報がありません</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                      {currentItems.map((item) => (
                        <div
                          key={item.bento_id}
                          onClick={() => setSelectedBentoId(item.bento_id)}
                          className={`flex md:flex-col border-2 rounded-2xl cursor-pointer transition-all ${selectedBentoId === item.bento_id ? 'border-[#d63031] bg-red-50' : 'border-slate-100 bg-white'}`}
                        >
                          <div className="w-24 h-24 md:w-full md:h-40 bg-slate-100 flex items-center justify-center shrink-0">
                            {item.img_link ? <img src={item.img_link} alt={item.bento_name} className="w-full h-full object-cover" /> : <span className="text-4xl">🍱</span>}
                          </div>
                          <div className="p-3 md:p-4 flex-grow flex flex-col min-w-0 bg-white">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-black text-sm md:text-base leading-tight truncate ${selectedBentoId === item.bento_id ? 'text-[#d63031]' : 'text-slate-800'}`}>{item.bento_name}</span>
                                    {reservedBentoName === item.bento_name && (
                                        <span className="text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-md shrink-0 ml-2">予約済み</span>
                                    )}
                                </div>
                                <p className="text-[10px] md:text-xs text-slate-500 line-clamp-2 md:line-clamp-3 mb-2 min-h-[2.5em]">
                                    {item.explanation || 'お弁当の詳細はスタッフまで。'}
                                </p>
                                {item.allergy_info && (
                                    <div className="flex items-center gap-1 text-[9px] text-orange-600 font-bold mb-3">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>{item.allergy_info}</span>
                                    </div>
                                )}
                                <div className="mt-auto pt-2 border-t border-slate-50">
                                    <span className="text-sm md:text-lg font-black text-slate-800">¥{item.price.toLocaleString()}</span>
                                </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedBento && (
                    <div className={`mb-6 p-4 rounded-2xl border ${isPreviewMode ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-2 h-2 rounded-full ${isPreviewMode ? 'bg-amber-400' : 'bg-[#d63031]'} animate-pulse`} />
                        <h4 className="font-black text-slate-800 text-sm">{selectedBento.bento_name} の詳細</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-bold mb-2">
                        {selectedBento.explanation || 'おいしいお弁当をお届けします。'}
                      </p>
                      {selectedBento.allergy_info && (
                        <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-orange-100">
                           <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                           <span className="text-[10px] text-orange-600 font-black">
                             アレルギー情報：{selectedBento.allergy_info}
                           </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-row gap-4">
                    {isPreviewMode ? (
                      <div className="flex-1 p-5 rounded-2xl bg-amber-50 text-amber-600 font-bold text-center border-2 border-dashed border-amber-200 text-sm">
                        ⚠️ プレビューモードでは予約操作は行えません
                      </div>
                    ) : (
                      <>
                        {(isChanging || !isReserved) && (
                          <button
                            type="button"
                            onClick={() => handleReserveAction(selectedBento?.bento_id || 0, selectedBento?.bento_name || "")}
                            disabled={isSubmitting || !selectedBentoId}
                            className={`flex-1 p-4 md:p-5 rounded-2xl text-white font-black text-sm md:text-lg shadow-xl ${isSubmitting ? 'bg-slate-400' : isChanging ? 'bg-[#f39c12]' : 'bg-[#d63031]'}`}
                          >
                            {isSubmitting ? '送信中...' : isChanging ? '種類を変更' : '予約確定'}
                          </button>
                        )}
                        {isReserved && (
                          <button
                            type="button"
                            onClick={() => handleReserveAction(selectedBentoId || 0, reservedBentoName)}
                            disabled={isSubmitting}
                            className="flex-1 p-4 md:p-5 rounded-2xl font-black text-sm md:text-lg shadow-xl border-2 border-[#0984e3] text-[#0984e3] bg-white transition-all active:scale-95"
                          >
                            予約取消
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 md:p-20 text-center bg-white flex-grow">
                <div className="w-20 h-20 bg-[#2ecc71] rounded-full flex items-center justify-center mb-6 text-white text-[2.5rem]">✓</div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">更新完了！</h3>
                <p className="text-slate-500 mb-8 font-bold">予約情報を最新の状態に更新しました。</p>
                <button type="button" onClick={closeOverlay} className="w-full max-w-[280px] p-4 bg-slate-900 text-white rounded-2xl font-black active:scale-95 transition-all">OK</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showUpdateOverlay && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-[500px] rounded-[40px] shadow-2xl overflow-hidden">
            <div className="bg-[#d63031] p-8 text-white relative">
              <GraduationCap className="w-12 h-12 text-white/30 absolute top-4 right-4" />
              <h3 className="text-2xl font-black mb-1">年度末・新年度の更新</h3>
              <p className="text-sm opacity-90 font-medium">新年度の情報を入力して、お弁当の予約を開始してください。</p>
            </div>
            <form onSubmit={handleUpdateProfilePreSubmit} className="p-8 space-y-6 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">新学年</label>
                  <select value={newSchoolYear} onChange={(e) => setNewSchoolYear(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-red-100">
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}年生</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">クラス</label>
                  <select value={newClass} onChange={(e) => setNewClass(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-red-100">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(c => <option key={c} value={c}>{c}組</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-black">配達場所</label>
                <select value={newBuildingId} onChange={(e) => setNewBuildingId(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-red-100">
                  {[1, 2, 3, 4, 5, 6].map(i => <option key={i} value={i}>{i}号館</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-[#d63031] text-white font-black py-4 rounded-2xl shadow-xl shadow-red-100 flex items-center justify-center gap-2 group hover:bg-[#b82728] active:scale-[0.98] transition-all">
                <span>確認画面へ進む</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      )}

      {isConfirmingUpdate && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight">内容の確認</h3>
            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
              <div className="flex justify-between items-center text-sm font-bold"><span className="text-slate-400">学級</span><span className="text-slate-800">{newSchoolYear}年 {newClass}組</span></div>
              <div className="flex justify-between items-center text-sm font-bold pt-3 border-t border-slate-200"><span className="text-slate-400 text-black">号館</span><span className="text-[#d63031] text-lg font-black">{newBuildingId}号館</span></div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleUpdateProfileSubmit} disabled={isUpdatingProfile} className="w-full bg-[#d63031] text-white font-black py-4 rounded-2xl shadow-xl hover:bg-[#b82728] active:scale-[0.98] transition-all flex items-center justify-center">
                {isUpdatingProfile ? <Loader2 className="w-6 h-6 animate-spin" /> : "更新する"}
              </button>
              <button onClick={() => setIsConfirmingUpdate(false)} className="w-full bg-white text-slate-500 font-bold py-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all">修正する</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}