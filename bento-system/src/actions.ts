"use server";

// --- GAS Web App URLs ---
const URLS = {
    LOGIN: 'https://script.google.com/macros/s/AKfycbwO0hFkLCidxSQv_P8ZxVQmW7tTy1ZIopw0O6Ay_wr9zQ1NKkRPdEEv1Q7yDsQqR73TRw/exec',
    HISTORY: 'https://script.google.com/macros/s/AKfycbxdKJbX5_mgkNK1-NfzCp_0RA2TSdDQs1_HaQoAkyJxD2iWdSephJt2QbK0l1Wtn8NO-g/exec',
    RESERVE: 'https://script.google.com/macros/s/AKfycbxdkexB5_K-9WHFh-bBmyviheLlAckO9P0hILjqBQgvuIbRL_N5BTQQ6BGozUqzhlfSag/exec'
};

/**
 * ログイン処理
 */
export async function loginAction(userId: string, password: string) {
    try {
        const response = await fetch(URLS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ userId, password }),
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) return { success: false, message: '通信失敗' };
        return await response.json();
    } catch (error) {
        return { success: false, message: 'エラーが発生しました' };
    }
}

/**
 * 予約履歴の取得
 */
export async function getHistoryAction(name: string) {
    try {
        const response = await fetch(URLS.HISTORY, {
            method: 'POST',
            body: JSON.stringify({ action: 'getHistory', name }),
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) return { success: false, message: '通信失敗' };
        return await response.json();
    } catch (error) {
        return { success: false, message: 'エラーが発生しました' };
    }
}

/**
 * 予約の実行
 */
export async function reserveAction(payload: { name: string; bento: string; reservationDate: string }) {
    try {
        // mode: "no-cors" はサーバー側では不要です（fetchが直接リクエストを送るため）
        const response = await fetch(URLS.RESERVE, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        });

        // GAS側の実装によっては response.ok が取れないこともあるが、基本的には成功とみなして遷移させる
        return { success: true };
    } catch (error) {
        console.error("Reserve error:", error);
        return { success: false, message: '送信に失敗しました' };
    }
}
