import { supabase } from "./supabase";

export interface LeadPayload {
  name: string;
  phone: string;
  address: string;
  service_type: string;
  size: number;
  date: string; // YYYY-MM-DD
  ref_channel?: string | null;
}

export interface InsertLeadResult {
  success: boolean;
  error?: string;
}

/**
 * leads 테이블에 새 리드를 INSERT합니다.
 * 네트워크 오류 및 Supabase 에러를 모두 처리하여
 * 항상 { success, error? } 형태로 반환합니다.
 */
export async function insertLead(payload: LeadPayload): Promise<InsertLeadResult> {
  try {
    const { error } = await supabase.from("leads").insert({
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      address: payload.address.trim(),
      service_type: payload.service_type,
      size: payload.size,
      date: payload.date,
      status: "pending",
      ref_channel: payload.ref_channel ?? null,
    });

    if (error) {
      console.error("[leads] Supabase insert error:", error);

      // Supabase 에러 코드별 사용자 친화적 메시지
      if (error.code === "23505") {
        return { success: false, error: "이미 동일한 번호로 신청된 내역이 있어요." };
      }
      if (error.code === "42501") {
        return { success: false, error: "접근 권한이 없어요. 잠시 후 다시 시도해주세요." };
      }

      return { success: false, error: "저장 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." };
    }

    return { success: true };
  } catch (err) {
    console.error("[leads] Unexpected error:", err);
    return {
      success: false,
      error: "네트워크 오류가 발생했어요. 인터넷 연결을 확인하고 다시 시도해주세요.",
    };
  }
}
