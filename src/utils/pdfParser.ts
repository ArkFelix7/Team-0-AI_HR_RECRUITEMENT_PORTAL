// @ts-ignore
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';

// Set up the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file."));
      }

      try {
        const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => 'str' in item ? item.str : '').join(' ');
          fullText += pageText + '\n';
        }
        resolve(fullText.trim());
      } catch (error) {
        console.error("Error processing PDF:", error);
        reject(new Error("Could not extract text from PDF. The file might be corrupted or image-based."));
      }
    };

    fileReader.onerror = () => {
      reject(new Error("Error reading file."));
    };

    fileReader.readAsArrayBuffer(file);
  });
};
