'use server'

import { supabase as supabaseClient } from '@/lib/supabase';

export interface HistoryRecord {
    id: number;
    bento_id?: number; // 追加
    bento: string;
    date: string;
    status: string;
    price?: number;
    img_link?: string | null;
    allergy_info?: string | null;
    explanation?: string | null;
}

/**
 * 日本時間 (JST) の今日の日付文字列 (YYYY-MM-DD) を取得するヘルパー
 */
export async function getJSTTodayStr() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
        .toISOString().slice(0, 10);
}

/**
 * Supabase Storage の公開URLを取得するヘルパー
 * imgPath が http:// から始まっていればそのまま、そうでなければ Storage の URL を組み立てる
 */
export async function getBentoImageUrl(imgPath: string | null) {
    if (!imgPath) return null;
    if (imgPath.startsWith('http')) return imgPath;
    
    // バケット名を 'bento-images' と仮定 (実際のバケット名に合わせて調整が必要)
    const { data } = supabaseClient.storage.from('bento-images').getPublicUrl(imgPath);
    return data.publicUrl;
}

/**
 * 重大なエラー(例外)のみを記録するヘルパーアクション
 */
export async function logErrorAction(errorType: string, message: string, detailObj: any = {}, userId: string | null = null, stackTrace: string | null = null) {
    try {
        const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'ServerAction';
        const url = typeof window !== 'undefined' ? window.location.href : 'unknown';
        await supabaseClient.from('error_logs').insert([
            {
                student_id: userId,
                error_type: errorType,
                message: message,
                stack_trace: stackTrace,
                details: detailObj,
                user_agent: userAgent,
                url: url
            }
        ]);
    } catch (e) {
        console.error('Error logging itself failed:', e);
    }
}

// --- ログイン（生徒・教員共通）---
export async function loginAction(num: string, password?: string) {
    try {
        const studentNum = parseInt(num, 10);
        if (isNaN(studentNum)) return { success: false, error: '学籍番号を数値で入力してください' };

        // まず user_list から学籍番号に対応するメールアドレスを取得
        const { data: userData, error: userError } = await supabaseClient
            .from('user_list')
            .select('id, num, email, building_id, is_root, auth_id')
            .eq('num', studentNum)
            .single();

        if (userError || !userData || !userData.email) {
            return { success: false, error: '学籍番号またはパスワードが違います' };
        }

        // Supabase Auth でメールアドレスとパスワードによる認証
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: userData.email,
            password: password || '',
        });

        // パスワード間違いなどのエラー
        if (authError || !authData.user) {
            return { success: false, error: '学籍番号またはパスワードが違います' };
        }

        return {
            success: true,
            user: {
                id: userData.id,
                num: userData.num,
                building_id: userData.building_id,
                is_root: userData.is_root ?? false,
            },
            session: authData.session
        };
    } catch (e) {
        await logErrorAction('LOGIN_FETCH_ERROR', String(e), { num });
        return { success: false, error: '通信エラーが発生しました' };
    }
}

// --- サインアップ ---
export async function signupAction(formData: {
    num: number;
    password: string;
    email: string;
    building_id: number;
    school_year: number;
    class: string;
    attendance_num: number;
    secret_answer: string;
}) {
    try {
        // 年度（Fiscal Year）計算：4月開始〜翌3月終了
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12
        const fiscalYear = currentMonth < 4 ? currentYear - 1 : currentYear;

        // すでに一致する学生データがあるか確認
        const { data: existing, error: findErr } = await supabaseClient
            .from('user_list')
            .select('id, building_id, auth_id')
            .eq('num', formData.num)
            .eq('fiscal_year', fiscalYear)
            .eq('school_year', formData.school_year)
            .eq('class', formData.class)
            .eq('attendance_num', formData.attendance_num)
            .maybeSingle();

        if (findErr) {
            console.error('Find student error:', findErr);
            return { success: false, error: 'データの照合に失敗しました' };
        }

        if (!existing) {
            return { success: false, error: '入力された情報に一致する学生が見つかりませんでした。入力内容（年度、番号など）に誤りがないかご確認ください。' };
        }

        if (existing.auth_id) {
            return { success: false, error: 'このアカウントは既に登録されています。ログインしてください。' };
        }

        // Supabase Auth にユーザーを作成
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                emailRedirectTo: `${siteUrl}/auth/confirm?next=/login`,
            }
        });

        if (authError || !authData.user) {
            console.error('Auth signup error:', authError);
            return { success: false, error: '認証アカウントの作成に失敗しました: ' + (authError?.message || '') };
        }

        // user_list のレコードに auth_id, email, building_id, secret_answer を紐付け (password は今後保存しない)
        const { data, error } = await supabaseClient
            .from('user_list')
            .update({
                auth_id: authData.user.id,
                email: formData.email,
                building_id: formData.building_id,
                secret_answer: formData.secret_answer
            })
            .eq('id', existing.id)
            .select()
            .single();

        if (error) {
            console.error('Signup update error details:', error);
            return { success: false, error: `アカウント紐付けに失敗しました: ${error.message} (おそらくRLSか制約によるエラーです)` };
        }

        return {
            success: true,
            user: {
                id: data.id,
                num: data.num,
                building_id: data.building_id,
                is_root: data.is_root ?? false,
            },
            session: authData.session
        };
    } catch (e) {
        console.error('Signup catch error:', e);
        return { success: false, error: '通信エラーが発生しました' };
    }
}

// --- 履歴取得（有効な予約のみ） ---
export async function getHistoryAction(userId: string) {
    try {
        const studentId = parseInt(userId, 10);
        if (isNaN(studentId)) return { success: false, history: [] };
        
        // 1. 注文履歴を取得 (bento_idも取得)
        const { data: orders, error: orderErr } = await supabaseClient
            .from('order_log')
            .select('order_id, bento_type, order_date, status, bento_id')
            .eq('student_id', studentId)
            .eq('status', true)
            .order('order_date', { ascending: false });
            
        if (orderErr) {
            console.error('getHistoryAction DB error:', orderErr);
            return { success: false, history: [], error: 'データベース接続エラー' };
        }
        if (!orders || orders.length === 0) return { success: true, history: [] };

        // 2. お弁当の詳細情報を一括取得（bento_idで照合）
        const bentoIds = [...new Set(orders.map((o: any) => o.bento_id).filter((id: any) => id != null))];
        const { data: bentoInfos } = await supabaseClient
            .from('bentoinfo')
            .select('bento_id, bento_name, price, img_link, allergy_info, explanation')
            .in('bento_id', bentoIds);

        // IDをキーにしたマップを作成
        const bentoMap: Record<number, any> = {};
        if (bentoInfos) {
            for (const b of bentoInfos) {
                // ここで Storage URL を解決
                b.img_link = await getBentoImageUrl(b.img_link);
                bentoMap[b.bento_id] = b;
            }
        }

        // 3. データを結合して返却
        const history: HistoryRecord[] = orders.map((item: any) => {
            const detail = item.bento_id ? bentoMap[item.bento_id] : null;
            return {
                id: item.order_id,
                bento_id: item.bento_id,
                bento: detail?.bento_name || item.bento_type,
                date: item.order_date,
                status: item.status ? '完了' : '未完了',
                price: detail?.price,
                img_link: detail?.img_link,
                allergy_info: detail?.allergy_info,
                explanation: detail?.explanation
            };
        });
        
        return { success: true, history };
    } catch (e) {
        console.error('getHistoryAction error:', e);
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

        const todayStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
            .toISOString().slice(0, 10);

        // 本日の注文を取得 (bento_idも取得するようにselectを修正)
        const { data: orders, error: orderErr } = await supabaseClient
            .from('order_log')
            .select('order_id, bento_type, bento_id, order_date, is_received, received_at')
            .eq('student_id', studentId)
            .eq('order_date', todayStr)
            .eq('status', true);

        if (orderErr) throw orderErr;
        if (!orders || orders.length === 0) return { success: true, order: null, bentoInfo: null };

        const order = orders[0];

        // bento_id を使ってお弁当の詳細情報を確実に取得
        let bentoInfo = null;
        if (order.bento_id) {
            const { data: bInfo } = await supabaseClient
                .from('bentoinfo')
                .select('bento_id, bento_name, price, explanation, img_link, allergy_info')
                .eq('bento_id', order.bento_id)
                .single();
            if (bInfo) bInfo.img_link = await getBentoImageUrl(bInfo.img_link);
            bentoInfo = bInfo;
        } else {
            // 万が一 bento_id が無い場合のみ、名前で検索（旧データ対応）
            const { data: bInfo } = await supabaseClient
                .from('bentoinfo')
                .select('bento_id, bento_name, price, explanation, img_link, allergy_info')
                .eq('bento_name', order.bento_type)
                .single();
            if (bInfo) bInfo.img_link = await getBentoImageUrl(bInfo.img_link);
            bentoInfo = bInfo;
        }

        return {
            success: true,
            order: {
                order_id: order.order_id,
                bento_id: order.bento_id,
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
        await logErrorAction('ORDER_RECEIVED_ERROR', String(e), { orderId });
        return { success: false, error: '受け取り処理に失敗しました' };
    }
}


// --- 予約実行・キャンセルアクション ---
export async function reserveAction(studentId: string, bentoId: number, bentoName: string, date: string) {
    try {
        const sid = parseInt(studentId, 10);
        if (isNaN(sid)) return { success: false, message: "無効なユーザーIDです" };

        // 同じ日付の有効な予約を確認
        const { data: existing } = await supabaseClient
            .from("order_log")
            .select("order_id, bento_id")
            .eq("student_id", sid)
            .eq("order_date", date)
            .eq("status", true)
            .maybeSingle();

        const currentActive = existing;
        if (currentActive) {
            // 同じ弁当を選んだ場合は「キャンセル」 (bento_idで比較)
            if (currentActive.bento_id === bentoId) {
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

                // B. 新しい内容で別行として予約を挿入 (bento_idも保存)
                const { error: insertErr } = await supabaseClient
                    .from('order_log')
                    .insert([
                        { student_id: studentId, bento_id: bentoId, bento_type: bentoName, order_date: date, status: true }
                    ]);
                if (insertErr) throw insertErr;
                return { success: true, message: "予約を変更しました" };
            }
        } else {
            // 有効な予約がない場合は「新規予約」
            const { error: insErr } = await supabaseClient
                .from('order_log')
                .insert([
                    { student_id: studentId, bento_id: bentoId, bento_type: bentoName, order_date: date, status: true }
                ]);
            if (insErr) throw insErr;
            return { success: true, message: "予約が完了しました" };
        }
    } catch (error) {
        console.error("reserveAction error:", error);
        await logErrorAction('RESERVE_EXCEPTION', String(error), { bentoId, bentoName, date }, studentId);
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

        // ユーザー情報を取得
        const studentIds = [...new Set((orders || []).map(o => o.student_id))];
        let userMap: Record<number, { num: number; building_id: number }> = {};
        if (studentIds.length > 0) {
            const { data: users } = await supabaseClient
                .from('user_list')
                .select('id, num, building_id')
                .in('id', studentIds);
            (users || []).forEach(u => { userMap[u.id] = { num: u.num, building_id: u.building_id }; });
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

// --- 今後の予約集計取得 ---
export async function getFutureSummaryAction(buildingId?: number) {
    try {
        const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).replaceAll('/', '-');

        // 有効な将来の注文を取得
        const { data: orders, error: orderErr } = await supabaseClient
            .from('order_log')
            .select('order_date, bento_type, student_id')
            .gte('order_date', today)
            .eq('status', true);

        if (orderErr) throw orderErr;
        if (!orders || orders.length === 0) return { success: true, summary: [] };

        // 建物フィルタリングが必要な場合はユーザー情報を取得して紐付ける
        let filteredOrders = orders;
        if (buildingId !== undefined) {
            const studentIds = [...new Set(orders.map(o => o.student_id))];
            const { data: users, error: userErr } = await supabaseClient
                .from('user_list')
                .select('id, building_id')
                .in('id', studentIds)
                .eq('building_id', buildingId);
            
            if (userErr) throw userErr;
            const validUserIds = new Set((users || []).map(u => u.id));
            filteredOrders = orders.filter(o => validUserIds.has(o.student_id));
        }

        // 集計
        const summary: Record<string, Record<string, number>> = {};
        
        filteredOrders.forEach(o => {
            const date = o.order_date;
            const type = o.bento_type;
            if (!summary[date]) summary[date] = {};
            summary[date][type] = (summary[date][type] || 0) + 1;
        });

        // 日付順にソートして配列化
        const sortedDates = Object.keys(summary).sort();
        const result = sortedDates.map(date => ({
            date,
            counts: summary[date]
        }));

        return { success: true, summary: result };
    } catch (e) {
        console.error('getFutureSummaryAction error:', e);
        return { success: false, summary: [] };
    }
}

// --- ユーザープロフィール取得アクション ---
export async function getProfileAction(userId: string) {
    try {
        const studentId = parseInt(userId, 10);
        if (isNaN(studentId)) return { success: false, profile: null };

        const { data: user, error } = await supabaseClient
            .from('user_list')
            .select('num, email, building_id, secret_answer')
            .eq('id', studentId)
            .single();

        if (error || !user) throw error;

        return { success: true, profile: user };
    } catch (e) {
        console.error('getProfileAction error:', e);
        return { success: false, profile: null };
    }
}

// --- 合言葉更新用アクション ---
export async function updateSecretAnswerAction(userId: string, newSecretAnswer: string) {
    try {
        const studentId = parseInt(userId, 10);
        if (isNaN(studentId)) return { success: false, error: 'ユーザーIDが不正です' };

        const { error } = await supabaseClient
            .from('user_list')
            .update({ secret_answer: newSecretAnswer })
            .eq('id', studentId);

        if (error) throw error;
        
        return { success: true };
    } catch (e) {
        console.error('updateSecretAnswerAction error:', e);
        return { success: false, error: '合言葉の更新に失敗しました' };
    }
}

// --- パスワードリセット用アクション（管理者権限使用） ---
export async function resetPasswordWithSecretAction(num: string, secretAnswer: string, newPassword: keyof any) {
    try {
        const studentNum = parseInt(num, 10);
        if (isNaN(studentNum)) return { success: false, error: '学籍番号を正しく入力してください' };

        // 1. 学籍番号と合言葉でユーザーを照合
        const { data: user, error: findErr } = await supabaseClient
            .from('user_list')
            .select('id, auth_id, secret_answer')
            .eq('num', studentNum)
            .single();

        if (findErr || !user) {
            return { success: false, error: '入力された情報が一致しません' };
        }

        // 合言葉の照合
        if (user.secret_answer !== secretAnswer.trim()) {
            return { success: false, error: '入力された情報が一致しません' };
        }

        if (!user.auth_id) {
            return { success: false, error: 'このアカウントはまだ認証基盤に紐づいていません' };
        }

        // 2. マスターキーを使ってAdminクライアントを作成
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is perfectly missing!');
            return { success: false, error: 'サーバーの設定エラー：マスターキーが設定されていません' };
        }

        const { createClient } = await import('@supabase/supabase-js');
        const adminAuthClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 3. パスワードを強制アップデート
        const { error: updateErr } = await adminAuthClient.auth.admin.updateUserById(
            user.auth_id,
            { password: newPassword as string }
        );

        if (updateErr) {
            console.error('Password reset update error:', updateErr);
            return { success: false, error: 'パスワードの変更に失敗しました' };
        }

        return { success: true };
    } catch (e) {
        console.error('resetPasswordWithSecretAction error:', e);
        return { success: false, error: '通信エラーが発生しました' };
    }
}

// --- 注文キャンセルアクション（履歴画面用） ---
export async function cancelOrderAction(orderId: number) {
    try {
        // 1. 注文データを取得して日付をチェック
        const { data: order, error: findErr } = await supabaseClient
            .from('order_log')
            .select('order_date')
            .eq('order_id', orderId)
            .single();

        if (findErr || !order) return { success: false, error: '注文が見つかりませんでした' };

        // 2. 当日かどうかチェック (日本時間基準)
        const todayStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
            .toISOString().slice(0, 10);

        if (order.order_date <= todayStr) {
            return { success: false, error: '当日および過去の予約はキャンセルできません' };
        }

        // 3. ステータスを false に更新
        const { error: updateErr } = await supabaseClient
            .from('order_log')
            .update({ status: false })
            .eq('order_id', orderId);

        if (updateErr) throw updateErr;

        return { success: true };
    } catch (e) {
        console.error('cancelOrderAction error:', e);
        await logErrorAction('ORDER_CANCEL_ERROR', String(e), { orderId });
        return { success: false, error: 'キャンセル処理に失敗しました' };
    }
}


