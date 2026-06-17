import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { content, type, existingCategories } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    let textToAnalyze = content;

    // If it's a URL, try to scrape the text first
    if (type === 'link' || content.startsWith('http')) {
      try {
        const response = await fetch(content, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);
          // Remove scripts, styles, and empty elements
          $('script, style, noscript, iframe, img, svg').remove();
          textToAnalyze = $('body').text().replace(/\s+/g, ' ').trim();
          
          // Truncate to avoid massive payloads (Gemini has large context window, but good practice)
          textToAnalyze = textToAnalyze.substring(0, 30000); 
        }
      } catch (scrapeError) {
        console.error('Failed to scrape URL, falling back to raw URL:', scrapeError);
        // Fallback to just analyzing the URL string
      }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const existingCategoriesPrompt = existingCategories && existingCategories.length > 0
      ? `Existing categories you can choose from if they fit: [${existingCategories.join(', ')}]. If none fit perfectly, create a new one.`
      : '';

    const prompt = `
    Analyze the following content and extract metadata for a "Personal Knowledge Vault" app.
    
    IMPORTANT RULES:
    1. You MUST respond entirely in NATURAL, CONVERSATIONAL THAI language (ภาษาไทยแบบคนคุยกัน เข้าใจง่าย ไม่แข็งเป็นหุ่นยนต์).
    2. 'title': A short, punchy title summarizing the content (in Thai).
    3. 'summary': A 1-2 sentence summary of what this is (in Thai).
    4. 'use_this_when': An array of 1 to 2 SHORT category tags (1-3 words max per tag). 
       ${existingCategoriesPrompt}
       Keep tags very short, like "สูตรอาหาร", "โค้ด", "ไอเดีย", etc. DO NOT use long sentences for tags.
       
    Content:
    """
    ${textToAnalyze}
    """
       
    Respond EXACTLY in this JSON format:
    {
      "title": "string",
      "summary": "string",
      "use_this_when": ["string"]
    }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up potential markdown formatting from AI response
    const cleanJsonString = responseText.replace(/```json\n?|\n?```/g, '').trim();
    
    const parsedData = JSON.parse(cleanJsonString);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Summarize API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process content' },
      { status: 500 }
    );
  }
}
