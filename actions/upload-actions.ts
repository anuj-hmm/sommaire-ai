'use server';
import { fetchAndExtractPdfText } from '@/lib/langchain';
import { generateSummaryFromOpenAI } from '@/lib/openai';
import { generateSummaryFromGemini } from '@/lib/geminiai';
import { auth } from '@clerk/nextjs/server';
import { getDbconnection } from '@/lib/db';
import { formatFileNameAsTitle } from '@/utils/format.utils';
import { revalidatePath } from 'next/cache';

interface PdfSummaryType {
  fileUrl: string;
  summary: string;
  title: string;
  fileName: string;
}

function generateFallbackSummary(text: string): string {
  // Simple fallback summary generation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const firstFewSentences = sentences.slice(0, 3);
  const wordCount = text.split(/\s+/).length;

  return `# 📄 Document Summary (Basic)

## 📊 Document Statistics
- **Word Count**: ${wordCount} words
- **Key Points**: ${firstFewSentences.length} main ideas identified

## 📝 Key Content
${firstFewSentences
  .map((sentence, index) => `${index + 1}. ${sentence.trim()}`)
  .join('\n')}

## ⚠️ Note
This is a basic summary generated due to API rate limits. For a more detailed AI-powered summary, please try again in a few minutes.`;
}

export async function generatePDFSummary(
  uploadResponse: {
    serverData: {
      urlID: string;
      fileUrl: string;
      fileName: string;
    };
  }[]
) {
  if (!uploadResponse || uploadResponse.length === 0) {
    return {
      success: false,
      message: 'File upload failed',
      data: null,
    };
  }

  const {
    serverData: { fileUrl: pdfUrl, fileName: pdfName },
  } = uploadResponse[0];
  
  if (!pdfUrl) {
    return {
      success: false,
      message: 'File upload failed',
      data: null,
    };
  }

  try {
    const pdfText = await fetchAndExtractPdfText(pdfUrl);
    console.log({ pdfText });
    
    let summary: string;
    try {
      const geminiResult = await generateSummaryFromGemini(pdfText);
      summary = typeof geminiResult === 'function' ? geminiResult() : geminiResult;
      console.log({ summary });
    } catch (error) {
      console.error('Error generating summary:', error);
      
      // If it's a rate limit error, try OpenAI first
      if (error instanceof Error && error.message?.includes('RATE_LIMIT_EXCEEDED')) {
        try {
          summary = (await generateSummaryFromOpenAI(pdfText)) ?? generateFallbackSummary(pdfText);
        } catch (openAIError) {
          console.error('OpenAI API failed after Gemini rate limit exceeded', openAIError);
          // Use fallback summary if both APIs fail
          summary = generateFallbackSummary(pdfText);
        }
      } else {
        // For other errors, use fallback
        summary = generateFallbackSummary(pdfText);
      }
    }

    const formattedFileName = formatFileNameAsTitle(pdfName);

    return {
      success: true,
      message: 'Summary generated successfully',
      data: {
        title: formattedFileName,
        summary,
      },
    };
  } catch (error) {
    console.error('Error in generatePDFSummary:', error);
    return {
      success: false,
      message: 'Failed to process PDF',
      data: null,
    };
  }
}

async function savePdfSummary({
  userId,
  fileUrl,
  summary,
  title,
  fileName,
}: {
  userId: string;
  fileUrl: string;
  summary: string;
  title: string;
  fileName: string;
}) {
  try {
    const sql = await getDbconnection();
    const [savedSummary] = await sql`
      INSERT INTO pdf_summaries (
        user_id,
        original_file_url,
        summary_text,
        title,
        file_name
      )
      VALUES (
        ${userId},
        ${fileUrl},
        ${summary},
        ${title},
        ${fileName}
      )
      RETURNING id, summary_text
    `;
    return savedSummary;
  } catch (error) {
    console.error('Error saving PDF summary', error);
    throw error;
  }
}

export async function storePdfSummaryAction({
  fileUrl,
  summary,
  title,
  fileName,
}: PdfSummaryType) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const savedSummary = await savePdfSummary({
      userId,
      fileUrl,
      summary,
      title,
      fileName,
    });

    if (!savedSummary) {
      return {
        success: false,
        message: 'Failed to save PDF summary, please try again...',
      };
    }

    // Revalidate our cache
    revalidatePath(`/summaries/${savedSummary.id}`);

    return {
      success: true,
      message: 'PDF summary saved successfully',
      data: {
        id: savedSummary.id,
      },
    };
  } catch (error) {
    console.error('Error in storePdfSummaryAction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error saving PDF summary',
    };
  }
}