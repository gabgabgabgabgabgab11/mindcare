import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { getCurrentUser, listJournalEntries, listWellnessCheckIns, updateProfile } from '../services/studentApi';
import { studentCache } from '../services/studentCache';
import { PET_LIST, type PetId } from '../constants/pets';
import { YEAR_LEVEL_OPTIONS, yearLevelLabel } from '../constants/academicYears';
import type { MeResponse } from '../types';

const PROGRAM_OPTIONS = ['BSIT', 'BSCpE', 'BSHM', 'BSA', 'BSENTREP', 'BSEDEN', 'DSEDMT', 'DOMTLOM'];

export const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [displayNameMessage, setDisplayNameMessage] = useState<string | null>(null);
  const [isUpdatingDisplayName, setIsUpdatingDisplayName] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [isUpdatingProgram, setIsUpdatingProgram] = useState(false);
  const [isUpdatingYear, setIsUpdatingYear] = useState(false);
  const [academicMessage, setAcademicMessage] = useState<string | null>(null);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [isUpdatingPet, setIsUpdatingPet] = useState(false);
  const [petSuccessMessage, setPetSuccessMessage] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [nicknameMessage, setNicknameMessage] = useState<string | null>(null);
  const [journalCount, setJournalCount] = useState(0);
  const [checkinCount, setCheckinCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCurrentUser(), listJournalEntries(), listWellnessCheckIns()])
      .then(([user, journals, checkins]) => {
        setProfile(user);
        setDisplayNameInput(user.display_name ?? '');
        setSelectedProgram(user.program);
        setSelectedPet(user.companion_pet);
        setNicknameInput(user.companion_nickname ?? '');
        setJournalCount(journals.length);
        setCheckinCount(checkins.length);
      })
      .catch(() => setError('Profile data could not be loaded.'));
  }, []);

  const handleProgramChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const program = event.target.value;
    if (!program || program === selectedProgram || isUpdatingProgram || isUpdatingYear) return;

    const previousProgram = selectedProgram;
    setSelectedProgram(program);
    setIsUpdatingProgram(true);
    setError(null);
    setAcademicMessage(null);

    try {
      const updated = await updateProfile({ program });
      setAcademicMessage('Program saved.');
      setSelectedProgram(updated.program);
      setProfile((prev) => (prev ? {
        ...prev,
        program: updated.program,
        year_level: updated.year_level,
        section: updated.section,
      } : updated));
      if (studentCache.dashboard) {
        studentCache.dashboard.user = {
          ...studentCache.dashboard.user,
          program: updated.program,
          year_level: updated.year_level,
          section: updated.section,
        };
      }
    } catch {
      setSelectedProgram(previousProgram);
      setError('Could not update your program. Please try again.');
    } finally {
      setIsUpdatingProgram(false);
    }
  };

  const handleYearChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const yearLevel = event.target.value;
    if (!yearLevel || yearLevel === profile?.year_level || isUpdatingYear || isUpdatingProgram) return;
    setIsUpdatingYear(true);
    setError(null);
    setAcademicMessage(null);
    try {
      const updated = await updateProfile({ year_level: Number(yearLevel) });
      setProfile(previous => previous ? {
        ...previous, program: updated.program, year_level: updated.year_level, section: updated.section,
      } : updated);
      setSelectedProgram(updated.program);
      if (studentCache.dashboard) {
        studentCache.dashboard.user = {
          ...studentCache.dashboard.user, program: updated.program, year_level: updated.year_level, section: updated.section,
        };
      }
      setAcademicMessage('Year level saved.');
    } catch {
      setError('Could not save your year level. Please try again.');
    } finally {
      setIsUpdatingYear(false);
    }
  };

  const handleSelectPet = async (petId: PetId) => {
    if (selectedPet === petId || isUpdatingPet) return;
    setIsUpdatingPet(true);
    setPetSuccessMessage(null);
    try {
      const updated = await updateProfile({ companion_pet: petId });
      setSelectedPet(updated.companion_pet);
      setProfile((prev) => (prev ? { ...prev, companion_pet: updated.companion_pet } : updated));
      if (studentCache.dashboard) {
        studentCache.dashboard.user = {
          ...studentCache.dashboard.user,
          companion_pet: updated.companion_pet,
        };
      }
      setPetSuccessMessage('Companion saved! ✨');
      setTimeout(() => setPetSuccessMessage(null), 3000);
    } catch {
      setError('Could not update companion pet. Please try again.');
    } finally {
      setIsUpdatingPet(false);
    }
  };

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateProfile({ companion_nickname: nicknameInput.trim() || null });
      setProfile((previous) => previous ? { ...previous, companion_nickname: updated.companion_nickname } : updated);
      if (studentCache.dashboard) studentCache.dashboard.user = updated;
      setNicknameInput(updated.companion_nickname ?? '');
      setNicknameMessage(updated.companion_nickname ? 'Nickname saved! ✨' : 'Nickname reset to default.');
      setTimeout(() => setNicknameMessage(null), 3000);
    } catch {
      setError('Could not save companion nickname. Please try again.');
    }
  };

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = displayNameInput.trim();
    if (!displayName || isUpdatingDisplayName) return;

    setIsUpdatingDisplayName(true);
    setDisplayNameMessage(null);
    setError(null);
    try {
      const updated = await updateProfile({ display_name: displayName });
      setProfile((previous) => previous ? { ...previous, display_name: updated.display_name } : previous);
      setDisplayNameInput(updated.display_name ?? '');
      if (studentCache.dashboard) {
        studentCache.dashboard.user = { ...studentCache.dashboard.user, display_name: updated.display_name };
      }
      setDisplayNameMessage('Name saved.');
      window.setTimeout(() => setDisplayNameMessage(null), 3000);
    } catch {
      setError('Could not save your name. Please try again.');
    } finally {
      setIsUpdatingDisplayName(false);
    }
  };

  const handleImageUpload = async (kind: 'avatar_image' | 'cover_image', event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setError('Images must be 1 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      try {
        const updated = await updateProfile({ [kind]: reader.result });
        setProfile((previous) => previous ? { ...previous, [kind]: updated[kind] } : updated);
        if (studentCache.dashboard) studentCache.dashboard.user = { ...studentCache.dashboard.user, [kind]: updated[kind] };
        setError(null);
      } catch {
        setError('Image could not be saved. Please try again.');
      }
    };
    reader.onerror = () => setError('Image could not be read. Please choose another file.');
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const email = profile?.email ?? 'Loading profile...';
  const displayName = profile?.display_name || profile?.email?.split('@')[0].replace(/[._-]+/g, ' ') || 'Student';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full pb-6">
      {error && <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{error}</p>}
      
      {/* 1. Profile Banner & Avatar */}
      <div data-tour="profile-header" className="relative rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mt-2">
        {/* Soft banner background */}
        <div className="h-32 bg-emerald-50 dark:bg-slate-800 bg-cover bg-center" style={profile?.cover_image ? { backgroundImage: `url(${profile.cover_image})` } : undefined}></div>
        
        {/* Avatar (Overlapping) */}
        <div className="absolute top-16 left-6">
          <div className="w-24 h-24 bg-white rounded-full p-1.5 shadow-md">
            {profile?.avatar_image ? <img src={profile.avatar_image} alt={`${displayName} profile`} className="h-full w-full rounded-full object-cover" /> : (
              <div className="w-full h-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 rounded-full flex items-center justify-center text-3xl font-black">{initials}</div>
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="pt-12 pb-6 px-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{displayName}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-3">{email}</p>
          <div className="mb-4 flex flex-wrap gap-3 text-xs font-semibold text-brand-700 dark:text-brand-300">
            <label className="cursor-pointer rounded-lg border border-brand-200 px-3 py-2 hover:bg-brand-50 dark:border-brand-900 dark:hover:bg-brand-950/50">
              Edit profile picture<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void handleImageUpload('avatar_image', event)} />
            </label>
            <label className="cursor-pointer rounded-lg border border-brand-200 px-3 py-2 hover:bg-brand-50 dark:border-brand-900 dark:hover:bg-brand-950/50">
              Edit cover photo<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void handleImageUpload('cover_image', event)} />
            </label>
            <span className="self-center font-normal text-gray-500 dark:text-slate-400">JPG, PNG, or WebP · up to 1 MB</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="relative inline-flex">
              <select
                aria-label="Academic program"
                value={selectedProgram ?? ''}
                onChange={(event) => void handleProgramChange(event)}
                disabled={!profile || isUpdatingProgram || isUpdatingYear}
                className="profile-academic-select h-9 appearance-none rounded-full border border-gray-200 bg-gray-50 py-1 pl-3 pr-7 text-xs font-bold leading-4 text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-wait disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <option value="" disabled>Program not set</option>
                {selectedProgram && !PROGRAM_OPTIONS.includes(selectedProgram) && (
                  <option value={selectedProgram}>{selectedProgram}</option>
                )}
                {PROGRAM_OPTIONS.map((program) => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500 dark:text-slate-400"
              />
            </div>
            <div className="relative inline-flex">
              <select
                aria-label="Year level"
                value={profile?.year_level ?? ''}
                onChange={(event) => void handleYearChange(event)}
                disabled={!profile || isUpdatingProgram || isUpdatingYear}
                className="profile-academic-select h-9 appearance-none rounded-full border border-brand-100 bg-brand-50 py-1 pl-3 pr-7 text-xs font-bold leading-4 text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-wait disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <option value="" disabled>Year level not provided</option>
                {profile?.year_level && !YEAR_LEVEL_OPTIONS.some(option => option.value === profile.year_level) && (
                  <option value={profile.year_level}>{yearLevelLabel(profile.year_level)}</option>
                )}
                {YEAR_LEVEL_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-brand-600 dark:text-brand-300" />
            </div>
          </div>
          <p role="status" className="mt-2 text-xs text-brand-700 dark:text-brand-300">
            {isUpdatingProgram || isUpdatingYear ? 'Saving academic details…' : academicMessage ?? 'Choose your program and year level. Changes save automatically.'}
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={(event) => void handleSaveDisplayName(event)}>
          <label htmlFor="student-display-name" className="block text-sm font-bold text-gray-900 dark:text-white">Display name</label>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Choose the name shown on your profile instead of your email nickname.</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="student-display-name"
              type="text"
              required
              minLength={1}
              maxLength={50}
              value={displayNameInput}
              onChange={(event) => setDisplayNameInput(event.target.value)}
              disabled={!profile || isUpdatingDisplayName}
              placeholder={displayName}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <Button type="submit" disabled={!profile || !displayNameInput.trim() || isUpdatingDisplayName} isLoading={isUpdatingDisplayName} className="shrink-0">
              Save name
            </Button>
          </div>
          {displayNameMessage && <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{displayNameMessage}</p>}
        </form>
      </Card>

      {/* 2. Companion Selector Section */}
      <Card id="companion" data-tour="profile-companion" className="border-gray-100 dark:border-slate-800 shadow-sm rounded-3xl bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🐾</span> Companion Pet
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Choose your personal companion to cheer you on during your daily wellness journey.
            </p>
          </div>
          {petSuccessMessage && (
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1.5 rounded-full border border-brand-100 dark:border-brand-900/50 shrink-0">
              {petSuccessMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
          {PET_LIST.map((pet) => {
            const isSelected = selectedPet === pet.id;
            return (
              <button
                key={pet.id}
                type="button"
                onClick={() => handleSelectPet(pet.id)}
                disabled={isUpdatingPet}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all cursor-pointer text-center group ${
                  isSelected
                    ? 'border-2 border-brand-600 bg-brand-50/70 dark:bg-brand-950/50 dark:border-brand-500 shadow-sm'
                    : 'border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-brand-200 dark:hover:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center mb-2 relative">
                  <img
                    src={pet.images.idle}
                    alt={pet.name}
                    className="max-h-full max-w-full object-contain pointer-events-none transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <span className={`text-sm font-bold ${isSelected ? 'text-brand-900 dark:text-brand-200' : 'text-gray-900 dark:text-white'}`}>
                  {pet.name}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {isSelected ? 'Selected' : pet.tagline}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pet Nickname Setting */}
        <form onSubmit={handleSaveNickname} className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800">
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Companion Nickname
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              maxLength={20}
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder="e.g. Mochi, Barnaby, Buster..."
              className="w-full sm:max-w-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Nickname
            </button>
            {nicknameMessage && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {nicknameMessage}
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* 4. Wellness Stats Grid */}
      <div data-tour="profile-stats" className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center justify-center p-4 shadow-sm border border-gray-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 text-center">
          <span className="text-2xl mb-1">🔥</span>
          <span className="text-xl font-black text-gray-900 dark:text-white">{checkinCount}</span>
          <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Check-ins</span>
        </Card>
        <Card className="flex flex-col items-center justify-center p-4 shadow-sm border border-gray-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 text-center">
          <span className="text-2xl mb-1">📔</span>
          <span className="text-xl font-black text-gray-900 dark:text-white">{journalCount}</span>
          <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Entries</span>
        </Card>
      </div>

      {/* 5. Settings Menu */}
      <Card data-tour="profile-settings" className="flex flex-col p-0 overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
        
        <button 
          onClick={() => navigate('/profile/privacy')}
          className="flex items-center gap-4 p-5 border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left w-full cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"></path></svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Privacy & Security</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Control your data and anonymity</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <button 
          onClick={() => navigate('/notifications')}
          className="flex items-center gap-4 p-5 border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left w-full cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Reminders for check-ins and journals</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <button 
          onClick={() => navigate('/support')}
          className="flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left w-full cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Help & Support</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">App guides and OSS contact info</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <button
          type="button"
          onClick={() => navigate('/about')}
          className="flex w-full cursor-pointer items-center gap-4 border-t border-gray-50 p-5 text-left transition-colors hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 20A7 7 0 014 13c0-4 4-9 8-10 4 1 8 6 8 10a7 7 0 01-7 7m-1-9c0 3-1 5-4 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">About MindCare</h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Learn about the platform and the team</p>
          </div>
          <svg className="h-5 w-5 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </Card>

      {/* 6. Emergency SOS Card */}
      <Card className="flex items-center justify-between p-5 shadow-sm border border-red-100 dark:border-red-950 bg-red-50 dark:bg-red-950/30 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
          </div>
          <div>
            <h3 className="font-bold text-red-900 dark:text-red-200 text-sm">Crisis Resources</h3>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 font-medium">Get immediate help 24/7</p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/resources')}
          variant="secondary"
          className="bg-white dark:bg-slate-800 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-slate-700 text-xs px-4 rounded-full cursor-pointer"
        >
          View
        </Button>
      </Card>

      {/* 7. Logout Button */}
      <div className="mt-2">
        <Button 
          variant="secondary" 
          onClick={handleLogout}
          className="w-full bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 py-3.5 rounded-xl shadow-sm cursor-pointer"
        >
          Log Out
        </Button>
      </div>

    </div>
  );
};
