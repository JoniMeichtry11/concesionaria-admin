export interface UserRole {
  id: string;
  role: 'admin' | 'vendedor';
  full_name: string | null;
  created_at: string;
}
