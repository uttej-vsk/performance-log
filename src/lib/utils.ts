import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { readFile } from 'fs/promises';
import { fileTypeFromBuffer } from 'file-type';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
