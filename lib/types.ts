export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface Attachment {
  id: string;
  contentType: string;
  url: string;
  name?: string;
  size?: number;
} 