// import { getDbconnection } from './db';

// export async function getSummaries(userId: string) {
//   const sql = await getDbconnection();
//   const summaries =
//     await sql`SELECT * FROM pdf_summaries WHERE user_id = ${userId} ORDER BY created_at DESC`;
//   return summaries;
// }

// export async function getSummaryById(id: string) {
//   try {
//     const sql = await getDbconnection();
//     const [summary] = await sql`SELECT id,
//         user_id,
//         title,
//         original_file_url,
//         summary_text,
//         word_count,
//         created_at,
//         updated_at,
//         status,
//         file_name,
//         LENGTH(summary_text) - LENGTH(REPLACE(summary_text,' ', '')) + 1 as word_count
//         from pdf_summaries where id = ${id}`;

//     return summary;
//   } catch (err) {
//     console.error('Error fetching summary by id', err);
//     return null;
//   }
// }

// lib/summaries.ts
import { getDbconnection } from './db';

export async function getSummaries(userId: string) {
  const sql = await getDbconnection();
  const summaries = await sql`
    SELECT 
      id,
      user_id,
      title,
      original_file_url as file_url,
      summary_text,
      created_at,
      updated_at,
      status,
      file_name
    FROM pdf_summaries 
    WHERE user_id = ${userId} 
    ORDER BY created_at DESC
  `;
  return summaries;
}

export async function getSummaryById(id: string) {
  try {
    const sql = await getDbconnection();
    const [summary] = await sql`
      SELECT 
        id, 
        user_id, 
        title, 
        original_file_url as file_url, 
        summary_text, 
        created_at, 
        updated_at, 
        status, 
        file_name
      FROM pdf_summaries 
      WHERE id = ${id}
    `;

    if (!summary) return null;

    // Calculate word count client-side
    const word_count = summary.summary_text
      ? summary.summary_text.split(/\s+/).length
      : 0;

    return {
      ...summary,
      word_count,
    };
  } catch (err) {
    console.error('Error fetching summary by id', err);
    return null;
  }
}


export async function getUserUploadCount(userId : string ){
  const sql = await getDbconnection();
  try{
    const [result]= await sql`SELECT COUNT(*) as count FROM pdf_summaries WHERE user_id= ${userId}`;
    return result.count;
  }catch(error){
    console.error('Error fetching user upload count ', error);
    return 0;
  }
}