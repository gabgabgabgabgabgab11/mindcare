import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ArchiveRestore, ArrowLeft, BookHeart, Camera, FolderPlus, ImagePlus, NotebookPen, Search, Sparkles, Sticker, X } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CompanionHeader } from '../components/CompanionHeader';
import {
  createJournalEntry,
  createJournalFolder,
  deleteJournalFolder,
  getJournalAnalysis,
  getJournalEntry,
  getPrivacySettings,
  listJournalEntries,
  listJournalFolders,
  listWellnessCheckIns,
  setJournalEntryArchived,
  updateJournalEntry,
  updateJournalFolder,
} from '../services/studentApi';
import { studentCache } from '../services/studentCache';
import { getActivityStreak, queueStreakCelebration } from '../utils/activityStreak';
import type { JournalAnalysis, JournalDecoration, JournalEntry, JournalFolder, WellnessCheckInResponse } from '../types';

type NotebookTheme = 'paper' | 'sage' | 'lavender';
type PaperType = 'ruled' | 'dotted' | 'grid' | 'blank';
type SortOrder = 'newest' | 'oldest' | 'title';

const STICKERS = ['🌿', '✨', '💛', '🌙', '🌼', '🫧', '🐈', '🎀', '☁️', '🍓', '🪴', '🦋'];
const NOTEBOOK_THEMES: Record<NotebookTheme, string> = {
  paper: 'bg-[#fffdf7] dark:bg-slate-900',
  sage: 'bg-[#f1f7f1] dark:bg-[#172622]',
  lavender: 'bg-[#f7f3ff] dark:bg-[#211d2d]',
};

const createDecoration = (kind: JournalDecoration['kind'], value: string): JournalDecoration => ({
  id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  kind,
  value,
});

const compressPhoto = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Choose a photo smaller than 12 MB.');

  if (file.type === 'image/gif') {
    if (file.size > 700 * 1024) throw new Error('Choose a GIF smaller than 700 KB so it can stay animated in your journal.');
    const gifDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('This GIF could not be read.'));
      reader.onerror = () => reject(new Error('This GIF could not be read.'));
      reader.readAsDataURL(file);
    });
    if (gifDataUrl.length > 1_100_000) throw new Error('This GIF is too large to save. Try a smaller GIF.');
    return gifDataUrl;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This photo could not be prepared.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('This photo could not be prepared.')), 'image/jpeg', 0.76);
  });
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('This photo could not be read.'));
    reader.onerror = () => reject(new Error('This photo could not be read.'));
    reader.readAsDataURL(blob);
  });
  if (dataUrl.length > 1_100_000) throw new Error('This photo is still too large after compression. Try another photo.');
  return dataUrl;
};

const titleFor = (page: JournalEntry) => page.title?.trim() || page.content.split(/\r?\n/)[0].slice(0, 55) || 'Untitled page';

const appendCanvasText = (canvas: HTMLElement, value: string) => {
  const lines = value.split('\n');
  lines.forEach((line, index) => {
    if (line) canvas.appendChild(document.createTextNode(line));
    if (index < lines.length - 1) canvas.appendChild(document.createElement('br'));
  });
};

const readCanvas = (canvas: HTMLElement) => {
  let content = '';
  const positions = new Map<string, number>();
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      content += node.textContent ?? '';
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === 'IMG') {
      const decorationId = node.dataset.journalDecorationId;
      if (decorationId) positions.set(decorationId, content.length);
      return;
    }
    if (node.tagName === 'BR') {
      content += '\n';
      return;
    }
    const isBlock = node.tagName === 'DIV' || node.tagName === 'P';
    if (isBlock && content && !content.endsWith('\n')) content += '\n';
    node.childNodes.forEach(visit);
  };
  canvas.childNodes.forEach(visit);
  return { content, positions };
};

const makeInlineImage = (decoration: JournalDecoration) => {
  const image = document.createElement('img');
  image.src = decoration.value;
  image.alt = 'Inline image in journal entry';
  image.dataset.journalDecorationId = decoration.id;
  image.contentEditable = 'false';
  image.className = 'mx-1 inline-block max-h-36 max-w-40 align-middle rounded-lg border-2 border-white object-cover shadow-md';
  return image;
};

export const Journal = () => {
  const navigate = useNavigate();
  const photoInput = useRef<HTMLInputElement>(null);
  const notebookCoverInput = useRef<HTMLInputElement>(null);
  const editorCanvasRef = useRef<HTMLDivElement>(null);
  const inlineSelectionRef = useRef<Range | null>(null);
  const editorInitialDataRef = useRef({ entry: '', decorations: [] as JournalDecoration[] });
  const [entry, setEntry] = useState('');
  const [title, setTitle] = useState('');
  const [decorations, setDecorations] = useState<JournalDecoration[]>([]);
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [folders, setFolders] = useState<JournalFolder[]>([]);
  const [editorFolderId, setEditorFolderId] = useState<string>('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArchived, setEditingArchived] = useState(false);
  const [folderFilter, setFolderFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [searchText, setSearchText] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<JournalFolder['cover_color']>('sage');
  const [newFolderCoverImage, setNewFolderCoverImage] = useState<string | null>(null);
  const [folderCoverTarget, setFolderCoverTarget] = useState<string | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<JournalFolder | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [paperType, setPaperType] = useState<PaperType>(() => {
    const saved = window.localStorage.getItem('mindcare-notebook-paper-type');
    return saved === 'dotted' || saved === 'grid' || saved === 'blank' ? saved : 'ruled';
  });
  const [notebookTheme, setNotebookTheme] = useState<NotebookTheme>(() => {
    const saved = window.localStorage.getItem('mindcare-notebook-theme');
    return saved === 'sage' || saved === 'lavender' ? saved : 'paper';
  });
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [analysis, setAnalysis] = useState<JournalAnalysis | null>(null);
  const [journalInsightsEnabled, setJournalInsightsEnabled] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    listJournalEntries()
      .then(setPastEntries)
      .catch(() => setSaveError('Journal entries could not be loaded.'))
      .finally(() => setIsLoadingEntries(false));
    listJournalFolders()
      .then(setFolders)
      .catch(() => setSaveError('Notebook folders could not be loaded.'));
    getPrivacySettings()
      .then((settings) => setJournalInsightsEnabled(settings.journal_insights_enabled))
      .catch(() => setJournalInsightsEnabled(false));
  }, []);

  useEffect(() => {
    window.localStorage.setItem('mindcare-notebook-theme', notebookTheme);
  }, [notebookTheme]);

  useEffect(() => {
    window.localStorage.setItem('mindcare-notebook-paper-type', paperType);
  }, [paperType]);

  useEffect(() => {
    editorInitialDataRef.current = { entry, decorations };
  }, [entry, decorations]);

  useEffect(() => {
    const canvas = editorCanvasRef.current;
    if (!isEditorOpen || !canvas) return;
    const initialData = editorInitialDataRef.current;
    canvas.replaceChildren();
    const inlineImages = initialData.decorations
      .filter((decoration) => decoration.kind === 'photo' && decoration.position !== undefined)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    let textOffset = 0;
    inlineImages.forEach((decoration) => {
      const position = Math.max(textOffset, Math.min(initialData.entry.length, decoration.position ?? initialData.entry.length));
      appendCanvasText(canvas, initialData.entry.slice(textOffset, position));
      canvas.appendChild(makeInlineImage(decoration));
      textOffset = position;
    });
    appendCanvasText(canvas, initialData.entry.slice(textOffset));
  }, [isEditorOpen, editingEntryId]);

  const visibleEntries = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase();
    const results = pastEntries.filter((page) => {
      if (Boolean(page.is_archived) !== showArchived) return false;
      if (folderFilter === 'unfiled' && page.folder_id) return false;
      if (folderFilter !== 'all' && folderFilter !== 'unfiled' && page.folder_id !== folderFilter) return false;
      if (normalizedSearch && !`${titleFor(page)} ${page.content}`.toLocaleLowerCase().includes(normalizedSearch)) return false;
      return true;
    });
    return results.sort((a, b) => {
      if (sortOrder === 'title') return titleFor(a).localeCompare(titleFor(b));
      const dateDelta = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? -dateDelta : dateDelta;
    });
  }, [folderFilter, pastEntries, searchText, showArchived, sortOrder]);

  const clearEditor = () => {
    setIsEditorOpen(false);
    setEntry('');
    setTitle('');
    setDecorations([]);
    setEditorFolderId('');
    setEditingEntryId(null);
    setEditingArchived(false);
    setShowStickerPicker(false);
  };

  const handleNewPage = () => {
    clearEditor();
    setEditorFolderId(folderFilter !== 'all' && folderFilter !== 'unfiled' ? folderFilter : '');
    setSaveError(null);
    setSaveNotice(null);
    setIsEditorOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addDecoration = (kind: JournalDecoration['kind'], value: string) => {
    if (decorations.length >= 10) {
      setSaveError('A page can hold up to ten stickers and photos.');
      return;
    }
    setDecorations((current) => [...current, createDecoration(kind, value)]);
    setSaveError(null);
    setShowStickerPicker(false);
  };

  const syncEditorCanvas = () => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const snapshot = readCanvas(canvas);
    setEntry(snapshot.content);
    setDecorations((current) => current
      .filter((decoration) => decoration.position === undefined || snapshot.positions.has(decoration.id))
      .map((decoration) => snapshot.positions.has(decoration.id)
        ? { ...decoration, position: snapshot.positions.get(decoration.id) }
        : decoration));
  };

  const rememberEditorSelection = () => {
    const canvas = editorCanvasRef.current;
    const selection = window.getSelection();
    if (!canvas || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (canvas.contains(range.commonAncestorContainer)) inlineSelectionRef.current = range.cloneRange();
  };

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (decorations.filter((item) => item.kind === 'photo').length >= 3) {
      setSaveError('A page can hold up to three photos.');
      return;
    }
    if (decorations.length >= 10) {
      setSaveError('A page can hold up to ten stickers and images.');
      return;
    }
    setIsAddingPhoto(true);
    setSaveError(null);
    try {
      const value = await compressPhoto(file);
      const decoration = createDecoration('photo', value);
      const canvas = editorCanvasRef.current;
      if (!canvas) {
        addDecoration('photo', value);
        return;
      }
      const image = makeInlineImage(decoration);
      const rememberedRange = inlineSelectionRef.current;
      if (rememberedRange && canvas.contains(rememberedRange.commonAncestorContainer)) {
        const range = rememberedRange.cloneRange();
        range.collapse(true);
        range.insertNode(image);
        range.setStartAfter(image);
        range.collapse(true);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        inlineSelectionRef.current = range.cloneRange();
      } else {
        canvas.appendChild(image);
      }
      const snapshot = readCanvas(canvas);
      setEntry(snapshot.content);
      setDecorations((current) => [...current, { ...decoration, position: snapshot.positions.get(decoration.id) ?? snapshot.content.length }]);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'This photo could not be added.');
    } finally {
      setIsAddingPhoto(false);
    }
  };

  const handleCreateFolder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newFolderName.trim() || isCreatingFolder) return;
    setIsCreatingFolder(true);
    setSaveError(null);
    try {
      const folder = await createJournalFolder({ name: newFolderName.trim(), cover_color: newFolderColor, cover_image: newFolderCoverImage });
      setFolders((current) => [...current, folder]);
      setFolderFilter(folder.id);
      setEditorFolderId(folder.id);
      setNewFolderName('');
      setNewFolderCoverImage(null);
    } catch {
      setSaveError('Your folder could not be created. Please try again.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleNotebookCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !folderCoverTarget) return;
    try {
      const coverImage = await compressPhoto(file);
      if (folderCoverTarget === 'new') {
        setNewFolderCoverImage(coverImage);
      } else {
        const folder = folders.find((item) => item.id === folderCoverTarget);
        if (!folder) return;
        const updated = await updateJournalFolder(folder.id, { name: folder.name, cover_color: folder.cover_color, cover_image: coverImage });
        setFolders((current) => current.map((item) => item.id === updated.id ? updated : item));
      }
      setSaveError(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The notebook cover could not be updated.');
    } finally {
      setFolderCoverTarget(null);
    }
  };

  const handleRenameFolder = (folder: JournalFolder) => {
    setRenamingFolder(folder);
    setRenameFolderValue(folder.name);
  };

  const handleSaveFolderName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const folder = renamingFolder;
    const name = renameFolderValue.trim();
    if (!folder || !name || isRenamingFolder) return;
    if (name === folder.name) {
      setRenamingFolder(null);
      return;
    }
    setIsRenamingFolder(true);
    try {
      const updated = await updateJournalFolder(folder.id, { name, cover_color: folder.cover_color, cover_image: folder.cover_image });
      setFolders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setRenamingFolder(null);
    } catch {
      setSaveError('This notebook could not be renamed. Please try again.');
    } finally {
      setIsRenamingFolder(false);
    }
  };

  const handleDeleteFolder = async (folder: JournalFolder) => {
    if (!window.confirm(`Delete “${folder.name}”? Its pages will move to Unfiled.`)) return;
    try {
      await deleteJournalFolder(folder.id);
      setFolders((current) => current.filter((item) => item.id !== folder.id));
      setPastEntries((current) => current.map((page) => page.folder_id === folder.id ? { ...page, folder_id: null } : page));
      setEditorFolderId((current) => current === folder.id ? '' : current);
      setFolderFilter((current) => current === folder.id ? 'all' : current);
    } catch {
      setSaveError('This folder could not be deleted. Please try again.');
    }
  };

  const handleOpenEntry = async (page: JournalEntry) => {
    setIsLoadingPage(true);
    setSaveError(null);
    try {
      const fullPage = await getJournalEntry(page.id);
      setEditingEntryId(fullPage.id);
      setEditingArchived(Boolean(fullPage.is_archived));
      setEntry(fullPage.content);
      setTitle(fullPage.title ?? '');
      setEditorFolderId(fullPage.folder_id ?? '');
      setDecorations(fullPage.decorations ?? []);
      setIsEditorOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSaveError('This page could not be opened. Please try again.');
    } finally {
      setIsLoadingPage(false);
    }
  };

  const handleSaveClick = () => {
    if (!entry.trim()) {
      setSaveError('Write something on the page before saving.');
      return;
    }
    setSaveError(null);
    setShowPrivacyModal(true);
  };

  const handleConfirmSave = async () => {
    setShowPrivacyModal(false);
    setIsSaving(true);
    setSaveError(null);
    setSaveNotice(null);

    try {
      let previousEntries: JournalEntry[] = studentCache.dashboard?.journalEntries ?? pastEntries;
      let previousCheckIns: WellnessCheckInResponse[] = studentCache.dashboard?.checkIns ?? [];
      if (!studentCache.dashboard && !editingEntryId) {
        try {
          [previousEntries, previousCheckIns] = await Promise.all([listJournalEntries(), listWellnessCheckIns()]);
        } catch {
          // A streak-history refresh should not prevent saving a page.
        }
      }
      const previousStreak = getActivityStreak(previousEntries, previousCheckIns);
      const payload = {
        content: entry.trim(),
        title: title.trim() || null,
        folder_id: editorFolderId || null,
        decorations,
      };
      const savedPage = editingEntryId
        ? await updateJournalEntry(editingEntryId, { ...payload, is_archived: editingArchived })
        : await createJournalEntry(payload);
      const nextEntries = editingEntryId
        ? previousEntries.map((item) => item.id === savedPage.id ? savedPage : item)
        : [savedPage, ...previousEntries.filter((item) => item.id !== savedPage.id)];
      const nextStreak = getActivityStreak(nextEntries, previousCheckIns);
      setPastEntries((current) => editingEntryId
        ? current.map((item) => item.id === savedPage.id ? savedPage : item)
        : [savedPage, ...current.filter((item) => item.id !== savedPage.id)]);
      if (!editingEntryId && nextStreak > previousStreak) queueStreakCelebration();
      if (studentCache.dashboard) studentCache.dashboard.journalEntries = nextEntries;

      if (journalInsightsEnabled) {
        try {
          setAnalysis(await getJournalAnalysis(savedPage.id));
        } catch {
          setAnalysis(null);
        }
        setShowInsightModal(true);
      } else {
        clearEditor();
        setAnalysis(null);
        setSaveNotice('Your page was saved. Journal Reflection Insights are off.');
      }
    } catch {
      setSaveError('Your page could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = () => {
    setShowInsightModal(false);
    clearEditor();
    setAnalysis(null);
  };

  const handleArchive = async (page: JournalEntry) => {
    try {
      const updated = await setJournalEntryArchived(page.id, !page.is_archived);
      setPastEntries((current) => current.map((item) => item.id === updated.id ? updated : item));
      if (studentCache.dashboard) {
        studentCache.dashboard.journalEntries = studentCache.dashboard.journalEntries.map((item) => item.id === updated.id ? updated : item);
      }
    } catch {
      setSaveError('This page could not be moved to the archive. Please try again.');
    }
  };

  const folderName = (folderId?: string | null) => folders.find((item) => item.id === folderId)?.name ?? 'Unfiled';
  const activeNotebook = folders.find((folder) => folder.id === folderFilter) ?? null;

  return (
    <div className={`relative mx-auto flex w-full flex-col gap-6 ${isEditorOpen ? 'max-w-5xl' : 'max-w-3xl'}`}>
      <div className={isEditorOpen ? 'hidden' : 'contents'}>
      {activeNotebook ? <Card data-tour="journal-notebooks" className="overflow-hidden rounded-3xl border-slate-200 p-0 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <button type="button" onClick={() => setFolderFilter('all')} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowLeft className="h-4 w-4" />All notebooks</button>
          <Button type="button" data-tour="journal-create" onClick={handleNewPage} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"><NotebookPen className="mr-2 h-4 w-4" />New page</Button>
        </div>
        <div className="relative flex min-h-36 items-end overflow-hidden p-5 sm:p-7">
          {activeNotebook.cover_image ? <img src={activeNotebook.cover_image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0" style={{ backgroundColor: ({ sage: '#b9d8c8', rose: '#f4c9cf', lavender: '#d8c9ef', sky: '#b9dce8', amber: '#f2d49b' })[activeNotebook.cover_color] }} />}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />
          <div className="relative text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">Notebook</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">{activeNotebook.name}</h1></div>
        </div>
        <p className="px-5 py-3 text-sm text-slate-500 dark:text-slate-400">Pages saved in this notebook appear below.</p>
      </Card> : <>
      <CompanionHeader
        title="My Journal"
        description="Make notebooks for different parts of life, then fill each one with pages that feel like yours."
        petSize="md"
        action={<Button type="button" data-tour="journal-create" onClick={handleNewPage} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"><NotebookPen className="mr-2 h-4 w-4" />New page</Button>}
      />

      <Card style={{ backgroundColor: '#e8f4ef', color: '#123c32', borderColor: '#c2ddd2' }} className="overflow-hidden rounded-3xl border p-0 shadow-md shadow-emerald-950/10">
        <div className="relative flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-emerald-700/5" aria-hidden="true" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-white/80 text-emerald-800"><BookHeart className="h-7 w-7" /></div>
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">Your little corner</p><h2 className="mt-1 text-2xl font-black text-emerald-950">My Notebook</h2></div>
          </div>
          <label className="relative flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-950">
            Notebook paper
            <select value={notebookTheme} onChange={(event) => setNotebookTheme(event.target.value as NotebookTheme)} className="min-w-36 cursor-pointer rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 [&>option]:bg-white [&>option]:text-slate-900">
              <option value="paper">Warm paper</option><option value="sage">Soft sage</option><option value="lavender">Lavender</option>
            </select>
          </label>
        </div>
      </Card>

      <Card data-tour="journal-notebooks" className="rounded-3xl border-slate-100 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-extrabold text-slate-900 dark:text-white">My notebooks</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Each notebook has its own title, cover, and pages.</p></div>
          <FolderPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setFolderFilter('all')} className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${folderFilter === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>All pages</button>
          <button type="button" onClick={() => setFolderFilter('unfiled')} className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${folderFilter === 'unfiled' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>Unfiled</button>
        </div>
        {folders.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {folders.map((folder) => (
            <div key={folder.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-900 ${folderFilter === folder.id ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}`}>
              <button type="button" onClick={() => setFolderFilter(folder.id)} aria-label={`Open ${folder.name} notebook`} className="relative block h-24 w-full overflow-hidden text-left">
                {folder.cover_image ? <img src={folder.cover_image} alt={`${folder.name} notebook cover`} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: ({ sage: '#b9d8c8', rose: '#f4c9cf', lavender: '#d8c9ef', sky: '#b9dce8', amber: '#f2d49b' })[folder.cover_color] }}><BookHeart className="h-9 w-9 text-white/90 drop-shadow" /></div>}
                <span className="absolute inset-x-0 bottom-0 truncate bg-slate-950/55 px-3 py-2 text-sm font-extrabold text-white">{folder.name}</span>
              </button>
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">Notebook</span>
                <div className="flex items-center">
                  <button type="button" onClick={() => { setFolderCoverTarget(folder.id); notebookCoverInput.current?.click(); }} aria-label={`Change ${folder.name} cover`} title="Change cover" className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800"><ImagePlus className="h-4 w-4" /></button>
                  <button type="button" onClick={() => void handleRenameFolder(folder)} aria-label={`Rename ${folder.name}`} title="Rename notebook" className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800">✎</button>
                  <button type="button" onClick={() => void handleDeleteFolder(folder)} aria-label={`Delete ${folder.name}`} title="Delete notebook" className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>}
        <form onSubmit={(event) => void handleCreateFolder(event)} className="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
          <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-200">Create a notebook</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} maxLength={60} placeholder="Notebook title" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <select value={newFolderColor} onChange={(event) => setNewFolderColor(event.target.value as JournalFolder['cover_color'])} aria-label="Notebook cover color" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <option value="sage">Sage cover</option><option value="rose">Rose cover</option><option value="lavender">Lavender cover</option><option value="sky">Sky cover</option><option value="amber">Amber cover</option>
            </select>
            <Button type="button" variant="secondary" onClick={() => { setFolderCoverTarget('new'); notebookCoverInput.current?.click(); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><ImagePlus className="mr-1.5 h-4 w-4" />{newFolderCoverImage ? 'Change cover image' : 'Add cover image'}</Button>
            <Button type="submit" isLoading={isCreatingFolder} disabled={!newFolderName.trim() || isCreatingFolder} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-white hover:bg-emerald-800">Create</Button>
          </div>
          {newFolderCoverImage && <div className="mt-2 flex items-center gap-2"><img src={newFolderCoverImage} alt="New notebook cover preview" className="h-12 w-12 rounded-lg object-cover" /><button type="button" onClick={() => setNewFolderCoverImage(null)} className="text-xs font-semibold text-rose-700 underline dark:text-rose-300">Remove cover</button></div>}
          <input ref={notebookCoverInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void handleNotebookCoverChange(event)} />
        </form>
      </Card>
      </>}
      </div>

      {renamingFolder && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
        <button type="button" aria-label="Close rename dialog" onClick={() => setRenamingFolder(null)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
        <form onSubmit={(event) => void handleSaveFolderName(event)} className="relative z-10 w-full max-w-sm rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><NotebookPen className="h-5 w-5" /></div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Rename notebook</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose a new title for “{renamingFolder.name}”.</p>
          <input autoFocus value={renameFolderValue} onChange={(event) => setRenameFolderValue(event.target.value)} maxLength={60} aria-label="Notebook title" className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setRenamingFolder(null)} className="rounded-xl px-4 py-2.5 text-sm">Cancel</Button><Button type="submit" isLoading={isRenamingFolder} disabled={!renameFolderValue.trim() || isRenamingFolder} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Save title</Button></div>
        </form>
      </div>}

      {isEditorOpen && <>
      <div className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:top-0 md:mx-0 md:rounded-2xl md:border md:px-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={clearEditor} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" aria-label="Back to notebook"><ArrowLeft className="h-5 w-5" /></button>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Notebook page</p><p className="text-sm font-extrabold text-slate-900 dark:text-white">{editingEntryId ? 'Edit your entry' : 'A new entry'}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">Color
            <select value={notebookTheme} onChange={(event) => setNotebookTheme(event.target.value as NotebookTheme)} aria-label="Page color" className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-800 shadow-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              <option value="paper">Warm</option><option value="sage">Sage</option><option value="lavender">Lavender</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">Paper
            <select value={paperType} onChange={(event) => setPaperType(event.target.value as PaperType)} aria-label="Paper type" className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-800 shadow-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              <option value="ruled">Ruled</option><option value="dotted">Dotted</option><option value="grid">Grid</option><option value="blank">Blank</option>
            </select>
          </label>
        </div>
      </div>

      <Card data-tour="journal-editor" style={{ backgroundColor: notebookTheme === 'paper' ? '#fffdf7' : notebookTheme === 'sage' ? '#f1f7f1' : '#f7f3ff', minHeight: 'calc(100dvh - 11rem)' }} className={`relative flex flex-col overflow-visible rounded-3xl border border-amber-100 p-5 pl-12 shadow-sm dark:border-slate-800 sm:p-8 sm:pl-16 ${NOTEBOOK_THEMES[notebookTheme]}`}>
        {decorations.filter((decoration) => decoration.kind === 'washi').map((decoration, index) => {
          const tapeColors = decoration.value === 'rose'
            ? ['#fda4af', '#ffe4e6']
            : decoration.value === 'lavender'
              ? ['#c4b5fd', '#ede9fe']
              : ['#6ee7b7', '#d1fae5'];
          return (
            <div key={decoration.id} className="group absolute z-20 flex h-5 w-24 items-center justify-center border-y border-white/50 opacity-90 shadow-sm" style={{ top: 0, left: `${20 + (index % 4) * 18}%`, transform: `rotate(${index % 2 === 0 ? '-3deg' : '3deg'})`, backgroundImage: `repeating-linear-gradient(135deg, ${tapeColors[0]} 0 6px, ${tapeColors[1]} 6px 12px)` }} aria-label={`${decoration.value} washi tape attached to the top edge of the page`}>
              <button type="button" onClick={() => setDecorations((current) => current.filter((item) => item.id !== decoration.id))} aria-label="Remove washi tape" className="absolute -right-2 -top-2 rounded-full bg-slate-800 p-1 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><X className="h-3 w-3" /></button>
            </div>
          );
        })}
        <div aria-hidden="true" className="absolute bottom-8 left-4 top-8 z-10 flex flex-col justify-between py-2 sm:left-6">
          {Array.from({ length: 8 }, (_, index) => <span key={index} className="h-5 w-5 rounded-full border-[3px] border-slate-400 bg-slate-200 shadow-inner dark:border-slate-600 dark:bg-slate-700" />)}
        </div>
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-amber-200/80 pb-3 dark:border-slate-700">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200"><NotebookPen className="h-5 w-5" /><span className="text-sm font-extrabold">{editingEntryId ? 'Your journal entry' : 'A fresh page'}</span></div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{new Date(editingEntryId ? pastEntries.find((page) => page.id === editingEntryId)?.created_at ?? Date.now() : Date.now()).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Give this page a title…" className="mb-2 w-full border-0 bg-transparent px-1 py-2 text-2xl font-black text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-white" />
        <div className="relative flex flex-1 flex-col" style={{ minHeight: 'min(34vh, 22rem)' }}>
          {!entry && <span className="pointer-events-none absolute left-1 top-2 z-10 text-[15px] leading-8 text-slate-400">Dear notebook… what would you like to remember today?</span>}
          <div
            ref={editorCanvasRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Journal text"
            aria-multiline="true"
            onInput={syncEditorCanvas}
            onKeyUp={rememberEditorSelection}
            onMouseUp={rememberEditorSelection}
            onTouchEnd={rememberEditorSelection}
            style={{ flex: '1 1 auto', minHeight: 'min(34vh, 22rem)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', backgroundImage: paperType === 'ruled' ? 'linear-gradient(to bottom, transparent calc(2rem - 1px), rgba(148,163,184,.23) calc(2rem - 1px))' : paperType === 'dotted' ? 'radial-gradient(rgba(100,116,139,.38) 1px, transparent 1px)' : paperType === 'grid' ? 'linear-gradient(rgba(100,116,139,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,.16) 1px, transparent 1px)' : 'none', backgroundSize: paperType === 'grid' ? '24px 24px, 24px 24px' : paperType === 'dotted' ? '18px 18px' : '100% 2rem' }}
            className="w-full rounded-none border-0 bg-transparent px-1 py-2 text-[15px] leading-8 text-slate-800 outline-none focus:ring-0 dark:text-slate-100"
          />
        </div>
        {decorations.some((decoration) => decoration.kind !== 'washi' && decoration.position === undefined) && (
          <div className="mt-4 flex flex-wrap items-start gap-3">
            {decorations.filter((decoration) => decoration.kind !== 'washi' && decoration.position === undefined).map((decoration) => (
              <div key={decoration.id} className="group relative">
                {decoration.kind === 'photo' ? <img src={decoration.value} alt="Photo attached to journal page" className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-md dark:border-slate-700" />
                  : <span className="inline-flex h-14 min-w-14 items-center justify-center rounded-2xl bg-white/70 px-2 text-4xl shadow-sm dark:bg-slate-800/80">{decoration.value}</span>}
                <button type="button" onClick={() => setDecorations((current) => current.filter((item) => item.id !== decoration.id))} aria-label="Remove decoration" className="absolute -right-2 -top-2 rounded-full bg-slate-800 p-1 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 border-t border-amber-200/80 pt-4 dark:border-slate-700">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-200">Decorate your page</p>
          <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Button type="button" variant="secondary" onClick={() => setShowStickerPicker((show) => !show)} className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><Sticker className="mr-1.5 h-4 w-4" />Sticker</Button>
            {showStickerPicker && <div className="absolute bottom-full left-0 z-50 mb-2 grid grid-cols-6 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">{STICKERS.map((sticker) => <button key={sticker} type="button" onClick={() => addDecoration('sticker', sticker)} className="rounded-lg p-2 text-xl hover:bg-emerald-50 dark:hover:bg-slate-800">{sticker}</button>)}</div>}
          </div>
          <Button type="button" variant="secondary" disabled={isAddingPhoto} onMouseDown={rememberEditorSelection} onTouchStart={rememberEditorSelection} onClick={() => photoInput.current?.click()} className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><ImagePlus className="mr-1.5 h-4 w-4" />{isAddingPhoto ? 'Adding…' : 'Add image/GIF'}</Button>
          <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => void handlePhoto(event)} />
          <Button type="button" variant="secondary" title="Add a decorative tape strip to this page" onClick={() => addDecoration('washi', ['sage', 'rose', 'lavender'][decorations.filter((item) => item.kind === 'washi').length % 3])} className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><Sparkles className="mr-1.5 h-4 w-4" />Add tape</Button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-amber-200/70 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">Notebook
            <select value={editorFolderId} onChange={(event) => setEditorFolderId(event.target.value)} className="max-w-48 rounded-lg border border-slate-200 bg-white/80 px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
              <option value="">No notebook</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </select>
          </label>
          <div className="flex gap-2 sm:justify-end">
            {editingArchived && <span className="self-center text-xs font-bold text-amber-700 dark:text-amber-300">Archived page</span>}
            <Button onClick={handleSaveClick} disabled={!entry.trim() || isSaving || isLoadingPage} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-800">{editingEntryId ? 'Save changes' : 'Save page'}</Button>
          </div>
        </div>
      </Card>
      </>}

      {saveNotice && <p role="status" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">{saveNotice}{' '}<button type="button" onClick={() => navigate('/profile/privacy')} className="font-bold underline underline-offset-2">Manage settings</button></p>}

      {!isEditorOpen && <section data-tour="journal-history" className="mt-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">{activeNotebook ? 'Notebook pages' : 'Your pages'}</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{showArchived ? (activeNotebook ? `${activeNotebook.name} archive` : 'The archive') : activeNotebook ? `${activeNotebook.name} pages` : folderFilter === 'unfiled' ? 'Unfiled pages' : 'Recent reflections'}</h2></div>
          <div className="flex flex-wrap gap-2">
            <label className="relative min-w-36 flex-1 sm:flex-none"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Find a page" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} aria-label="Sort journal pages" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select>
            <Button type="button" variant="secondary" onClick={() => setShowArchived((value) => !value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{showArchived ? <><ArchiveRestore className="mr-1.5 h-4 w-4" />Active pages</> : <><Archive className="mr-1.5 h-4 w-4" />Archive</>}</Button>
          </div>
        </div>

        {isLoadingEntries ? <div className="mt-4 h-32 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900" />
          : visibleEntries.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">{showArchived ? 'Nothing tucked away here yet.' : searchText ? 'No pages match that search.' : 'Your notebook is ready when you are.'}</p>
            : <div className="mt-4 grid gap-3 sm:grid-cols-2">{visibleEntries.map((page) => (
              <Card key={page.id} className="group overflow-hidden rounded-2xl border-slate-100 bg-white p-0 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900">
                <button type="button" onClick={() => void handleOpenEntry(page)} className="block w-full p-5 text-left" aria-label={`Open ${titleFor(page)}`}>
                  <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">{folderName(page.folder_id)}</span><span className="text-[11px] text-slate-400">{new Date(page.created_at).toLocaleDateString()}</span></div>
                  <h3 className="mt-3 line-clamp-1 font-extrabold text-slate-900 group-hover:text-emerald-800 dark:text-white dark:group-hover:text-emerald-200">{titleFor(page)}</h3>
                  <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{page.content}</p>
                  {(page.decoration_count ?? 0) > 0 && <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400"><Camera className="h-3.5 w-3.5" />Scrapbook page · {page.decoration_count} decoration{page.decoration_count === 1 ? '' : 's'}</p>}
                </button>
                <div className="flex justify-end border-t border-slate-100 px-4 py-2 dark:border-slate-800"><button type="button" onClick={() => void handleArchive(page)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-300">{page.is_archived ? <><ArchiveRestore className="h-3.5 w-3.5" />Restore</> : <><Archive className="h-3.5 w-3.5" />Archive</>}</button></div>
              </Card>
            ))}</div>}
      </section>}

      {saveError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{saveError}</p>}

      {showPrivacyModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPrivacyModal(false)} />
        <div className="relative z-10 w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><BookHeart className="h-6 w-6" /></div>
          <h2 className="mb-2 text-xl font-black text-slate-900 dark:text-white">A note about your page</h2>
          <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Your words and attached photos are encrypted before storage and are visible only from your account.</p>
          <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{journalInsightsEnabled ? 'Journal Reflection Insights are on. Your writing may be analyzed for general emotional tone after saving.' : 'Journal Reflection Insights are off. This page will be saved without automated sentiment analysis.'}</p>
          <div className="flex gap-3"><Button onClick={() => setShowPrivacyModal(false)} variant="secondary" className="flex-1 rounded-xl">Keep writing</Button><Button onClick={() => void handleConfirmSave()} className="flex-1 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">Save page</Button></div>
        </div>
      </div>}

      {(isSaving || showInsightModal) && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
          {isSaving ? <div className="py-8"><div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" /><p className="text-sm font-bold text-slate-600 dark:text-slate-300">Saving your page…</p><p className="mt-2 text-xs text-slate-500">{journalInsightsEnabled ? 'Preparing your optional reflection insight.' : 'Reflection insights are off.'}</p></div> : <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Sparkles className="h-7 w-7" /></div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Reflection Insight</h2><p className="mt-1 text-xs text-slate-500">Based on the general emotional tone of your writing:</p>
            <div className="my-5 flex w-full flex-col items-center rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><span className="text-3xl">☁️</span><span className="mt-1 font-bold text-slate-900 dark:text-white">{analysis?.sentiment_label ?? 'Pending'}</span><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">emotional expression</span></div>
            <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{analysis?.disclaimer ?? 'Your page was saved. This reflection is not a diagnosis.'}</p>
            <div className="flex w-full flex-col gap-2"><Button onClick={() => navigate('/support')} variant="secondary" className="w-full rounded-xl">Talk to a Counselor</Button><Button onClick={handleFinish} className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">Back to my notebook</Button></div>
          </>}
        </div>
      </div>}
    </div>
  );
};
