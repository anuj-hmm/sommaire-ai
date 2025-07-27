'use client';
import UploadFormInput from './upload-form-input';
import { z } from 'zod';
import { useUploadThing } from '@/utils/uploadthing';
import { toast } from 'sonner';
import {
  generatePDFSummary,
  storePdfSummaryAction,
} from '@/actions/upload-actions';
import { useState } from 'react';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';

const schema = z.object({
  file: z
    .instanceof(File, { message: 'Invalid file' })
    .refine(
      file => file.size <= 20 * 1024 * 1024,
      'File size must be less than 20MB'
    )
    .refine(
      file => file.type.startsWith('application/pdf'),
      'File must be a PDF'
    ),
});

export default function UploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { startUpload, routeConfig } = useUploadThing('pdfUploader', {
    onClientUploadComplete: () => {
      console.log('uploaded successfully!');
    },
    onUploadError: err => {
      console.error('error occurred while uploading', err);
      toast.error('Error occurred while uploading: ' + err.message);
    },
    onUploadBegin: (fileName: string) => {
      console.log('upload has begun for', fileName);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const formData = new FormData(e.currentTarget);
      const file = formData.get('file') as File;
      //validating the fields
      const validatedFiels = schema.safeParse({ file });
      console.log(validatedFiels);
      if (!validatedFiels.success) {
        toast.error(
          validatedFiels.error.flatten().fieldErrors.file?.[0] ?? 'Invalid file'
        );
        setIsLoading(false);
        return;
      }

      toast.success(
        'Processing PDF - Hang tight! Our AI is reading through your document'
      );

      //upload the file to uploadthing
      const resp = await startUpload([file]);
      if (!resp) {
        toast.error(
          'Error occurred while uploading - Please use a different file'
        );
        setIsLoading(false);
        return;
      }
      toast.success(
        'Processing PDF - Hang tight! Our AI is reading through your document'
      );

      //parse the pdf using lang chain
      const result = await generatePDFSummary(resp);
      const { data = null, message = null } = result || {};
      if (data) {
        let storeResult: any;
        toast.success('Saving PDF - Hang tight! We are saving your summary');

        if (data.summary) {
          storeResult = await storePdfSummaryAction({
            summary: data.summary,
            fileUrl: resp[0].serverData.fileUrl, // Correct property
            title: data.title,
            fileName: file.name,
          });
          //save the summary to the database
          toast.success(
            'Summary Generated - Your PDF has been successfully summarized and saved'
          );

          formRef.current?.reset();
          router.push(`/summaries/${storeResult.data.id}`);
          //redirect to the [id] summary page
        }
      }
      //summarize the pdf using AI
      //save the summary to the dataBase
    } catch (error) {
      setIsLoading(false);
      console.log('Error Occured', error);
      formRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className='flex flex-col gap-8 w-full max-w-2xl mx-auto'>
      <UploadFormInput
        isLoading={isLoading}
        ref={formRef}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
