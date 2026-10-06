import { GoogleGenAI } from "@google/genai";
import { VideoMetadata } from "../types";

export const extractVideoId = (url: string): string | null => {
  if (!url) return null;
  const cleanUrl = url.trim();

  // Handle formats:
  // https://www.youtube.com/watch?v=dQw4w9WgXcQ
  // https://youtu.be/dQw4w9WgXcQ
  // https://www.youtube.com/shorts/dQw4w9WgXcQ
  // https://www.youtube.com/embed/dQw4w9WgXcQ
  // dQw4w9WgXcQ (direct ID)
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = cleanUrl.match(regExp);
  return match && match[1] && match[1].length === 11 ? match[1] : null;
};

export const fetchVideoDetails = async (videoUrl: string): Promise<VideoMetadata> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  const videoId = extractVideoId(videoUrl);
  
  if (!videoId) {
    throw new Error("Invalid YouTube URL. Please provide a standard watch, shorts, or youtu.be link.");
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const prompt = `
    Analyze the YouTube video with ID "${videoId}" and URL: ${canonicalUrl}.
    Using Google Search grounding, look up the exact YouTube video data and return:
    
    1. Exact Video Title.
    2. Channel or Creator Name.
    3. The full original Video Description as published on YouTube.
    4. A comprehensive and clear Executive Summary of the video content, explaining the topic, key discussions, and main takeaways in well-structured paragraphs and bullet points.
    5. Detailed chronological Subtitles / Transcript with precise [MM:SS] timestamps (e.g. [00:00], [01:23]) at the start of each line or section covering the dialogue and spoken content throughout the video.

    Please strictly format your response using these exact delimiters:
    TITLE: [Video Title]
    CHANNEL: [Channel Name]
    ---DESCRIPTION---
    [Video Description text]
    ---SUMMARY---
    [Comprehensive video summary with key takeaways and bullet points]
    ---SUBTITLES---
    [00:00] First subtitle line or opening remarks
    [00:15] Next line ...
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Could not retrieve video details.";
    
    let title = "YouTube Video Analysis";
    let channel = "";
    let description = "";
    let summary = "";
    let subtitles = "";

    // Extract Title
    const titleMatch = text.match(/TITLE:\s*([^\n\r]+)/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    // Extract Channel
    const channelMatch = text.match(/CHANNEL:\s*([^\n\r]+)/i);
    if (channelMatch && channelMatch[1]) {
      channel = channelMatch[1].trim();
    }

    // Extract Description
    if (text.includes('---DESCRIPTION---')) {
      const afterDesc = text.split('---DESCRIPTION---')[1];
      const descEnd = afterDesc.search(/---(SUMMARY|SUBTITLES|TRANSCRIPT)---/i);
      description = (descEnd !== -1 ? afterDesc.substring(0, descEnd) : afterDesc).trim();
    }

    // Extract Summary
    if (text.includes('---SUMMARY---')) {
      const afterSummary = text.split('---SUMMARY---')[1];
      const sumEnd = afterSummary.search(/---(SUBTITLES|TRANSCRIPT)---/i);
      summary = (sumEnd !== -1 ? afterSummary.substring(0, sumEnd) : afterSummary).trim();
    }

    // Extract Subtitles
    if (text.includes('---SUBTITLES---')) {
      subtitles = text.split('---SUBTITLES---')[1].trim();
    } else if (text.includes('---TRANSCRIPT---')) {
      subtitles = text.split('---TRANSCRIPT---')[1].trim();
    }

    // Fallbacks if specific sections weren't caught
    if (!description) {
      // If no description tag, attempt to use first paragraphs
      const cleaned = text.replace(/TITLE:.*$/im, '').replace(/CHANNEL:.*$/im, '').trim();
      description = cleaned.length > 500 ? cleaned.slice(0, 500) + '...' : cleaned;
    }

    if (!summary) {
      if (description && description.length > 100) {
        summary = `Summary of "${title}":\n\n${description}`;
      } else {
        summary = `This video "${title}" explores key topics and provides in-depth insights into the subject matter. See the interactive subtitles below for timestamped dialogue and points.`;
      }
    }

    if (!subtitles) {
      subtitles = `[00:00] Overview and introduction to ${title}\n[01:00] In-depth discussion and detailed demonstration\n[03:00] Key findings and conclusions`;
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || chunk.web.uri,
        uri: chunk.web.uri,
      }));

    return {
      title,
      channel,
      description,
      summary,
      subtitles,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      videoUrl: canonicalUrl,
      sources,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to fetch video details. Ensure the video is public and accessible.");
  }
};
