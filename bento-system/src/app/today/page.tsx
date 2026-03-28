"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getTodayOrderAction, receiveOrderAction } from '@/actions';
import { useToast } from '@/components/ToastProvider';

const buildingStyles: { [key: string]: { bg: string; text: string; label: string } } = {
    '1': { bg: 'bg-blue-600', text: 'text-blue-600', label: '1号館受取' },
    '2': { bg: 'bg-red-600', text: 'text-red-600', label: '2号館受取' },
    '3': { bg: 'bg-green-600', text: 'text-green-600', label: '3号館受取' },
    '4': { bg: 'bg-yellow-600', text: 'text-yellow-600', label: '4号館受取' },
    '5': { bg: 'bg-purple-600', text: 'text-purple-600', label: '5号館受取' },
    '6': { bg: 'bg-gray-800', text: 'text-gray-800', label: '6号館受取' },
};

interface OrderInfo {
    order_id: number;
    bento_type: string;
    order_date: string;
    is_received: boolean;
    received_at: string | null;
}

interface BentoInfo {
    bento_id: number;
    bento_name: string;
    price: number;
    explanation: string;
    img_link: string | null;
    allergy_info: string | null;
}

// 確認ダイアログの状態
type ConfirmStatus = 'idle' | 'confirming';

export default function TodayPage() {
    const [order, setOrder] = useState<OrderInfo | null>(null);
    const [bentoInfo, setBentoInfo] = useState<BentoInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>('idle');
    const [isProcessing, setIsProcessing] = useState(false);
    const [buildingId, setBuildingId] = useState('1');
    const { showToast } = useToast();

    const fetchTodayOrder = useCallback(async () => {
        const userId = sessionStorage.getItem('userId');
        if (!userId) return;
        setIsLoading(true);
        try {
            const result = await getTodayOrderAction(userId);
            if (result.success) {
                setOrder(result.order);
                setBentoInfo(result.bentoInfo as BentoInfo | null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const bid = sessionStorage.getItem('building_id') || '1';
        setBuildingId(bid);
        fetchTodayOrder();
    }, [fetchTodayOrder]);

    const style = buildingStyles[buildingId] || { bg: 'bg-gray-500', text: 'text-gray-500', label: '受取場所未定' };

    // 受け取りボタン押下
    const handleReceiveClick = () => setConfirmStatus('confirming');

    // 受け取り完了処理
    const handleFinalConfirm = async () => {
        if (!order) return;
        setIsProcessing(true);
        try {
            const result = await receiveOrderAction(order.order_id);
            if (result.success) {
                setOrder(prev => prev ? { ...prev, is_received: true, received_at: new Date().toISOString() } : null);
                setConfirmStatus('idle');
                showToast('受け取りを完了しました！', 'success');
            } else {
                showToast('受け取り処理に失敗しました。', 'error');
            }
        } catch {
            showToast('通信エラーが発生しました。', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => setConfirmStatus('idle');

    const todayLabel = new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
    }).format(new Date());

    return (
        <div className="px-4 py-4 md:p-10 max-w-2xl mx-auto min-h-screen">
            <div className="flex justify-between items-end mb-4 border-b-2 border-red-600 pb-1">
                <h1 className="text-xl font-black text-gray-800">
                    受け取り
                </h1>
                <p className="text-gray-400 text-[10px] mb-0.5">{todayLabel}</p>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-lg text-gray-400 animate-pulse">読み込み中...</div>
            ) : !order ? (
                <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-3xl border border-gray-200 shadow-sm">
                    <div className="text-5xl mb-4">🍱</div>
                    <p className="text-lg font-bold">本日の予約はありません</p>
                    <p className="text-sm text-gray-400 mt-1">予約ページから注文してください</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* 弁当カード */}
                    <div className="bg-white rounded-[24px] overflow-hidden shadow-lg border border-gray-100">
                        {/* 弁当画像 */}
                        <div className="w-full h-64 sm:h-80 md:h-[400px] bg-gray-100 overflow-hidden relative">
                            <div className={`absolute top-0 right-0 ${style.bg} px-4 py-1.5 text-white text-xs font-bold rounded-bl-xl`}>
                                {style.label}
                            </div>
                            {bentoInfo?.img_link ? (
                                <img
                                    src={bentoInfo.img_link}
                                    alt={bentoInfo.bento_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-7xl">🍱</div>
                            )}
                        </div>

                        {/* 弁当詳細 */}
                        <div className="p-4 md:p-8">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xl md:text-2xl font-black text-gray-800 truncate mr-2">
                                    {bentoInfo?.bento_name || order.bento_type}
                                </h3>
                                <span className="text-xl font-black text-[#d63031] shrink-0">
                                    ¥{bentoInfo?.price.toLocaleString() || '---'}
                                </span>
                            </div>

                            {/* アレルギー情報 */}
                            {bentoInfo?.allergy_info && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-xs text-yellow-800">
                                    <span className="font-bold">⚠ アレルギー：</span>{bentoInfo.allergy_info}
                                </div>
                            )}

                            {/* 情報テーブルをよりコンパクトに */}
                            <div className="grid grid-cols-2 gap-2 mb-4 text-[13px]">
                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col">
                                    <span className="text-gray-400 text-[10px] font-bold">注文日</span>
                                    <span className="font-bold text-gray-700">{order.order_date}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col">
                                    <span className="text-gray-400 text-[10px] font-bold">受取場所</span>
                                    <span className={`font-black ${style.text}`}>{style.label}</span>
                                </div>
                            </div>

                            {/* 受け取りボタン or 完了表示 */}
                            {order.is_received ? (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                                    <p className="font-black text-green-700">✅ 受け取り完了</p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleReceiveClick}
                                    className="w-full py-3.5 bg-[#d63031] hover:bg-[#b82728] text-white font-black text-lg rounded-xl shadow-md transition-all active:scale-[0.98]"
                                >
                                    受け取り完了にする
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== 確認ダイアログ（1段階に短縮） ===== */}
            {confirmStatus === 'confirming' && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />
                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl">🍱</div>
                        <h2 className="text-xl font-black text-gray-800 text-center">受け取りを完了しますか？</h2>
                        <p className="text-gray-500 text-center text-sm">
                            お弁当を受け取った場合の押してください。<br />このボタンを押すと戻せません
                        </p>
                        <div className="flex flex-col gap-3 w-full mt-2">
                            <button
                                onClick={handleFinalConfirm}
                                disabled={isProcessing}
                                className="w-full py-3.5 bg-[#d63031] hover:bg-[#b82728] text-white font-black rounded-xl"
                            >
                                {isProcessing ? '処理中...' : 'はい、受け取りました'}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
