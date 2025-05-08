export interface Metadata {
  title: string | null;
  author: string | null;
  date_published: string | null;
  dek: string | null;
}

export interface ArchiveResult {
  metadata: Metadata;
  markdownPath: string;
  media: string[];
  links: string[];
  warcPath: string;
}
