"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/actions';

export default function LoginPage() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const userName = sessionStorage.getItem('userName');
        if (userName) {
            router.replace('/');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setError('');
        setLoading(true);

        try {
            const data = await loginAction(userId, password);

            if (data.success === true) {
                if (data.name) sessionStorage.setItem('userName', data.name);
                window.location.href = "/";
            } else {
                setError(data.message || '学籍番号またはパスワードが間違っています。');
            }
        } catch (err) {
            setError('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-5">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-red-600">
                <h1 className="text-2xl font-bold text-center mb-6">ログイン</h1>

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
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">パスワード</label>
                        <input
                            type="password"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full p-4 text-white rounded-lg font-bold bg-red-600 hover:bg-red-700 transition ${loading ? 'opacity-50' : ''}`}
                    >
                        {loading ? 'ログイン中' : 'ログイン'}
                    </button>
                </form>
            </div>
        </div>
    );
}