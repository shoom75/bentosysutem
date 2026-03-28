"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getFutureSummaryAction } from '@/actions';
import { useRouter } from 'next/navigation';
import { 
    BarChart3, 
    Calendar, 
    ChevronRight, 
    RefreshCcw, 
    TrendingUp, 
    Users, 
    Utensils,
    Info,
    LayoutDashboard,
    ArrowUpRight
} from 'lucide-react';

interface SummaryItem {
    date: string;
    counts: Record<string, number>;
}

const buildingLabel: Record<number, string> = {
    1: '1号館',
    2: '2号館',
    3: '3号館',
    4: '4号館',
    5: '5号館',
    6: '6号館',
};

export default function TeacherSummaryPage() {
    const [summary, setSummary] = useState<SummaryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isRoot, setIsRoot] = useState(false);
    const [buildingId, setBuildingId] = useState<number | null>(null);
    const router = useRouter();

    const fetchSummary = useCallback(async () => {
        setIsLoading(true);
        try {
            const root = sessionStorage.getItem('is_root') === 'true';
            const userBuildingId = sessionStorage.getItem('building_id');
            const bid = !root && userBuildingId ? parseInt(userBuildingId, 10) : undefined;
            
            const result = await getFutureSummaryAction(bid);
            if (result.success) {
                setSummary(result.summary);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const root = sessionStorage.getItem('is_root') === 'true';
        const bidStr = sessionStorage.getItem('building_id');
        const studentNum = sessionStorage.getItem('studentNum');
        const isStaff = root || (studentNum && studentNum.length <= 4);

        if (!isStaff) {
            router.replace('/');
            return;
        }

        setIsRoot(root);
        if (bidStr) setBuildingId(parseInt(bidStr, 10));
        fetchSummary();
    }, [router, fetchSummary]);


    // 総計データの計算
    const totals = useMemo(() => {
        const typeTotals: Record<string, number> = {};
        let grandTotal = 0;
        
        summary.forEach(item => {
            Object.entries(item.counts).forEach(([type, count]) => {
                typeTotals[type] = (typeTotals[type] || 0) + count;
                grandTotal += count;
            });
        });
        
        return { typeTotals, grandTotal };
    }, [summary]);

    // 日付フォーマット
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const m = date.getMonth() + 1;
            const d = date.getDate();
            const w = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
            return {
                main: `${m}/${d}`,
                sub: `(${w})`,
                isWeekend: date.getDay() === 0 || date.getDay() === 6
            };
        } catch {
            return { main: dateStr, sub: '', isWeekend: false };
        }
    };

    // ダイナミック・カラーパレットの生成
    const bentoColorMap = useMemo(() => {
        const types = Array.from(new Set(summary.flatMap(item => Object.keys(item.counts))));
        const palette = [
            'bg-[#FF4757]', // Red
            'bg-[#2E86DE]', // Blue
            'bg-[#27AE60]', // Green
            'bg-[#F39C12]', // Orange
            'bg-[#8E44AD]', // Purple
            'bg-[#1DD1A1]', // Teal
            'bg-[#FF9F43]', // Amber
            'bg-[#54A0FF]', // Sky
            'bg-[#EE5253]', // Rose
            'bg-[#0ABDE3]'  // Cyan
        ];
        
        const map: Record<string, string> = {};
        types.forEach((type, index) => {
            map[type] = palette[index % palette.length];
        });
        return map;
    }, [summary]);

    const getBarColor = (type: string) => bentoColorMap[type] || 'bg-slate-500';

    // 凡例表示用の全タイプ
    const allBentoTypes = useMemo(() => Object.keys(bentoColorMap), [bentoColorMap]);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 pb-24">
                
                {/* ヘッダーセクション */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                            <BarChart3 className="w-6 h-6 text-[#d63031]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-black text-slate-800">予約集計</h1>
                                {isRoot ? (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-tight">ALL CAMPUS</span>
                                ) : (
                                    <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-tight">
                                        {buildingLabel[buildingId || 0] || 'FILTERED'}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Future Reservations Summary</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => fetchSummary()}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white rounded-xl shadow-sm border border-slate-100 font-bold text-sm text-slate-600 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>最新のデータを取得</span>
                    </button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : summary.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <Utensils className="w-8 h-8 text-slate-300" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">予約が見つかりません</h2>
                        <p className="text-slate-400 font-medium mt-2">現在、今後の予約データは登録されていません。</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        
                        {/* メインサマリーカード */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 flex flex-col justify-between">
                                <TrendingUp className="w-5 h-5 text-indigo-500 mb-4" />
                                <div>
                                    <div className="text-2xl font-black text-slate-800">{totals.grandTotal}</div>
                                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">総予約数</div>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 flex flex-col justify-between">
                                <Calendar className="w-5 h-5 text-[#d63031] mb-4" />
                                <div>
                                    <div className="text-2xl font-black text-slate-800">{summary.length}</div>
                                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">稼働日数</div>
                                </div>
                            </div>
                            {Object.entries(totals.typeTotals).slice(0, 2).map(([type, count]) => (
                                <div key={type} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative">
                                    <div className={`absolute top-0 right-0 w-24 h-24 ${getBarColor(type)} opacity-5 -mr-12 -mt-12 rounded-full`} />
                                    <div className={`w-5 h-5 rounded-lg ${getBarColor(type)} mb-4`} />
                                    <div>
                                        <div className="text-2xl font-black text-slate-800">{count}</div>
                                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-tighter truncate">{type}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 凡例（Legend） */}
                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 flex flex-wrap gap-4 items-center justify-center">
                            {allBentoTypes.map(type => (
                                <div key={type} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${getBarColor(type)}`} />
                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{type}</span>
                                </div>
                            ))}
                        </div>

                        {/* 今後の予約リスト */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <h3 className="text-sm font-black text-slate-600 flex items-center gap-2">
                                    <ArrowUpRight className="w-4 h-4" />
                                    予約詳細スケジュール
                                </h3>
                                <div className="text-[11px] font-bold text-slate-400">TAP FOR DETAILS</div>
                            </div>

                            {summary.map((item) => {
                                const dateInfo = formatDate(item.date);
                                const dayTotal = Object.values(item.counts).reduce((a, b) => a + b, 0);
                                const isSelected = selectedDate === item.date;

                                return (
                                    <div key={item.date} className="group">
                                        <button 
                                            onClick={() => setSelectedDate(isSelected ? null : item.date)}
                                            className={`w-full bg-white rounded-[24px] overflow-hidden transition-all duration-300 border ${isSelected ? 'border-[#d63031] shadow-md' : 'border-slate-100 shadow-sm hover:border-[#d63031]/30'}`}
                                        >
                                            <div className="p-4 md:p-6 flex items-center">
                                                {/* 日付バッジ */}
                                                <div className={`shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center mr-4 shadow-sm border ${dateInfo.isWeekend ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                                    <span className={`text-base font-black ${dateInfo.isWeekend ? 'text-red-500' : 'text-slate-700'}`}>{dateInfo.main}</span>
                                                    <span className={`text-[10px] font-black ${dateInfo.isWeekend ? 'text-red-400' : 'text-slate-400'}`}>{dateInfo.sub}</span>
                                                </div>

                                                {/* 内容サマリー */}
                                                <div className="flex-grow min-w-0">
                                                    <div className="flex items-baseline justify-between mb-2">
                                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                                            {Object.entries(item.counts).map(([type, count]) => (
                                                                <span key={type} className="flex items-center gap-1.5 shrink-0">
                                                                    <span className={`w-2 h-2 rounded-full ${getBarColor(type)}`}></span>
                                                                    <span className="text-[11px] font-black text-slate-500">{count}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="text-right ml-2">
                                                            <span className="text-xl font-black text-[#d63031]">{dayTotal}</span>
                                                            <span className="text-[10px] font-black text-slate-400 ml-1">食</span>
                                                        </div>
                                                    </div>

                                                    {/* バーグラフ */}
                                                    <div className="h-2 w-full bg-slate-50 rounded-full flex overflow-hidden border border-slate-100">
                                                        {Object.entries(item.counts).map(([type, count]) => (
                                                            <div 
                                                                key={type}
                                                                className={`${getBarColor(type)} h-full transition-all duration-500`}
                                                                style={{ width: `${(count / dayTotal) * 100}%` }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className={`ml-4 transition-transform duration-300 ${isSelected ? 'rotate-90' : ''}`}>
                                                    <ChevronRight className={`w-5 h-5 ${isSelected ? 'text-[#d63031]' : 'text-slate-300'}`} />
                                                </div>
                                            </div>

                                            {/* 展開時詳細 */}
                                            {isSelected && (
                                                <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/30">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                                        {Object.entries(item.counts).map(([type, count]) => (
                                                            <div key={type} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-3 h-3 rounded-full ${getBarColor(type)}`} />
                                                                    <span className="text-[13px] font-black text-slate-700">{type}</span>
                                                                </div>
                                                                <div className="flex items-end gap-1">
                                                                    <span className="text-lg font-black text-slate-800">{count}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 mb-0.5">食</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* フローティングボトムサマリー (モバイル用) */}
                <div className="fixed bottom-6 left-4 right-4 z-[800] md:hidden">
                    <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-4 rounded-[24px] shadow-2xl flex items-center justify-between border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-white/50 uppercase tracking-wider">予約総数 合計</div>
                                <div className="text-xl font-black">{totals.grandTotal} <span className="text-sm font-normal text-white/60">食</span></div>
                            </div>
                        </div>
                        <button 
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white active:bg-white/20"
                        >
                            <LayoutDashboard className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>
            
            {/* 装飾 */}
            <div className="fixed top-0 right-0 -z-10 p-20 opacity-10 pointer-events-none">
                <Info className="w-96 h-96 text-slate-900 rotate-12" />
            </div>
        </div>
    );
}
