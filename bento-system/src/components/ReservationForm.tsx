"use client";

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface ReservationFormProps {
    date: Date;
    setDate: (date: Date) => void;
    onDateClick?: (date: Date) => void;
    reservedDates: string[]; // 親から最新のリストを受け取る
}

export default function ReservationForm({ date, setDate, onDateClick, reservedDates }: ReservationFormProps) {
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [studentName, setStudentName] = useState("");

    // フォーマット関数（判定用）
    const formatDateKey = (d: Date) => {
        return d.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replaceAll('/', '-');
    };

    useEffect(() => {
        const userName = sessionStorage.getItem('userName');
        if (userName) setStudentName(userName);
        // fetchReservedDates(userId) は親(BentoPage)がやるので、ここでは不要です
    }, []);

    const handleDateChange = (value: any) => {
        if (value instanceof Date) {
            setDate(value);
            if (onDateClick) {
                onDateClick(value);
            }
        }
    };

    // ドットの描画判定
    const getTileContent = ({ date: tileDate, view }: { date: Date, view: string }) => {
        if (view !== 'month') return null;
        
        const tileDateStr = formatDateKey(tileDate);
        // ★ 親から渡された最新の reservedDates を直接参照する
        const isReserved = reservedDates.includes(tileDateStr);

        return isReserved ? (
            <div className="flex justify-center mt-0.5">
                <div className="w-1.5 h-1.5 bg-[#0984e3] rounded-full shadow-sm animate-in zoom-in duration-300"></div>
            </div>
        ) : null;
    };

    return (
        <section id="reservation" className="py-10">
            <div className="max-w-[1200px] mx-auto px-5 lg:px-8 flex justify-center">
                <div className="bg-white p-4 md:p-10 rounded-2xl shadow-xl w-full max-w-[500px]">
                    <div className="text-center mb-6">
                        <h2 className="text-[1.6rem] font-black mb-2 text-[#2d3436]">予約日を選択</h2>
                        <p className="text-gray-500 text-sm">カレンダーから日付をタップしてください</p>
                        {studentName && (
                            <div className="inline-block mt-4 px-4 py-1.5 bg-red-50 rounded-full text-sm font-bold text-[#d63031] border border-red-100">
                                予約者：{studentName} さん
                            </div>
                        )}
                    </div>

                    <div className="w-full flex justify-center mb-6 custom-calendar hide-weekends">
                        <Calendar
                            onChange={handleDateChange}
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

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 text-center leading-relaxed">
                            ※ 当日の予約は承っておりません。明日以降の平日を選択してください。<br />
                            ※ 青い点は予約済みの印です。タップして内容の確認・変更ができます。
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}