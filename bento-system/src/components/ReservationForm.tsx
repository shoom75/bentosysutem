"use client";

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { BentoItem } from '@/types';
import { getHistoryAction, reserveAction } from '@/actions';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface ReservationFormProps {
    selectedBentoItem: BentoItem | undefined;
}

export default function ReservationForm({ selectedBentoItem }: ReservationFormProps) {
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [date, setDate] = useState<Value>(tomorrow);
    const [studentName, setStudentName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reservedDates, setReservedDates] = useState<string[]>([]);

    useEffect(() => {
        const savedName = sessionStorage.getItem('userName');
        if (savedName) {
            setStudentName(savedName);
            fetchReservedDates(savedName);
        }
    }, []);

    const fetchReservedDates = async (name: string) => {
        const cached = localStorage.getItem(`reserved_dates_${name}`);
        if (cached) {
            try { setReservedDates(JSON.parse(cached)); } catch (e) { }
        }

        try {
            const data = await getHistoryAction(name);
            if (data.success && data.history) {
                const dates = data.history.map((h: any) => {
                    try {
                        const d = new Date(h.date);
                        if (isNaN(d.getTime())) return h.date;
                        return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(d);
                    } catch (e) { return h.date; }
                });
                setReservedDates(dates);
                localStorage.setItem(`reserved_dates_${name}`, JSON.stringify(dates));
            }
        } catch (error) {
            console.error("履歴取得エラー:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            const result = await reserveAction({
                name: studentName,
                bento: selectedBentoItem ? selectedBentoItem.name : "",
                reservationDate: selectedDateStr
            });

            if (result.success) {
                window.location.href = "/complete";
            } else {
                alert(result.message);
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error("送信エラー:", error);
            alert("送信に失敗しました。");
            setIsSubmitting(false);
        }
    };

    const getTileContent = ({ date, view }: { date: Date, view: string }) => {
        if (view !== 'month') return null;
        const dateStr = new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(date);
        const isReserved = reservedDates.some(rd => rd === dateStr);

        return isReserved ? (
            <div className="flex justify-center mt-0.5">
                <div className="w-1.5 h-1.5 bg-[#0984e3] rounded-full shadow-sm"></div>
            </div>
        ) : null;
    };

    return (
        <section id="reservation" className="py-5">
            <div className="max-w-[1200px] mx-auto px-5 lg:px-8 flex justify-center">
                <div className="bg-white p-4 md:p-10 rounded-2xl shadow-xl w-full max-w-[440px]">
                    <div className="text-center mb-6">
                        <h2 className="text-[1.4rem] font-bold mb-2">予約日を選択</h2>
                        <div className="inline-block px-4 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                            予約者：{studentName} さん
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="w-full flex justify-center mb-6 custom-calendar hide-weekends">
                            <Calendar
                                onChange={setDate}
                                value={date}
                                locale="ja-JP"
                                calendarType="gregory"
                                minDetail="month"
                                maxDetail="month"
                                minDate={tomorrow}
                                formatDay={(locale, date) => date.getDate().toString()}
                                tileContent={getTileContent}
                                tileDisabled={({ date }) => date.getDay() === 0 || date.getDay() === 6}
                            />
                        </div>

                        <div className="bg-red-50 p-4 rounded-lg mb-6 border border-red-100">
                            <p className="text-sm text-red-800 text-center font-medium">
                                ※ 当日の予約は承っておりません。<br />明日以降の日付を選択してください。
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !studentName.trim()}
                            className={`w-full p-4 text-[1.1rem] rounded-lg text-white font-bold transition-all shadow-md active:scale-95 ${isSubmitting || !studentName.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#d63031] hover:bg-[#b82728]'}`}
                        >
                            {isSubmitting ? '送信中...' : 'この日で予約する'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
