export interface Metadata {
  title: string | null;
  author: string | null;
  date_published: string | null;
  dek: string | null;
  lead_image_url: string | null;
}

export interface ArchiveResult {
  metadata: Metadata;
  markdown: string;
  media: string[];
  links: string[];
  warcPath: string;
}
