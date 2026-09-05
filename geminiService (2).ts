import { GoogleGenAI, Type } from "@google/genai";

// Lưu ý: dùng process.env.API_KEY để đồng bộ với cách vite.config.ts định nghĩa biến này.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface MathProblem {
  question: string;
  type: 'multiple_choice' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export async function generateMathProblem(grade: string, topic: string): Promise<MathProblem> {
  const prompt = `Tạo 1 bài tập môn Toán lớp ${grade}, phần ${topic}. 
  Mức độ: Trung bình đến Khá.
  Yêu cầu:
  - Nếu là trắc nghiệm, cung cấp 4 đáp án A, B, C, D.
  - Nếu là tự luận ngắn, đáp án phải là một con số hoặc biểu thức ngắn gọn.
  - Sử dụng định dạng LaTeX cho các công thức toán học (đặt trong dấu $ hoặc $$).
  - Lời giải chi tiết từng bước.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "Nội dung câu hỏi toán học, sử dụng LaTeX cho công thức (đặt trong dấu $ hoặc $$)" },
          type: { type: Type.STRING, description: "Loại câu hỏi: 'multiple_choice' hoặc 'short_answer'" },
          options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "Các lựa chọn cho câu hỏi trắc nghiệm (nếu có), ví dụ: ['A. 1', 'B. 2', 'C. 3', 'D. 4']. Bắt buộc phải có nếu type là multiple_choice." 
          },
          correctAnswer: { type: Type.STRING, description: "Đáp án đúng (ví dụ: 'A' cho trắc nghiệm, hoặc 'x = 2' cho tự luận)" },
          explanation: { type: Type.STRING, description: "Lời giải chi tiết từng bước, sử dụng LaTeX cho công thức" }
        },
        required: ["question", "type", "correctAnswer", "explanation"]
      },
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Không nhận được phản hồi từ AI.");
  }

  try {
    return JSON.parse(text) as MathProblem;
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Lỗi định dạng dữ liệu từ AI.");
  }
}
