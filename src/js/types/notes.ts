export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  color?: string;
  pinned?: boolean;
}

export interface NoteCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface NotesFilter {
  category?: string;
  tags?: string[];
  searchQuery?: string;
  showPinnedOnly?: boolean;
}

export interface NotesState {
  notes: Note[];
  categories: NoteCategory[];
  filter: NotesFilter;
  selectedNoteId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  color?: string;
}

export interface UpdateNoteRequest {
  id: string;
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  color?: string;
  pinned?: boolean;
}

export interface NotesStorageData {
  notes: Note[];
  categories: NoteCategory[];
  version: number;
}
