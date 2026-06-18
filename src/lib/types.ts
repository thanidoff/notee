export type CardType = 'prompt' | 'link' | 'note' | 'tutorial' | 'idea' | 'checklist' | 'uncategorized' | string;
export type CardStatus = 'saved' | 'tried' | 'useful' | 'not_useful' | 'favorite';

export interface CardTab {
  id: string;
  title: string;
  content: string;
}

export interface KnowledgeCard {
  id: string; // UUID
  title: string;
  type: CardType;
  raw_content: string; // Text หรือ URL ต้นฉบับ
  source_url?: string; // ถ้าเป็นลิงก์
  image_urls?: string[]; // Array ของรูปภาพที่แนบ (Base64 หรือ Object URL)
  summary: string; // สรุปโดย AI (หรือข้อความชั่วคราว)
  use_this_when: string[]; // สถานการณ์ที่ใช้
  tags?: string[];
  tabs?: CardTab[]; // แท็บย่อยภายในหน้า Modal
  status: CardStatus;
  ready_to_use_output?: string;
  user_note?: string;
  sort_order?: number;
  created_at: string; // ISO Date String
  updated_at: string;
  last_used_at?: string;
  use_count: number;
}
