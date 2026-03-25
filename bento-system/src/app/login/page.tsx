"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/actions';

const toHalfWidth = (str: string) => {
    return str.replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
};

export default function LoginPage() {
    const [userIdInput, setUserIdInput] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const userId = sessionStorage.getItem('userId');
        if (userId) {
            router.replace('/');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError('');
        setLoading(true);

        const formattedUserId = toHalfWidth(userIdInput);
        const formattedPassword = toHalfWidth(password);

        // 念のためステートにも反映させる
        setUserIdInput(formattedUserId);
        setPassword(formattedPassword);

        try {
            const data = await loginAction(formattedUserId, formattedPassword);
            if (data.success && data.user) {
                sessionStorage.setItem('userId', data.user.id.toString());
                sessionStorage.setItem('studentNum', data.user.num.toString());
                sessionStorage.setItem('building_id', data.user.building_id.toString());
                sessionStorage.setItem('is_root', data.user.is_root ? 'true' : 'false');
                // 教員（is_root: true）は教員ページへ
                window.location.href = data.user.is_root ? '/teacher' : '/';
            } else {
                setError(data.error || 'ログインに失敗しました。');
            }
        } catch (err) {
            setError('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-50 p-5 text-black overflow-auto">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-red-600">
                <h1 className="text-2xl font-bold text-center mb-6">国際理工 弁当予約</h1>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">学籍番号</label>
                        <input
                            type="text"
                            placeholder="学籍番号を入力"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            value={userIdInput}
                            onChange={(e) => setUserIdInput(e.target.value)}
                            onBlur={() => setUserIdInput(toHalfWidth(userIdInput))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">パスワード</label>
                        <input
                            type="password"
                            placeholder="パスワードを入力"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => setPassword(toHalfWidth(password))}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full p-4 text-white rounded-lg font-bold bg-red-600 hover:bg-red-700 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? '認証中...' : 'ログイン'}
                    </button>
                </form>
            </div>
        </div>
    );
}