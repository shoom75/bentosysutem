"use client";

import React from 'react';
import { logErrorAction } from '@/actions';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const userId = typeof window !== 'undefined' ? sessionStorage.getItem('userId') : null;
    
    // エラーログ専用テーブルに記録
    logErrorAction('CLIENT_CRASH', error.message, {
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    }, userId, error.stack + "\n\n" + errorInfo.componentStack);

    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
          <div className="max-w-md bg-white p-10 rounded-[32px] shadow-2xl border border-red-100 flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-4xl animate-bounce">⚠️</div>
            <h2 className="text-2xl font-black text-gray-800">問題が発生しました</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              申し訳ありません。アプリの処理中にエラーが発生しました。一度ページを読み込み直してください。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-gray-800 transition-all active:scale-95"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
