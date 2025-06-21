import { readFile } from 'fs/promises';
import { fileTypeFromBuffer } from 'file-type';

export async function fileToGenerativePart(path: string) {
  const fileBuffer = await readFile(path);
  const fileType = await fileTypeFromBuffer(fileBuffer);

  if (!fileType) {
    throw new Error(`Could not determine file type for ${path}`);
  }

  return {
    inline_data: {
      mime_type: fileType.mime,
      data: fileBuffer.toString('base64'),
    },
  };
} 