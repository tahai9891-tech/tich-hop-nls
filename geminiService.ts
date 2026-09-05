import { GoogleGenAI } from "@google/genai";
import { GeneratedNLSContent } from "../types";

// Model chính dùng để gọi Gemini. Nếu Google đổi/khai tử model này,
// chỉ cần sửa đúng 1 chỗ ở đây.
const MODEL_NAME = 'gemini-2.5-flash';

// Các giá trị placeholder thường gặp khi người dùng quên thay API key thật.
const PLACEHOLDER_KEYS = ['MY_GEMINI_API_KEY', 'YOUR_API_KEY', 'undefined', ''];

export const generateCompetencyIntegration = async (prompt: string): Promise<GeneratedNLSContent> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || PLACEHOLDER_KEYS.includes(apiKey)) {
    throw new Error(
      "API Key chưa được cấu hình. Hãy tạo file .env.local ở thư mục gốc dự án với " +
      "nội dung GEMINI_API_KEY=\"key_that_cua_ban\" (lấy tại https://aistudio.google.com/app/apikey), " +
      "sau đó khởi động lại server (npm run dev)."
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.5,
        // Removed responseMimeType: "application/json" to allow free text format
      }
    });

    if (response.text) {
      return parseStructuredResponse(response.text);
    } else {
      throw new Error("Không nhận được phản hồi từ Gemini (có thể nội dung bị chặn bởi bộ lọc an toàn).");
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    const rawMessage: string = error?.message || String(error);
    const status = error?.status || error?.error?.status;
    const code = error?.code || error?.error?.code;

    // 404 "Requested entity was not found" gần như luôn là do API key sai loại
    // (vd: dùng key Vertex AI thay vì key AI Studio) hoặc key/model không có quyền truy cập,
    // chứ không phải do dữ liệu người dùng nhập. Đưa ra hướng dẫn cụ thể thay vì log lỗi thô.
    if (status === 'NOT_FOUND' || code === 404) {
      throw new Error(
        `Không gọi được model "${MODEL_NAME}" (404 NOT_FOUND). Nguyên nhân thường gặp: ` +
        `(1) API key không phải key của Gemini Developer API/AI Studio (vd: nhầm key Vertex AI), ` +
        `(2) key chưa được cấp quyền dùng model này, hoặc (3) key đã bị vô hiệu hoá. ` +
        `Hãy kiểm tra lại key tại https://aistudio.google.com/app/apikey.`
      );
    }

    if (status === 'PERMISSION_DENIED' || code === 403) {
      throw new Error("API key không có quyền truy cập Gemini API. Vui lòng kiểm tra lại key và quyền của project.");
    }

    if (status === 'RESOURCE_EXHAUSTED' || code === 429) {
      throw new Error("Đã vượt giới hạn gọi API (rate limit/quota). Vui lòng thử lại sau ít phút.");
    }

    throw new Error(`Lỗi khi gọi Gemini API: ${rawMessage}`);
  }
};

/**
 * Parses the custom delimited text format into the GeneratedNLSContent object
 */
function parseStructuredResponse(text: string): GeneratedNLSContent {
  const result: GeneratedNLSContent = {
    objectives_addition: "",
    materials_addition: "",
    activities_integration: [],
    appendix_table: ""
  };

  // 1. Parse Objectives
  const objectivesMatch = text.match(/===BAT_DAU_MUC_TIEU===([\s\S]*?)===KET_THUC_MUC_TIEU===/);
  if (objectivesMatch && objectivesMatch[1]) {
    result.objectives_addition = objectivesMatch[1].trim();
  }

  // 2. Parse Materials
  const materialsMatch = text.match(/===BAT_DAU_HOC_LIEU===([\s\S]*?)===KET_THUC_HOC_LIEU===/);
  if (materialsMatch && materialsMatch[1]) {
    result.materials_addition = materialsMatch[1].trim();
  }

  // 3. Parse Appendix
  const appendixMatch = text.match(/===BAT_DAU_PHU_LUC===([\s\S]*?)===KET_THUC_PHU_LUC===/);
  if (appendixMatch && appendixMatch[1]) {
    result.appendix_table = appendixMatch[1].trim();
  }

  // 4. Parse Activities (Complex)
  const activitiesBlockMatch = text.match(/===BAT_DAU_HOAT_DONG===([\s\S]*?)===KET_THUC_HOAT_DONG===/);
  if (activitiesBlockMatch && activitiesBlockMatch[1]) {
    const rawActivities = activitiesBlockMatch[1].split('---PHAN_CACH_HOAT_DONG---');
    
    rawActivities.forEach(block => {
      const anchorMatch = block.match(/ANCHOR:\s*([\s\S]*?)(?=CONTENT:|$)/);
      const contentMatch = block.match(/CONTENT:\s*([\s\S]*?)$/);

      if (anchorMatch && anchorMatch[1] && contentMatch && contentMatch[1]) {
        result.activities_integration.push({
          anchor_text: anchorMatch[1].trim(),
          content: contentMatch[1].trim()
        });
      }
    });
  }

  return result;
}
