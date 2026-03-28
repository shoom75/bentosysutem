"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Hash, MapPin, Loader2, ArrowLeft, LogOut, ShieldCheck, Key, Lock, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { getProfileAction, updateSecretAnswerAction } from '@/actions';
import { supabase } from '@/lib/supabase';

interface UserProfile {
    num: number;
    email: string;
    building_id: number;
    secret_answer?: string;
}

const buildings = [
    { id: 1, name: '1号館' },
    { id: 2, name: '2号館' },
    { id: 3, name: '3号館' },
    { id: 4, name: '4号館' },
    { id: 5, name: '5号館' },
    { id: 6, name: '6号館' },
];

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // パスワード変更用のState
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);

    // 合言葉変更用のState
    const [isEditingSecret, setIsEditingSecret] = useState(false);
    const [newSecretAnswer, setNewSecretAnswer] = useState('');
    const [secretError, setSecretError] = useState('');
    const [secretSuccess, setSecretSuccess] = useState(false);
    const [updatingSecret, setUpdatingSecret] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            const userId = sessionStorage.getItem('userId');
            if (!userId) {
                router.replace('/login');
                return;
            }

            const data = await getProfileAction(userId);
            if (data.success && data.profile) {
                setProfile(data.profile);
            } else {
                setError('プロフィールの取得に失敗しました');
            }
            setLoading(false);
        };
        fetchProfile();
    }, [router]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.replace('/login');
    };

    const handleUpdatePassword = async () => {
        setPasswordError('');
        setPasswordSuccess(false);

        if (newPassword.length < 6) {
            setPasswordError('パスワードは6文字以上で入力してください');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('確認用パスワードが一致しません');
            return;
        }

        setUpdatingPassword(true);
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            setPasswordError('パスワードの変更に失敗しました: ' + updateError.message);
        } else {
            setPasswordSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setIsEditingPassword(false);
                setPasswordSuccess(false);
            }, 3000);
        }
        setUpdatingPassword(false);
    };

    const handleUpdateSecret = async () => {
        setSecretError('');
        setSecretSuccess(false);

        const trimmed = newSecretAnswer.trim();
        if (!trimmed) {
            setSecretError('合言葉を入力してください');
            return;
        }

        setUpdatingSecret(true);
        const userId = sessionStorage.getItem('userId');
        if (userId) {
            const data = await updateSecretAnswerAction(userId, trimmed);
            if (data.success) {
                setSecretSuccess(true);
                setProfile(prev => prev ? { ...prev, secret_answer: trimmed } : null);
                setTimeout(() => {
                    setIsEditingSecret(false);
                    setSecretSuccess(false);
                }, 3000);
            } else {
                setSecretError(data.error || '更新に失敗しました');
            }
        }
        setUpdatingSecret(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col pt-16 lg:pt-8 p-4 lg:p-8 animate-in fade-in duration-500">
                <div className="flex justify-center items-center h-full pt-20">
                    <Loader2 className="w-8 h-8 text-[#d63031] animate-spin" />
                </div>
            </div>
        );
    }

    const buildingName = buildings.find(b => b.id === profile?.building_id)?.name || '未設定';

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col pt-16 lg:pt-8 p-4 lg:p-8 animate-in fade-in duration-500">
            <div className="max-w-2xl w-full mx-auto space-y-6">
                
                {/* ヘッダー */}
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-500 hover:text-slate-800"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">プロフィール</h1>
                </div>

                {error ? (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm text-center">
                        {error}
                    </div>
                ) : (
                    <>
                        {/* プロフィールカード本体 */}
                        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100/50">
                            
                            {/* アイコンと名前（学籍番号） */}
                            <div className="flex flex-col items-center mb-8 pb-8 border-b border-slate-100">
                                <div className="w-24 h-24 bg-gradient-to-tr from-[#d63031] to-red-400 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-red-200">
                                    <User className="w-12 h-12 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800">{profile?.num}</h2>
                                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>認証済みアカウント</span>
                                </div>
                            </div>

                            {/* 詳細情報 */}
                            <div className="space-y-6">
                                <div className="group flex items-center p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-slate-100 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-[#d63031] transition-colors mr-4 shrink-0">
                                        <Hash className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">学籍番号</span>
                                        <span className="text-[15px] font-bold text-slate-700">{profile?.num}</span>
                                    </div>
                                </div>

                                <div className="group flex items-center p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-slate-100 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-[#d63031] transition-colors mr-4 shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">メールアドレス</span>
                                        <span className="text-[15px] font-bold text-slate-700 truncate">{profile?.email || '未設定'}</span>
                                    </div>
                                </div>

                                <div className="group flex items-center p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-slate-100 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-[#d63031] transition-colors mr-4 shrink-0">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">所属号館</span>
                                        <span className="text-[15px] font-bold text-slate-700">{buildingName}</span>
                                    </div>
                                </div>
                                
                                {/* 合言葉の表示 */}
                                <div className="group flex items-center p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-slate-100 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-[#d63031] transition-colors mr-4 shrink-0">
                                        <HelpCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">合言葉（パスワード忘れ用）</span>
                                        <span className="text-[15px] font-bold text-slate-700 truncate">{profile?.secret_answer || '未設定'}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setNewSecretAnswer(profile?.secret_answer || '');
                                            setIsEditingSecret(true);
                                        }}
                                        className="text-xs font-bold text-[#d63031] bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors ml-2 shrink-0"
                                    >
                                        変更
                                    </button>
                                </div>
                            </div>

                            {/* 合言葉変更フォーム */}
                            {isEditingSecret && (
                                <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4">
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                            <HelpCircle className="w-4 h-4 text-[#d63031]" />
                                            合言葉を更新
                                        </h3>
                                        
                                        {secretError && (
                                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                                                {secretError}
                                            </div>
                                        )}
                                        {secretSuccess && (
                                            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-xs font-bold border border-green-100">
                                                合言葉を更新しました！
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder="新しい合言葉を入力"
                                                value={newSecretAnswer}
                                                onChange={(e) => setNewSecretAnswer(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#d63031]/20 focus:border-[#d63031] transition-all"
                                            />
                                            
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => {
                                                        setIsEditingSecret(false);
                                                        setSecretError('');
                                                        setSecretSuccess(false);
                                                    }}
                                                    className="flex-1 bg-white border border-slate-200 text-slate-500 font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors text-sm"
                                                >
                                                    キャンセル
                                                </button>
                                                <button
                                                    onClick={handleUpdateSecret}
                                                    disabled={updatingSecret}
                                                    className="flex-1 bg-[#d63031] text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {updatingSecret && <Loader2 className="w-4 h-4 animate-spin" />}
                                                    変更を保存
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* パスワード変更セクション */}
                            <div className="mt-10 pt-8 border-t border-slate-100">
                                {!isEditingPassword ? (
                                    <button
                                        onClick={() => setIsEditingPassword(true)}
                                        className="w-full bg-slate-50 text-slate-600 font-bold p-4 rounded-2xl border border-slate-200 hover:border-[#d63031] hover:text-[#d63031] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Key className="w-5 h-5" />
                                        パスワードを変更する
                                    </button>
                                ) : (
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
                                        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-[#d63031]" />
                                            新しいパスワードを設定
                                        </h3>
                                        
                                        {passwordError && (
                                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                                                {passwordError}
                                            </div>
                                        )}
                                        {passwordSuccess && (
                                            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-xs font-bold border border-green-100">
                                                パスワードを更新しました！
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="新しいパスワード（6文字以上）"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm font-bold outline-none focus:ring-2 focus:ring-[#d63031]/20 focus:border-[#d63031] transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onMouseDown={() => setShowPassword(true)}
                                                    onMouseUp={() => setShowPassword(false)}
                                                    onMouseLeave={() => setShowPassword(false)}
                                                    onTouchStart={() => setShowPassword(true)}
                                                    onTouchEnd={() => setShowPassword(false)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={showPasswordConfirm ? "text" : "password"}
                                                    placeholder="新しいパスワード（確認用）"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm font-bold outline-none focus:ring-2 focus:ring-[#d63031]/20 focus:border-[#d63031] transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onMouseDown={() => setShowPasswordConfirm(true)}
                                                    onMouseUp={() => setShowPasswordConfirm(false)}
                                                    onMouseLeave={() => setShowPasswordConfirm(false)}
                                                    onTouchStart={() => setShowPasswordConfirm(true)}
                                                    onTouchEnd={() => setShowPasswordConfirm(false)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => {
                                                        setIsEditingPassword(false);
                                                        setPasswordError('');
                                                        setPasswordSuccess(false);
                                                        setNewPassword('');
                                                        setConfirmPassword('');
                                                    }}
                                                    className="flex-1 bg-white border border-slate-200 text-slate-500 font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors text-sm"
                                                >
                                                    キャンセル
                                                </button>
                                                <button
                                                    onClick={handleUpdatePassword}
                                                    disabled={updatingPassword}
                                                    className="flex-1 bg-[#d63031] text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {updatingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                                                    変更を保存
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ログアウトボタン（プロフ画面用） */}
                        <div className="pt-4">
                            <button
                                onClick={handleLogout}
                                className="w-full bg-white border-2 border-slate-200 text-slate-600 font-bold p-4 rounded-2xl hover:border-red-500 hover:text-red-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-5 h-5" />
                                ログアウト
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
