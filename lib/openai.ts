import OpenAI from "openai";
const client = new OpenAI({
    apiKey:process.env.OPEN_API_KEY,
});

export async function generateSummaryFromOpenAI(pdfText:string, retryCount = 0){
    try{
        const response = await client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that creates engaging, viral-style summaries of documents using relevant emojis and markdown formatting."
                },
                {
                    role: "user",
                    content: `Transform this text into a viral-style summary using emojis that match the document's context. Format your response in markdown with proper line breaks:\n\n${pdfText}`,
                },
            ],
            temperature:0.7,
            max_tokens: 1500,
        });
        return response.choices[0].message.content;
    }catch(error: any){
        if(error?.status==429 && retryCount < 3){
            // Wait for 2 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            return generateSummaryFromOpenAI(pdfText, retryCount + 1);
        }
        if(error?.status==429){
            throw new Error('Rate limit exceeded. Please try again in a few minutes.');
        }
        throw error;
    }
}
