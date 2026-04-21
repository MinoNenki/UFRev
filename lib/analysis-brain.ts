export type AnalysisIntent =
  | 'validate_product'
  | 'calculate_profit'
  | 'competitor_analysis'
  | 'extract_data'
  | 'general_analysis';

export function detectIntent(input: string): AnalysisIntent {
  const text = (input || '').toLowerCase();

  if (text.includes('czy warto') || text.includes('czy się sprzeda') || text.includes('worth'))
    return 'validate_product';

  if (text.includes('marż') || text.includes('profit') || text.includes('zarob'))
    return 'calculate_profit';

  if (text.includes('konkurenc') || text.includes('competition'))
    return 'competitor_analysis';

  if (text.includes('wyciągnij') || text.includes('extract') || text.includes('co to jest'))
    return 'extract_data';

  return 'general_analysis';
}

export type FileType = 'image' | 'link' | 'text' | 'unknown';

export function detectFileType({
  websiteUrl,
  content,
  uploadedFiles,
}: {
  websiteUrl?: string;
  content?: string;
  uploadedFiles?: any[];
}): FileType {
  if (websiteUrl) return 'link';

  if (uploadedFiles?.length) {
    const type = uploadedFiles[0]?.type || '';
    if (type.includes('image')) return 'image';
  }

  if (content) return 'text';

  return 'unknown';
}