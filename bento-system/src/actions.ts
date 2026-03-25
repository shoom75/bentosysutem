'use server'

import { supabase as supabaseClient } from '@/lib/supabase';

export interface HistoryRecord {
    id: number;
    bento: string;
    date: string;
    status: string;
}

// --- ログイン（生徒・教員共通）---
export async function loginAction(num: string, password?: string) {
    try {
        const studentNum = parseInt(num, 10);
        if (isNaN(studentNum)) return { success: false, error: '学籍番号を数値で入力してください' };
        const { data, error } = await supabaseClient
            .from('user_list')
            .select('id, num, password, building_id, is_root')
            .eq('num', studentNum)
            .eq('password', password)
            .single();
        if (error || !data) return { success: false, error: '学籍番号またはパスワードが違います' };
        return {
            success: true,
            user: {
                id: data.id,
                num: data.num,
                building_id: data.building_id,
                is_root: data.is_root ?? false,
            }
        };
    } catch {
        return { success: false, error: '通信エラーが発生しました' };
    }
}

// --- 履歴取得（有効な予約のみ） ---
export async function getHistoryAction(userId: string) {
    try {
        const studentId = parseInt(userId, 10);
        if (isNaN(studentId)) return { success: false, history: [] };
        const { data, error } = await supabaseClient
            .from('order_log')
            .select('*')
            .eq('student_id', studentId)
            .eq('status', true)
            .order('order_date', { ascending: false });
        if (error) throw error;
        const history: HistoryRecord[] = (data || []).map(item => ({
            id: item.order_id,
            bento: item.bento_type,
            date: item.order_date,
            status: item.status ? '完了' : '未完了'
        }));
        return { success: true, history };
    } catch {
        return { success: false, history: [] };
    }
}

// --- カレンダー用：弁当がある日付一覧をスケジュールテーブルから取得 ---
export async function getScheduleDatesAction(): Promise<{ success: boolean; dates: string[] }> {
    try {
        const now = new Date();
        // 当月初日〜3ヶ月後末日 の範囲で取得
        const from = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString().slice(0, 10);
        const to = new Date(now.getFullYear(), now.getMonth() + 3, 0)
            .toISOString().slice(0, 10);

        const { data, error } = await supabaseClient
            .from('schedule')
            .select('schedule_date')
            .gte('schedule_date', from)
            .lte('schedule_date', to);

        if (error) throw error;
        const dates = [...new Set((data || []).map(r => r.schedule_date as string))];
        return { success: true, dates };
    } catch (e) {
        console.error('getScheduleDatesAction error:', e);
        return { success: true, dates: [] };
    }
}

// --- カレンダー&予約用：期間内の全スケジュールと弁当情報を一括取得 (一括ロード用) ---
export async function getFullBentoScheduleAction() {
    try {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const to = new Date(now.getFullYear(), now.getMonth() + 4, 0).toISOString().slice(0, 10);

        // 1. スケジュール取得
        const { data: schedules, error: schedErr } = await supabaseClient
            .from('schedule')
            .select('schedule_date, bento_id')
            .gte('schedule_date', from)
            .lte('schedule_date', to);

        if (schedErr) throw schedErr;
        if (!schedules || schedules.length === 0) return { success: true, scheduleMap: {} };

        // 2. 弁当一覧取得
        const bentoIds = [...new Set(schedules.map(s => s.bento_id))];
        const { data: bentoInfos, error: bentoErr } = await supabaseClient
            .from('bentoinfo')
            .select('bento_id, bento_name, price, explanation, img_link, allergy_info')
            .in('bento_id', bentoIds)
            .eq('status', true);

        if (bentoErr) throw bentoErr;

        // 3. マップ化
        const bentoMap: Record<number, any> = {};
        (bentoInfos || []).forEach(b => { bentoMap[b.bento_id] = b; });

        const scheduleMap: Record<string, any[]> = {};
        schedules.forEach(s => {
            const bento = bentoMap[s.bento_id];
            if (bento) {
                if (!scheduleMap[s.schedule_date]) scheduleMap[s.schedule_date] = [];
                scheduleMap[s.schedule_date].push(bento);
            }
        });

        return { success: true, scheduleMap };
    } catch (e) {
        console.error('getFullBentoScheduleAction error:', e);
        return { success: false, scheduleMap: {} };
    }
}

// --- 指定日のスケジュール→弁当情報を取得（予約オーバーレイ用） ---
export async function getScheduleBentosForDateAction(dateStr: string) {
    try {
        const { data: schedules, error: schedErr } = await supabaseClient
            .from('schedule')
            .select('bento_id')
            .eq('schedule_date', dateStr);

        if (schedErr) throw schedErr;
        if (!schedules || schedules.length === 0) return { success: true, bentos: [] };

        const bentoIds = schedules.map(s => s.bento_id);
        const { data: bentoInfos, error: bentoErr } = await supabaseClient
            .from('bentoinfo')
            .select('bento_id, bento_name, price, explanation, img_link, allergy_info, status')
            .in('bento_id', bentoIds)
            .eq('status', true);

        if (bentoErr) throw bentoErr;
        return { success: true, bentos: bentoInfos || [] };
    } catch (e) {
        console.error('getScheduleBentosForDateAction error:', e);
        return { success: true, bentos: [] };
    }
}

// --- 本日のスケジュール・弁当情報をSupabaseから取得 ---
export async function getTodayScheduleAction() {
    try {
        const today = new Date();
        // YYYY-MM-DD形式
        const todayStr = today.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).replaceAll('/', '-');

        // scheduleテーブルから本日のエントリを取得
        const { data: schedules, error: schedErr } = await supabaseClient
            .from('schedule')
            .select('schedule_id, bento_id, schedule_date')
            .eq('schedule_date', todayStr);

        if (schedErr) throw schedErr;
        if (!schedules || schedules.length === 0) return { success: true, bentos: [] };

        // bentoinfo テーブルから弁当情報を取得
        const bentoIds = schedules.map(s => s.bento_id);
        const { data: bentoInfos, error: bentoErr } = await supabaseClient
            .from('bentoinfo')
            .select('bento_id, bento_name, price, explanation, img_link, allergy_info, status')
            .in('bento_id', bentoIds)
            .eq('status', true);

        if (bentoErr) throw bentoErr;

        return { success: true, bentos: bentoInfos || [] };
    } catch (e) {
        console.error('getTodayScheduleAction error:', e);
        return { success: true, bentos: [] };
    }
}

// --- 本日の注文（当日受け取り用） ---
export async function getTodayOrderAction(userId: string) {
    try {
        const studentId = parseInt(userId, 10);
        if (isNaN(studentId)) return { success: false, order: null, bentoInfo: null };

        const today = new Date();
        const todayStr = today.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).replaceAll('/', '-');

        // 本日の注文を取得
        const { data: orders, error: orderErr } = await supabaseClient
            .from('order_log')
            .select('*')
            .eq('student_id', studentId)
            .eq('order_date', todayStr)
            .eq('status', true);

        if (orderErr) throw orderErr;
        if (!orders || orders.length === 0) return { success: true, order: null, bentoInfo: null };

        const order = orders[0];

        // scheduleテーブルから本日の弁当IDを取得
        const { data: schedules } = await supabaseClient
            .from('schedule')
            .select('bento_id')
            .eq('schedule_date', todayStr);

        let bentoInfo = null;
        if (schedules && schedules.length > 0) {
            // order_logのbento_typeでbentoInfoを検索（名前一致）
            const { data: bInfo } = await supabaseClient
                .from('bentoinfo')
                .select('bento_id, bento_name, price, explanation, img_link, allergy_info')
                .eq('bento_name', order.bento_type)
                .single();
            bentoInfo = bInfo;
        }

        return {
            success: true,
            order: {
                order_id: order.order_id,
                bento_type: order.bento_type,
                order_date: order.order_date,
                is_received: order.is_received ?? false,
                received_at: order.received_at ?? null,
            },
            bentoInfo,
        };
    } catch (e) {
        console.error('getTodayOrderAction error:', e);
        return { success: false, order: null, bentoInfo: null };
    }
}

// --- 受け取り完了アクション ---
export async function receiveOrderAction(orderId: number) {
    try {
        const now = new Date().toISOString();
        const { error } = await supabaseClient
            .from('order_log')
            .update({ is_received: true, received_at: now })
            .eq('order_id', orderId);
        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error('receiveOrderAction error:', e);
        return { success: false, error: '受け取り処理に失敗しました' };
    }
}

// --- 予約実行・キャンセル・変更（論理削除＋新規挿入） ---
export async function reserveAction(userId: string, bentoType: string, date: string) {
    try {
        const studentId = parseInt(userId, 10);
        if (isNaN(studentId)) return { success: false, message: "不正なユーザーIDです" };

        // 1. その日の有効な予約(status: true)を検索
        const { data: activeOrders, error: fetchError } = await supabaseClient
            .from('order_log')
            .select('*')
            .eq('student_id', studentId)
            .eq('order_date', date)
            .eq('status', true);

        if (fetchError) throw fetchError;

        const currentActive = activeOrders && activeOrders.length > 0 ? activeOrders[0] : null;

        if (currentActive) {
            // 同じ弁当を選んだ場合は「キャンセル」
            if (currentActive.bento_type === bentoType) {
                const { error: cancelErr } = await supabaseClient
                    .from('order_log')
                    .update({ status: false })
                    .eq('order_id', currentActive.order_id);
                if (cancelErr) throw cancelErr;
                return { success: true, message: "予約をキャンセルしました" };
            } else {
                // 違う弁当を選んだ場合は「変更」
                // A. 現在の予約を論理削除
                const { error: deactivateErr } = await supabaseClient
                    .from('order_log')
                    .update({ status: false })
                    .eq('order_id', currentActive.order_id);
                if (deactivateErr) throw deactivateErr;

                // B. 新しい内容で別行として予約を挿入
                const { error: insertErr } = await supabaseClient
                    .from('order_log')
                    .insert([
                        { student_id: studentId, bento_type: bentoType, order_date: date, status: true }
                    ]);
                if (insertErr) throw insertErr;
                return { success: true, message: "予約を変更しました" };
            }
        } else {
            // 有効な予約がない場合は「新規予約」
            const { error: insErr } = await supabaseClient
                .from('order_log')
                .insert([
                    { student_id: studentId, bento_type: bentoType, order_date: date, status: true }
                ]);
            if (insErr) throw insErr;
            return { success: true, message: "予約が完了しました" };
        }
    } catch (error) {
        console.error("reserveAction error:", error);
        return { success: false, message: "処理に失敗しました" };
    }
}

// --- 教員用：全注文一覧取得 ---
export async function getTeacherOrdersAction(targetDate?: string) {
    try {
        const dateStr = targetDate || new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).replaceAll('/', '-');

        const { data: orders, error } = await supabaseClient
            .from('order_log')
            .select('order_id, student_id, bento_type, order_date, is_received, received_at, status')
            .eq('order_date', dateStr)
            .eq('status', true)
            .order('student_id', { ascending: true });

        if (error) throw error;

        // ユーザー情報も取得
        const studentIds = [...new Set((orders || []).map(o => o.student_id))];
        let userMap: Record<number, { num: number; building_id: number }> = {};
        if (studentIds.length > 0) {
            const { data: users } = await supabaseClient
                .from('user_list')
                .select('id, num, building_id')
                .in('id', studentIds);
            (users || []).forEach(u => { userMap[u.id] = { num: u.num, building_id: u.building_id }; });
        }

        // 本日の弁当情報
        const { data: schedules } = await supabaseClient
            .from('schedule')
            .select('bento_id, schedule_date')
            .eq('schedule_date', dateStr);

        const bentoIds = (schedules || []).map(s => s.bento_id);
        let bentoMap: Record<number, { bento_name: string; price: number }> = {};
        if (bentoIds.length > 0) {
            const { data: bentos } = await supabaseClient
                .from('bentoinfo')
                .select('bento_id, bento_name, price')
                .in('bento_id', bentoIds);
            (bentos || []).forEach(b => { bentoMap[b.bento_id] = { bento_name: b.bento_name, price: b.price }; });
        }

        const result = (orders || []).map(o => ({
            order_id: o.order_id,
            student_num: userMap[o.student_id]?.num ?? o.student_id,
            building_id: userMap[o.student_id]?.building_id ?? 0,
            bento_type: o.bento_type,
            order_date: o.order_date,
            is_received: o.is_received ?? false,
            received_at: o.received_at ?? null,
        }));

        return { success: true, orders: result, date: dateStr };
    } catch (e) {
        console.error('getTeacherOrdersAction error:', e)
        return { success: false, orders: [], date: '' }
    }
}