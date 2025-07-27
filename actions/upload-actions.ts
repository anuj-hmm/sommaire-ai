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
  uploadResponse: [
    {
      serverData: {
        urlID: string;
        fileUrl: string;
        fileName: string;
      };
    }
  ]
) {
  if (!uploadResponse) {
    return {
      success: false,
      message: 'File upload failed',
      data: null,
    };
  }

  const {
    serverData: { urlID, fileUrl: pdfUrl, fileName: pdfName },
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
    let summary: string | null = null;
    try {
      summary = await generateSummaryFromOpenAI(pdfText);
      console.log({ summary });
    } catch (error: any) {
      console.error('Error generating summary:', error);
      // If it's a rate limit error, provide a more helpful message
      // if(error.message?.includes('Rate limit exceeded')){
      //     // Generate a simple fallback summary
      //     const fallbackSummary = generateFallbackSummary(pdfText);
      //     return {
      //         success:true,
      //         message:'API rate limit reached, but here\'s a basic summary of your document.',
      //         data:fallbackSummary,
      //         error: 'RATE_LIMIT_FALLBACK'
      //     }
      // return {
      //     success:false,
      //     message:'Failed to generate summary. Please try again.',
      //     data:null,
      //     error: 'API_ERROR'
      // }

      //call gemini
      if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
        try {
          summary = await generateSummaryFromOpenAI(pdfText);
        } catch (geminiError) {
          console.error(
            'Gemini API failed after OpenAI quote exceeded',
            geminiError
          );
          throw new Error(
            'Failed to generate summary with available Ai providers'
          );
        }
      }
    }
    if (!summary) {
      return {
        success: false,
        message: 'No summary was generated. Please try again.',
        data: null,
      };
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
    return {
      success: false,
      message: 'File upload failed',
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
  // sql inserting pdf summary
  try {
    const sql = await getDbconnection();
    const [savedSummary] = await sql`INSERT INTO 
    pdf_summaries (
    user_id,
    original_file_url,
    summary_text,
    title,
    file_name
)
VALUES
  (
  ${userId},
  ${fileUrl},
  ${summary},
  ${title},
  ${fileName}
  )RETURNING id,summary_text`;
    return savedSummary;
  } catch (error) {
    console.log('Error saving PDF summary', error);
    throw error;
  }
}

export async function storePdfSummaryAction({
  fileUrl,
  summary,
  title,
  fileName,
}: PdfSummaryType) {
  //user is logged in and has a userID
  //savePdfSummary
  //savePdfSummary()
  let savedSummary: any;
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    savedSummary = await savePdfSummary({
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
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Error saving PDF summary',
    };
  }

  //Revalidate our cache
  revalidatePath(`/summaries/${savedSummary.id}`);

  return {
    success: true,
    message: 'PDF summary saved successfully',
    data: {
      id: savedSummary.id,
    },
  };
}
