export interface User {
  id: number;
  username: string;
  role: string;
  is_banned?: boolean;
  registration_date?: string;
  total_rating?: number;
  profile_photo?: string;
}

export interface Tag {
  idtag: number;
  name: string;
  description?: string;
}

export interface Post {
  idposts: number;
  title: string;
  text: string;
  date: string;
  author_id: number;
  author_name: string;
  tags?: Tag[];
  rating?: number;
  comment_count?: number;
  view_count?: number;
}

export interface Comment {
  idcomments: number;
  text: string;
  author_id: number;
  author_name: string;
  author_role: string;
  parent_id?: number | null;
  date: string;
}

export interface PrivateMessage {
  id: number;
  user_from: number;
  user_to: number;
  sender_name: string;
  text: string;
  date: string;
}
