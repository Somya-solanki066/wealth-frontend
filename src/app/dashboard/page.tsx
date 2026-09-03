"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Reusable UI components
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import Loader from "@/components/ui/Loader";
import ProgressBar from "@/components/ui/ProgressBar";
import ScoreRing from "@/components/ui/ScoreRing";
import FileUpload from "@/components/ui/FileUpload";
import PaywallModal from "@/components/ui/PaywallModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Modal from "@/components/ui/Modal";
import SmartEditSuite from "@/components/SmartEditSuite";
import GhostWriterWorkspace from "@/components/GhostWriterWorkspace";
import StudentHubWorkspace from "@/components/StudentHubWorkspace";
import AiToolFeedback from "@/components/AiToolFeedback";
import ScriptEditorToolbar from "@/components/ScriptEditorToolbar";
import "@/app/home-worlds.css";
import "@/app/script-editor.css";
import {
  applyScriptElement,
  execEditorCommand,
  handleScriptEnter,
  SCRIPT_ELEMENT_CLASS,
  type ScriptElementKey,
} from "@/lib/scriptEditor";

import {
  Home,
  BookOpen,
  Clapperboard,
  Download,
  FileText,
  Play,
  Lock,
  Mail,
  User as UserIcon,
  Flame,
  Sparkles,
  ArrowRight,
  Plus,
  CornerDownRight,
  PenTool,
  Calendar,
  Bookmark,
  BrainCircuit,
  Settings,
  Layers,
  GraduationCap,
  Coins,
  Search,
  Trash2,
  Save,
  Bold,
  Italic,
  Quote,
  Wrench,
  Eye,
  Edit,
  FileEdit,
  Shield,
  Ghost,
  Pencil
} from "lucide-react";
import { 
  BarChart, 
  Settings as SettingsIcon,
  Zap, 
  Trophy,
  Activity
} from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { useCatalog } from "@/hooks/useCatalog";

function DashboardContent() {
  const { content } = useContent("dashboard");
  const { platforms: catalogPlatforms, genres: catalogGenres } = useCatalog();
  const { user, profile, loading, signOutUser, updateUserProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active view tab state (home, novel, script, tools, student, wealth, profile)
  const [activeTab, setActiveTab] = useState<string>("home");

  const goToTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard?tab=${encodeURIComponent(tab)}`);
    }
  };

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    setActiveTab(tabParam || "home");
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // General profile state
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Modals state
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState("");
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Detailed project views state
  const [selectedViewProject, setSelectedViewProject] = useState<any | null>(null);
  const [viewProjectChapters, setViewProjectChapters] = useState<any[]>([]);
  const [isViewChaptersLoading, setIsViewChaptersLoading] = useState(false);
  const [activePreviewChapter, setActivePreviewChapter] = useState<any | null>(null);

  const handleViewProjectDetails = async (proj: any) => {
    setSelectedViewProject(proj);
    setViewProjectChapters([]);
    setActivePreviewChapter(null);
    setIsViewChaptersLoading(true);
    goToTab(proj.type === "novel" ? "view-novel" : "view-script");
    try {
      const response = await api.get(`/projects/${proj.id}/chapters`);
      const chaptersList = response.data || [];
      setViewProjectChapters(chaptersList);
      if (chaptersList.length > 0) {
        setActivePreviewChapter(chaptersList[0]);
      }
    } catch (err) {
      console.error("Failed to load chapters for view page:", err);
    } finally {
      setIsViewChaptersLoading(false);
    }
  };

  // Project lists & Manager States
  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState<"novel" | "script">("novel");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const [renameChapterTarget, setRenameChapterTarget] = useState<any | null>(null);
  const [renameChapterTitle, setRenameChapterTitle] = useState("");
  const [isRenamingChapter, setIsRenamingChapter] = useState(false);
  const [deleteChapterTarget, setDeleteChapterTarget] = useState<any | null>(null);
  const [isDeleteChapterOpen, setIsDeleteChapterOpen] = useState(false);
  const [isDeletingChapter, setIsDeletingChapter] = useState(false);

  // Active project & editors state
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [activeChapter, setActiveChapter] = useState<any | null>(null);
  const [isChaptersLoading, setIsChaptersLoading] = useState(false);

  // Novel Editor content state
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorContent, setEditorContent] = useState("");
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");

  // Word count calculator helper
  const currentWordCount = editorContent
    ? editorContent.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter((w) => w.length > 0).length
    : 0;

  // Script Editor Format Elements
  const [scriptElement, setScriptElement] = useState<ScriptElementKey>("action");
  const [scriptPageCount, setScriptPageCount] = useState(1);

  const normalizeScriptHtml = (html: string) => {
    const trimmed = (html || "").trim();
    if (!trimmed || trimmed === "<br>") {
      return `<div class="${SCRIPT_ELEMENT_CLASS.action}" data-script-element="action"><br></div>`;
    }
    if (!trimmed.includes("script-el-") && !trimmed.includes("<div") && !trimmed.includes("<p")) {
      return `<div class="${SCRIPT_ELEMENT_CLASS.action}" data-script-element="action">${trimmed}</div>`;
    }
    return trimmed;
  };

  // Streak status states
  const [writingStreak, setWritingStreak] = useState(0);
  const [lastWriteDate, setLastWriteDate] = useState<string | null>(null);
  const [totalWordsWritten, setTotalWordsWritten] = useState(0);
  const [isRecordingStreak, setIsRecordingStreak] = useState(false);
  const [witWebNotes, setWitWebNotes] = useState(
    "In this lesson you learn exactly what MegaNovel readers want: urban fiction with a powerful male protagonist who starts from nothing — humiliated, rejected, looked down upon — and rises to power."
  );
  const [ssgNotes, setSsgNotes] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  const openPaywall = (feature: string) => {
    setPaywallFeature(feature);
    setIsPaywallOpen(true);
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploading(true);
    setFeedback({ type: "", message: "" });
    try {
      const fakeUrl = URL.createObjectURL(file);
      await updateUserProfile(profile?.displayName || "User", fakeUrl);
      setFeedback({ type: "success", message: "Avatar uploaded successfully!" });
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setFeedback({ type: "error", message: "Failed to upload avatar image." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setIsSaving(true);
    setFeedback({ type: "", message: "" });
    try {
      await updateUserProfile(displayName, profile?.photoURL || null);
      setFeedback({ type: "success", message: "Profile updated successfully!" });
    } catch (err) {
      console.error("Profile update failed:", err);
      setFeedback({ type: "error", message: "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (profile?.displayName && !displayName) {
      setDisplayName(profile.displayName);
    }
  }, [profile]);

  // Fetch streak & projects on mount
  useEffect(() => {
    if (user) {
      fetchStreakStatus();
      fetchProjects();
    }
  }, [user]);

  // Autosave debouncer trigger
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (activeProject && activeChapter && editorContent !== undefined) {
      // Don't auto-save immediately on first render of chapter
      if (activeChapter.content === editorContent) return;

      setSaveStatus("Saving...");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(() => {
        triggerAutosave(editorContent);
      }, 1200);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editorContent, activeChapter]);

  const fetchStreakStatus = async () => {
    try {
      const response = await api.get("/user/streak");
      const { writingStreak, lastWriteDate, totalWordsWritten } = response.data;
      setWritingStreak(writingStreak || 0);
      setLastWriteDate(lastWriteDate || null);
      setTotalWordsWritten(totalWordsWritten || 0);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("streakUpdated", { detail: writingStreak || 0 }));
      }
    } catch (err) {
      console.error("Failed to fetch writing streak status:", err);
    }
  };

  const fetchProjects = async () => {
    setIsProjectsLoading(true);
    try {
      const response = await api.get("/projects");
      setProjects(response.data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      triggerToast("Please enter a project name.");
      return;
    }
    setIsCreatingProject(true);
    try {
      const response = await api.post("/projects", {
        name: newProjectName,
        type: newProjectType,
      });
      const createdProj = response.data;
      setProjects([createdProj, ...projects]);
      setIsCreateOpen(false);
      setNewProjectName("");
      triggerToast("Project created successfully!");
      
      // Auto select and open editor
      handleSelectProject(createdProj);
    } catch (err) {
      console.error("Failed to create project:", err);
      triggerToast("Failed to create project.");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteTargetId) return;
    setIsDeletingProject(true);
    try {
      await api.delete(`/projects/${deleteTargetId}`);
      setProjects(projects.filter(p => p.id !== deleteTargetId));
      setIsDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      triggerToast("Project deleted successfully.");
      if (activeProject?.id === deleteTargetId) {
        setActiveProject(null);
        setChapters([]);
        setActiveChapter(null);
        goToTab("home");
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
      triggerToast("Failed to delete project.");
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleLogoutConfirm = async () => {
    setIsLogoutConfirmOpen(false);
    try {
      await signOutUser();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleSelectProject = async (proj: any) => {
    setActiveProject(proj);
    setChapters([]);
    setActiveChapter(null);
    setIsChaptersLoading(true);
    goToTab(proj.type); // Route to 'novel' or 'script' editor tab

    try {
      const response = await api.get(`/projects/${proj.id}/chapters`);
      const chaptersList = response.data || [];
      setChapters(chaptersList);
      if (chaptersList.length > 0) {
        handleSelectChapter(chaptersList[0], proj.type);
      }
    } catch (err) {
      console.error("Failed to load chapters:", err);
    } finally {
      setIsChaptersLoading(false);
    }
  };

  const handleSelectChapter = (chap: any, projectType?: string) => {
    setActiveChapter(chap);
    const type = projectType ?? activeProject?.type;
    const content =
      type === "script" ? normalizeScriptHtml(chap.content || "") : chap.content || "";
    setEditorContent(content);
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
    // Calculate page counts for script editor (approx 180 words per page in screenplay formatting)
    const wordCount = chap.wordCount || 5;
    setScriptPageCount(Math.max(1, Math.ceil(wordCount / 180)));
  };

  const handleAddChapter = async () => {
    if (!activeProject) return;
    try {
      const nextNum = chapters.length + 1;
      const title = activeProject.type === "novel" ? `Chapter ${nextNum}` : `Scene ${nextNum}`;
      const response = await api.post(`/projects/${activeProject.id}/chapters`, { title });
      const newChap = response.data;
      const updatedList = [...chapters, newChap];
      setChapters(updatedList);
      handleSelectChapter(newChap);
      triggerToast(`${title} added!`);
    } catch (err) {
      console.error("Failed to add chapter:", err);
      triggerToast("Failed to add chapter.");
    }
  };

  const openRenameChapter = (chap: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRenameChapterTarget(chap);
    setRenameChapterTitle(chap.title || "");
  };

  const handleRenameChapter = async () => {
    if (!activeProject || !renameChapterTarget) return;
    const nextTitle = renameChapterTitle.trim();
    if (!nextTitle) {
      triggerToast("Title cannot be empty.");
      return;
    }
    setIsRenamingChapter(true);
    try {
      await api.put(`/projects/${activeProject.id}/chapters/${renameChapterTarget.id}`, {
        title: nextTitle,
      });
      setChapters((prev) =>
        prev.map((c) => (c.id === renameChapterTarget.id ? { ...c, title: nextTitle } : c))
      );
      if (activeChapter?.id === renameChapterTarget.id) {
        setActiveChapter({ ...activeChapter, title: nextTitle });
      }
      setViewProjectChapters((prev) =>
        prev.map((c) => (c.id === renameChapterTarget.id ? { ...c, title: nextTitle } : c))
      );
      setRenameChapterTarget(null);
      triggerToast("Chapter renamed.");
    } catch (err) {
      console.error("Failed to rename chapter:", err);
      triggerToast("Failed to rename chapter.");
    } finally {
      setIsRenamingChapter(false);
    }
  };

  const openDeleteChapter = (chap: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteChapterTarget(chap);
    setIsDeleteChapterOpen(true);
  };

  const handleDeleteChapter = async () => {
    if (!activeProject || !deleteChapterTarget) return;
    setIsDeletingChapter(true);
    try {
      await api.delete(`/projects/${activeProject.id}/chapters/${deleteChapterTarget.id}`);
      const remaining = chapters.filter((c) => c.id !== deleteChapterTarget.id);
      setChapters(remaining);
      setViewProjectChapters((prev) => prev.filter((c) => c.id !== deleteChapterTarget.id));
      if (activeChapter?.id === deleteChapterTarget.id) {
        if (remaining.length > 0) {
          handleSelectChapter(remaining[0]);
        } else {
          setActiveChapter(null);
          setEditorContent("");
          if (editorRef.current) editorRef.current.innerHTML = "";
        }
      }
      setIsDeleteChapterOpen(false);
      setDeleteChapterTarget(null);
      triggerToast("Chapter deleted.");
    } catch (err) {
      console.error("Failed to delete chapter:", err);
      triggerToast("Failed to delete chapter.");
    } finally {
      setIsDeletingChapter(false);
    }
  };

  const triggerAutosave = async (contentStr: string) => {
    if (!activeProject || !activeChapter) return;
    setIsAutosaving(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const response = await api.put(`/projects/${activeProject.id}/chapters/${activeChapter.id}`, {
        content: contentStr,
        localDateStr: todayStr,
      });
      
      setSaveStatus("Saved ✓");
      // Update chapter wordcount in current list
      const { chapterWordCount, projectWordCount } = response.data;
      setChapters(chapters.map(c => c.id === activeChapter.id ? { ...c, content: contentStr, wordCount: chapterWordCount } : c));
      
      // Update script page counts
      setScriptPageCount(Math.max(1, Math.ceil(chapterWordCount / 180)));

      // Sync streak metrics in real time
      fetchStreakStatus();
    } catch (err) {
      console.error("Autosave failed:", err);
      setSaveStatus("Saving error");
    } finally {
      setIsAutosaving(false);
    }
  };

  const handleRecordWritingSession = async () => {
    setIsRecordingStreak(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const response = await api.post("/user/streak/record", {
        wordCount: 1000,
        localDateStr: todayStr,
      });
      const { writingStreak: newStreak, lastWriteDate: newDate, totalWordsWritten: newWords } = response.data;
      setWritingStreak(newStreak);
      setLastWriteDate(newDate);
      setTotalWordsWritten(newWords);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("streakUpdated", { detail: newStreak }));
      }
      triggerToast(`Writing session saved! streak updated to ${newStreak} days! 🔥`);
    } catch (err: any) {
      console.error("Streak record failed:", err);
      triggerToast(err.response?.data?.error || "Failed to record daily session.");
    } finally {
      setIsRecordingStreak(false);
    }
  };

  // Text formatter execCommands (bold, italic, etc. inside contentEditable)
  const syncEditorFromDom = () => {
    if (editorRef.current) {
      setEditorContent(editorRef.current.innerHTML);
    }
  };

  const execFormat = (command: string, value?: string) => {
    execEditorCommand(command, value);
    syncEditorFromDom();
  };

  const handleScriptElementApply = (key: ScriptElementKey) => {
    setScriptElement(key);
    if (editorRef.current) {
      applyScriptElement(editorRef.current, key);
      syncEditorFromDom();
    }
  };

  const handleScriptKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editorRef.current) {
        handleScriptEnter(editorRef.current, scriptElement);
        syncEditorFromDom();
      }
    }
  };

  const handleEditorInput = () => {
    syncEditorFromDom();
  };

  // Interactive AI Tools States
  const [analyzerPlatform, setAnalyzerPlatform] = useState("PocketFM");
  const [analyzerGenre, setAnalyzerGenre] = useState("Romance");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // AI Analyzer Workspace states
  const [analyzerSelectedProjectId, setAnalyzerSelectedProjectId] = useState("");
  const [analyzerSelectedChapterId, setAnalyzerSelectedChapterId] = useState("");
  const [analyzerChapters, setAnalyzerChapters] = useState<any[]>([]);
  const [analyzerContent, setAnalyzerContent] = useState("");
  const [isSavingAnalyzerContent, setIsSavingAnalyzerContent] = useState(false);

  useEffect(() => {
    if (catalogPlatforms.length && !catalogPlatforms.some((item) => item.id === analyzerPlatform)) {
      setAnalyzerPlatform(catalogPlatforms[0].id);
    }
    if (catalogGenres.length && !catalogGenres.some((item) => item.id === analyzerGenre)) {
      setAnalyzerGenre(catalogGenres[0].id);
    }
  }, [catalogPlatforms, catalogGenres, analyzerPlatform, analyzerGenre]);

  useEffect(() => {
    if (!analyzerSelectedProjectId) {
      setAnalyzerChapters([]);
      setAnalyzerSelectedChapterId("");
      setAnalyzerContent("");
      return;
    }

    const fetchProjChapters = async () => {
      try {
        const response = await api.get(`/projects/${analyzerSelectedProjectId}/chapters`);
        const chaps = response.data || [];
        setAnalyzerChapters(chaps);
        if (chaps.length > 0) {
          setAnalyzerSelectedChapterId(chaps[0].id);
          setAnalyzerContent(chaps[0].content || "");
        } else {
          setAnalyzerSelectedChapterId("");
          setAnalyzerContent("");
        }
      } catch (err) {
        console.error("Failed to load chapters for analyzer:", err);
      }
    };

    fetchProjChapters();
  }, [analyzerSelectedProjectId]);

  useEffect(() => {
    if (!analyzerSelectedChapterId || !analyzerChapters.length) return;
    const selected = analyzerChapters.find(c => c.id === analyzerSelectedChapterId);
    if (selected) {
      setAnalyzerContent(selected.content || "");
    }
  }, [analyzerSelectedChapterId, analyzerChapters]);

  const handleSaveAnalyzerContent = async () => {
    if (!analyzerSelectedProjectId || !analyzerSelectedChapterId) return;
    setIsSavingAnalyzerContent(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      await api.put(`/projects/${analyzerSelectedProjectId}/chapters/${analyzerSelectedChapterId}`, {
        content: analyzerContent,
        localDateStr: todayStr,
      });
      triggerToast("Chapter saved successfully! ✓");
      setAnalyzerChapters(prev => prev.map(c => c.id === analyzerSelectedChapterId ? { ...c, content: analyzerContent } : c));
    } catch (err) {
      console.error("Failed to save chapter content from analyzer:", err);
      triggerToast("Failed to save chapter.");
    } finally {
      setIsSavingAnalyzerContent(false);
    }
  };

  const [polishingText, setPolishingText] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishingResult, setPolishingResult] = useState<string>("");

  // Interactive WEALTH Engine states
  const [wealthSubTab, setWealthSubTab] = useState("jobs");
  const [blurbTitle, setBlurbTitle] = useState("");
  const [blurbGenre, setBlurbGenre] = useState("Werewolf Romance");
  const [isGeneratingBlurb, setIsGeneratingBlurb] = useState(false);
  const [generatedBlurb, setGeneratedBlurb] = useState("");

  const [bioName, setBioName] = useState("");
  const [bioGenre, setBioGenre] = useState("");
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [generatedBio, setGeneratedBio] = useState("");

  const [queryTitle, setQueryTitle] = useState("");
  const [queryGenre, setQueryGenre] = useState("");
  const [querySummary, setQuerySummary] = useState("");
  const [isGeneratingQuery, setIsGeneratingQuery] = useState(false);
  const [generatedQuery, setGeneratedQuery] = useState("");

  // Chapter compliance scan request
  const runChapterAnalysis = async () => {
    if (!analyzerSelectedProjectId || !analyzerSelectedChapterId || !analyzerContent.trim()) {
      triggerToast("Please select a novel and ensure the chapter has content.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const selectedChap = analyzerChapters.find(c => c.id === analyzerSelectedChapterId);
    const chapterTitle = selectedChap ? selectedChap.title : "Chapter 1";

    try {
      const response = await api.post(`/projects/${analyzerSelectedProjectId}/analyze`, {
        content: analyzerContent,
        platform: analyzerPlatform,
        genre: analyzerGenre,
        chapterTitle,
        chapterId: analyzerSelectedChapterId,
      });
      setAnalysisResult(response.data);
      triggerToast("AI analysis complete! 🔥");
    } catch (err: any) {
      console.error("AI analysis failed:", err);
      if (err.response?.data?.limitExceeded) {
          openPaywall("AI Chapter Analyzer");
      } else {
        triggerToast(err.response?.data?.error || "AI Analysis failed.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runProsePolishing = () => {
    if (!polishingText.trim()) {
      triggerToast("Please write or paste prose to polish.");
      return;
    }
    setIsPolishing(true);
    setPolishingResult("");

    setTimeout(() => {
      setIsPolishing(false);
      setPolishingResult(
        `Polished Version:\n\n${polishingText
          .replace(/says/g, "argues")
          .replace(/very/g, "immensely")
          .replace(/good/g, "stellar")}\n\n[Polishing edits applied: Enhanced dialogue verbs, polished syntax flow.]`
      );
      triggerToast("Prose polished!");
    }, 1000);
  };

  const runBlurbGenerator = () => {
    if (!blurbTitle.trim()) {
      triggerToast("Please enter a title.");
      return;
    }
    setIsGeneratingBlurb(true);
    setGeneratedBlurb("");
    setTimeout(() => {
      setIsGeneratingBlurb(false);
      setGeneratedBlurb(
        `Blurb: In the shadows of a fated destiny, "${blurbTitle}" follows a scorned hero rising to claim power in a dark romance werewolf thriller. Perfect for serialization fans.`
      );
      triggerToast("Blurb generated!");
    }, 1000);
  };

  const runBioGenerator = () => {
    if (!bioName.trim()) {
      triggerToast("Please enter a pen name.");
      return;
    }
    setIsGeneratingBio(true);
    setGeneratedBio("");
    setTimeout(() => {
      setIsGeneratingBio(false);
      setGeneratedBio(
        `Author Bio: ${bioName} is an urban fantasy and romance writer specializing in fast-paced serialized fiction. Driven by cliffhangers and fated mate character dynamics.`
      );
      triggerToast("Bio generated!");
    }, 1000);
  };

  const runQueryBuilder = () => {
    if (!queryTitle.trim()) {
      triggerToast("Please enter a title.");
      return;
    }
    setIsGeneratingQuery(true);
    setGeneratedQuery("");
    setTimeout(() => {
      setIsGeneratingQuery(false);
      setGeneratedQuery(
        `Subject: Query Letter - ${queryTitle} (${queryGenre})\n\nDear Acquisitions Editor,\n\nI am writing to pitch my serialized project "${queryTitle}", an urban ${queryGenre} fiction draft of 50,000 words. Ready for review.\n\nBest,\nWriter`
      );
      triggerToast("Query built!");
    }, 1000);
  };

  // Dynamic filter for sidebar search
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  if (loading || (!loading && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="dashboard-shell h-screen overflow-hidden bg-[#080808] text-[#F0EBE0] font-sans flex flex-col">
      <Navbar />

      {/* Main Layout Split Screen Area */}
      <div className="flex-grow flex relative items-stretch overflow-hidden min-h-0">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="hidden lg:flex w-64 bg-[#0f0f0f] border-r border-[#242424] flex-col shrink-0 h-full">
          
          {/* Welcome User Section */}
          <div className="p-6 border-b border-[#242424] space-y-1">
            <span className="text-[10px] text-[#606060] font-bold uppercase tracking-widest block">
              {content.sidebarWelcome || "Welcome back"}
            </span>
            <h3 className="font-serif text-base font-black text-[var(--gd)] leading-tight truncate">
              {profile?.displayName || "Writer"}
            </h3>
          </div>

          {/* Daily Streak Counter Widget (Connected to Backend) */}
          <div className="p-4 bg-[#161616]/60 border border-[#242424] rounded-xl space-y-2.5 mx-4 my-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center justify-center shrink-0">
                <Flame className="h-5 w-5 text-orange-500 fill-current" />
              </div>
              <div>
                <span className="text-[10px] text-[#F0EBE0] font-bold block leading-none">
                  {writingStreak} Days Streak 🔥
                </span>
                <span className="text-[8px] text-[#606060] block mt-1">
                  Words: {totalWordsWritten.toLocaleString()}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[9px] py-1.5"
              onClick={handleRecordWritingSession}
              isLoading={isRecordingStreak}
            >
              Record Today (+1k Words)
            </Button>
          </div>



          {/* Navigation Items */}
          <div className="px-3 flex-grow space-y-0.5 text-xs mt-3 overflow-y-auto custom-scrollbar">
            <button
              onClick={() => goToTab("home")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-bold text-left transition-colors ${
                activeTab === "home" ? "bg-[var(--gd)]/10 text-[var(--gd)]" : "text-[#909090] hover:text-white"
              }`}
            >
              <Home className="h-4 w-4" /> Dashboard
            </button>

            <button
              onClick={() => goToTab("novels-list")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-bold text-left transition-colors ${
                activeTab === "novels-list" || activeTab === "view-novel" || activeTab === "novel"
                  ? "bg-[var(--gd)]/10 text-[var(--gd)]"
                  : "text-[#909090] hover:text-white"
              }`}
            >
              <BookOpen className="h-4 w-4" /> Novels
            </button>

            <button
              onClick={() => goToTab("scripts-list")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-bold text-left transition-colors ${
                activeTab === "scripts-list" || activeTab === "view-script" || activeTab === "script"
                  ? "bg-[var(--gd)]/10 text-[var(--gd)]"
                  : "text-[#909090] hover:text-white"
              }`}
            >
              <Clapperboard className="h-4 w-4" /> Scripts
            </button>

            <button
              onClick={() => goToTab("tools")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-bold text-left transition-colors ${
                activeTab === "tools" || activeTab === "ghost-writer" || activeTab === "smart-edit" || activeTab === "analyzer-workspace" ? "bg-[var(--gd)]/10 text-[var(--gd)]" : "text-[#909090] hover:text-white"
              }`}
            >
              <Wrench className="h-4 w-4" /> Quick Tools
            </button>

            <button
              onClick={() => goToTab("wealth")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-bold text-left transition-colors ${
                activeTab === "wealth" ? "bg-[var(--gd)]/10 text-[var(--gd)]" : "text-[#909090] hover:text-white"
              }`}
            >
              <Coins className="h-4 w-4" /> WEALTH Engine
            </button>

            <button
              onClick={() => goToTab("student")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-bold text-left transition-colors ${
                activeTab === "student" ? "bg-[var(--gd)]/10 text-[var(--gd)]" : "text-[#909090] hover:text-white"
              }`}
            >
              <GraduationCap className="h-4 w-4" /> Student Hub
            </button>

            <button
              onClick={() => goToTab("profile")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-bold text-left transition-colors ${
                activeTab === "profile" ? "bg-[var(--gd)]/10 text-[var(--gd)]" : "text-[#909090] hover:text-white"
              }`}
            >
              <Settings className="h-4 w-4" /> Profile & Settings
            </button>
          </div>

        </aside>

        {/* RIGHT WORKSPACE PANELS */}
        <div className="dashboard-scroll-main flex-grow flex flex-col relative overflow-y-auto overflow-x-hidden h-full min-h-0 custom-scrollbar pb-16">
          
          {/* Toast Notification */}
          {toastMessage && (
            <Toast message={toastMessage} onClose={() => setToastMessage("")} />
          )}

          {/* Project creation Modal */}
          <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Project">
            <div className="space-y-5">
              <Input
                label="Project Name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Scorned She-wolf"
              />
              
              <div className="space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#909090]">
                  Project Type
                </span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="radio"
                      name="projType"
                      value="novel"
                      checked={newProjectType === "novel"}
                      onChange={() => setNewProjectType("novel")}
                      className="accent-[var(--gd)] h-4 w-4"
                    />
                    Novel
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="radio"
                      name="projType"
                      value="script"
                      checked={newProjectType === "script"}
                      onChange={() => setNewProjectType("script")}
                      className="accent-[var(--gd)] h-4 w-4"
                    />
                    Script / Screenplay
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} isLoading={isCreatingProject}>
                  Create Project
                </Button>
              </div>
            </div>
          </Modal>

          {/* Modals check */}
          <PaywallModal
            isOpen={isPaywallOpen}
            onClose={() => setIsPaywallOpen(false)}
            featureName={paywallFeature}
            onUpgrade={() => triggerToast("Upgrading plan...")}
          />

          <ConfirmationModal
            isOpen={isLogoutConfirmOpen}
            onClose={() => setIsLogoutConfirmOpen(false)}
            onConfirm={handleLogoutConfirm}
            title="Sign Out Session"
            description="Are you sure you want to end your current writing session?"
            confirmText="Yes, Sign Out"
            cancelText="No, Keep Writing"
            variant="danger"
          />

          <ConfirmationModal
            isOpen={isDeleteConfirmOpen}
            onClose={() => setIsDeleteConfirmOpen(false)}
            onConfirm={handleDeleteProject}
            title="Delete Project"
            description="Are you sure you want to delete this project? All chapters and draft histories will be permanently removed from Firestore."
            confirmText="Delete Project"
            cancelText="Keep Draft"
            variant="danger"
            isLoading={isDeletingProject}
          />

          <ConfirmationModal
            isOpen={isDeleteChapterOpen}
            onClose={() => {
              setIsDeleteChapterOpen(false);
              setDeleteChapterTarget(null);
            }}
            onConfirm={handleDeleteChapter}
            title={activeProject?.type === "script" ? "Delete Scene" : "Delete Chapter"}
            description={`Delete "${deleteChapterTarget?.title || "this chapter"}"? This cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            isLoading={isDeletingChapter}
          />

          <Modal
            isOpen={Boolean(renameChapterTarget)}
            onClose={() => setRenameChapterTarget(null)}
            title={activeProject?.type === "script" ? "Rename Scene" : "Rename Chapter"}
          >
            <div className="space-y-4">
              <Input
                label="Title"
                value={renameChapterTitle}
                onChange={(e) => setRenameChapterTitle(e.target.value)}
                placeholder={activeProject?.type === "script" ? "Scene 1" : "Chapter 1"}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setRenameChapterTarget(null)}>
                  Cancel
                </Button>
                <Button size="sm" isLoading={isRenamingChapter} onClick={handleRenameChapter}>
                  Save name
                </Button>
              </div>
            </div>
          </Modal>

          {/* MAIN DISPLAY CONTENT */}
          <main className="flex-grow p-6 md:p-10 max-w-5xl w-full mx-auto max-lg:pt-8">
            
            {/* TAB: AI ANALYZER WORKSPACE */}
            {activeTab === "analyzer-workspace" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-[#242424] pb-4">
                  <div>
                    <h2 className="font-serif text-2xl md:text-3xl font-black text-white">AI Chapter Analyzer</h2>
                    <p className="text-xs text-[#909090] mt-1">Verify editorial compliance against target serialization platforms.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => goToTab("tools")}>
                    Back to Tools
                  </Button>
                </div>

                <div className="rounded-2xl border border-[#242424] bg-gradient-to-b from-[#161000] to-[#0c0c0c] p-5 md:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gd)] mb-4">
                    How it works
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 xl:gap-2">
                    {[
                      {
                        step: "01",
                        title: "Pick a novel",
                        desc: "Choose the project you want to scan from Novel Editor.",
                      },
                      {
                        step: "02",
                        title: "Open a chapter",
                        desc: "Load the chapter text. You can still edit it before running.",
                      },
                      {
                        step: "03",
                        title: "Set platform & genre",
                        desc: "Match PocketFM, Dreame, WebNovel and the rest — plus genre.",
                      },
                      {
                        step: "04",
                        title: "Run analysis",
                        desc: "GPT scores hooks, pacing, conflict, emotion, and cliffhangers.",
                      },
                      {
                        step: "05",
                        title: "Fix from the report",
                        desc: "Read the scores on the right, revise, then scan again.",
                      },
                    ].map((item, index) => (
                      <div key={item.step} className="relative flex gap-3 xl:flex-col xl:gap-3">
                        {index < 4 ? (
                          <span
                            className="hidden xl:block absolute top-4 left-[2.15rem] right-[-0.5rem] h-px bg-gradient-to-r from-[var(--gm)]/70 to-transparent"
                            aria-hidden
                          />
                        ) : null}
                        <div className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--gm)] bg-[#1a1200] text-[10px] font-bold text-[var(--gd)]">
                          {item.step}
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif text-sm font-bold text-white">{item.title}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-[#909090]">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Form & Editor */}
                  <div className="lg:col-span-7 space-y-6">
                    <Card hoverable={false} className="p-6 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                          label="Select Novel"
                          options={[
                            { label: "Choose a novel...", value: "" },
                            ...projects.filter(p => p.type === "novel").map(p => ({ label: p.name, value: p.id }))
                          ]}
                          value={analyzerSelectedProjectId}
                          onChange={(e) => setAnalyzerSelectedProjectId(e.target.value)}
                          className="bg-zinc-950"
                        />

                        {analyzerSelectedProjectId && (
                          <Select
                            label="Select Chapter"
                            options={analyzerChapters.map(c => ({ label: c.title, value: c.id }))}
                            value={analyzerSelectedChapterId}
                            onChange={(e) => setAnalyzerSelectedChapterId(e.target.value)}
                            className="bg-zinc-950"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#242424] pt-4">
                        <Select
                          label="Target Platform"
                          options={catalogPlatforms.map((item) => ({ label: item.name, value: item.id }))}
                          value={analyzerPlatform}
                          onChange={(e) => setAnalyzerPlatform(e.target.value)}
                          className="bg-zinc-950 text-[var(--gd)]"
                        />

                        <Select
                          label="Genre Focus"
                          options={catalogGenres.map((item) => ({ label: item.name, value: item.id }))}
                          value={analyzerGenre}
                          onChange={(e) => setAnalyzerGenre(e.target.value)}
                          className="bg-zinc-950 text-[var(--gd)]"
                        />
                      </div>

                      {analyzerSelectedProjectId && analyzerSelectedChapterId ? (
                        <div className="space-y-4 border-t border-[#242424] pt-4">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#909090]">
                            Chapter Content Editor
                          </span>
                          <Textarea
                            value={analyzerContent}
                            onChange={(e) => setAnalyzerContent(e.target.value)}
                            className="min-h-[300px] bg-zinc-950 leading-relaxed font-serif text-sm text-[#F0EBE0]"
                            placeholder="Write or edit chapter content here..."
                          />
                          <div className="flex gap-3 justify-end">
                            <Button 
                              variant="outline" 
                              onClick={handleSaveAnalyzerContent}
                              isLoading={isSavingAnalyzerContent}
                            >
                              <Save className="h-4 w-4 mr-1.5 inline text-[var(--gd)]" /> Save Chapter
                            </Button>
                            <Button 
                              onClick={runChapterAnalysis}
                              isLoading={isAnalyzing}
                            >
                              <Sparkles className="h-4 w-4 mr-1.5 inline text-orange-500 fill-current" /> Run Analysis
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-xs text-[#606060] border border-dashed border-[#242424] rounded-2xl">
                          Select a novel and chapter above to open the content workspace.
                        </div>
                      )}
                    </Card>

                    <AiToolFeedback
                      tool="chapter-analyzer"
                      title="Analyzer Feedback"
                      description="Tell us if the Chapter Analyzer is working correctly and share any problems you are facing."
                      context={{
                        platform: analyzerPlatform,
                        genre: analyzerGenre,
                        projectId: analyzerSelectedProjectId,
                        chapterId: analyzerSelectedChapterId,
                        chapterTitle:
                          analyzerChapters.find((c) => c.id === analyzerSelectedChapterId)?.title || "",
                      }}
                    />
                  </div>

                  {/* Right Column: AI Analysis Reports */}
                  <div className="lg:col-span-5 space-y-6">
                    {isAnalyzing ? (
                      <Card hoverable={false} className="p-8 text-center space-y-4 min-h-[400px] flex flex-col justify-center items-center">
                        <Loader size="lg" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white">AI Engine Running compliance scan...</p>
                          <p className="text-[10px] text-[#606060]">GPT model is evaluating hooks, emotional pacing, conflict depth and cliffhangers.</p>
                        </div>
                      </Card>
                    ) : analysisResult ? (
                      <Card hoverable={false} className="p-6 space-y-6 animate-fadeIn bg-zinc-950/40 border border-[#242424]">
                        {/* Score Circular Progress Ring & Verdict */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[#242424] pb-5">
                          <div className="flex items-center gap-4">
                            <ScoreRing score={analysisResult.overall_score || 0} />
                            <div>
                              <span className="text-[9px] text-[#606060] font-bold uppercase tracking-wider block">Overall Score</span>
                              <span className="font-serif text-2xl font-black text-white mt-0.5 block">{analysisResult.overall_score || 0}% Quality</span>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Badge variant={
                                  analysisResult.verdict === "STRONG PASS" ? "green" :
                                  analysisResult.verdict === "PASS WITH REVISIONS" ? "gold" :
                                  analysisResult.verdict === "REVISE AND RESUBMIT" ? "gold" : "red"
                                }>
                                  {analysisResult.verdict || "REVISE"}
                                </Badge>
                                <Badge variant={
                                  analysisResult.unlock_potential === "HIGH" ? "green" :
                                  analysisResult.unlock_potential === "MEDIUM" ? "gold" : "red"
                                } className={analysisResult.unlock_potential === "HIGH" ? "animate-pulse" : ""}>
                                  Unlock: {analysisResult.unlock_potential || "LOW"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Editor Note Box */}
                        {analysisResult.editor_note && (
                          <div className="bg-[#161616] border border-[#242424] p-4 rounded-xl relative overflow-hidden font-serif italic text-xs text-[#f0ebe0] pl-6 border-l-2 border-l-[var(--gd)]">
                            "{analysisResult.editor_note}"
                          </div>
                        )}

                        {/* Pacing, Hook, Conflict progress bars */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Editorial Metrics</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {Object.entries(analysisResult.scores || {}).map(([key, val]: [string, any]) => (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between text-[9px] uppercase font-bold tracking-wider">
                                  <span className="text-[#606060]">{key.replace(/_/g, ' ')}</span>
                                  <span className="text-white">{val}/10</span>
                                </div>
                                <div className="h-1.5 bg-[#242424] rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-500" 
                                    style={{ 
                                      width: `${val * 10}%`,
                                      backgroundColor: val >= 8 ? '#52C07A' : val >= 5 ? 'var(--gd)' : '#E11D48' 
                                    }} 
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Strengths Highlights */}
                        {analysisResult.strengths?.length > 0 && (
                          <div className="space-y-2 border-t border-[#242424] pt-4">
                            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">✓ Strengths / Highlights</h4>
                            <ul className="list-disc pl-4 text-[11px] text-[#909090] space-y-1.5 leading-relaxed">
                              {analysisResult.strengths.map((str: string, idx: number) => (
                                <li key={idx}>{str}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Issues Checklist */}
                        {analysisResult.issues?.length > 0 && (
                          <div className="space-y-3 border-t border-[#242424] pt-4">
                            <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider">✕ Issues & Recommended Fixes</h4>
                            <div className="space-y-2.5">
                              {analysisResult.issues.map((issue: any, idx: number) => (
                                <div key={idx} className="bg-red-500/5 border border-red-500/10 p-3.5 rounded-xl space-y-2 text-xs">
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span className="text-red-400">⚠</span> {issue.label}
                                  </div>
                                  <p className="text-[10px] text-[#909090] leading-relaxed">{issue.detail}</p>
                                  <div className="bg-[#161616] p-2.5 rounded border border-[#242424] text-[10px] text-emerald-400 leading-relaxed">
                                    <span className="font-bold uppercase text-[7px] text-zinc-500 block mb-0.5">Recommended Fix</span>
                                    {issue.fix}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Line Edits Suggestions */}
                        {analysisResult.line_edits?.length > 0 && (
                          <div className="space-y-3 border-t border-[#242424] pt-4">
                            <h4 className="text-[10px] font-bold text-[var(--gd)] uppercase tracking-wider">✎ Line-Level Editing</h4>
                            <div className="space-y-3">
                              {analysisResult.line_edits.map((edit: any, idx: number) => (
                                <div key={idx} className="bg-zinc-950/60 border border-[#242424] rounded-xl p-3.5 space-y-2.5 text-xs">
                                  <div className="space-y-1.5">
                                    <div className="bg-red-950/20 text-red-200 p-2 rounded border border-red-900/20 text-[10px] font-mono leading-normal select-text break-words">
                                      <span className="text-[8px] text-red-400 block font-bold uppercase tracking-wide mb-0.5">Original</span>
                                      "{edit.original}"
                                    </div>
                                    <div className="bg-emerald-950/20 text-emerald-200 p-2 rounded border border-emerald-900/20 text-[10px] font-mono leading-normal select-text break-words">
                                      <span className="text-[8px] text-emerald-400 block font-bold uppercase tracking-wide mb-0.5">Suggested</span>
                                      "{edit.suggestion}"
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-[#909090] italic pl-2 border-l border-zinc-700 leading-relaxed">
                                    <span className="font-bold text-zinc-500 uppercase text-[8px] block not-italic">Reasoning</span>
                                    {edit.reason}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trending Tropes Fit */}
                        {analysisResult.trending_tropes_fit && (
                          <div className="bg-[var(--gd)]/5 border border-[var(--gd)]/25 p-4 rounded-xl space-y-1.5 text-xs">
                            <span className="text-[9px] text-[var(--gd)] font-bold tracking-widest uppercase block">Trending Tropes Fit</span>
                            <p className="text-[#F0EBE0] leading-relaxed font-serif italic">"{analysisResult.trending_tropes_fit}"</p>
                          </div>
                        )}
                      </Card>
                    ) : (
                      <Card className="p-8 text-center min-h-[400px] flex flex-col justify-center items-center text-xs text-[#606060] space-y-3">
                        <Sparkles className="h-8 w-8 text-[#606060]/50" />
                        <p>No analysis run yet.</p>
                        <p className="text-[10px] max-w-[200px] mx-auto text-[#606060]/80">Select a chapter above, target platform/genre and click "Run Analysis".</p>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MY NOVELS LIST PAGE */}
            {activeTab === "novels-list" && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#242424] pb-4">
                  <div>
                    <h2 className="font-serif text-2xl md:text-3xl font-black text-white">My Novels</h2>
                    <p className="text-xs text-[#909090] mt-1">Manage and write your serialized web novels.</p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Segmented switch toggle */}
                    <div className="flex items-center gap-1 bg-[#161616] border border-[#242424] p-1 rounded-xl shrink-0">
                      <button
                        onClick={() => goToTab("novels-list")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                          (activeTab as string) === "novels-list"
                            ? "bg-[var(--gd)] text-[#080808]"
                            : "text-[#909090] hover:text-white"
                        }`}
                      >
                        Novels
                      </button>
                      <button
                        onClick={() => goToTab("scripts-list")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                          (activeTab as string) === "scripts-list"
                            ? "bg-red-600 text-white"
                            : "text-[#909090] hover:text-white"
                        }`}
                      >
                        Scripts
                      </button>
                    </div>

                    <Button 
                      onClick={() => {
                        setNewProjectType("novel");
                        setIsCreateOpen(true);
                      }} 
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1.5 inline" /> Add Novel
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#242424] bg-gradient-to-b from-[#161000] to-[#0c0c0c] p-5 md:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gd)] mb-4">
                    Features
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      "Chapter-by-chapter writing and saving",
                      "Live word count display",
                      "Platform selector — write for your target platform",
                      "Auto-save to your account",
                      "Bold, italic, quote formatting",
                      "One-tap Chapter Analyzer integration",
                    ].map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-2.5 rounded-xl border border-[#242424] bg-[#0c0c0c]/80 px-3.5 py-3"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--gm)]/60 bg-[#1a1200] text-[10px] font-bold text-[var(--gd)]">
                          ✓
                        </span>
                        <p className="text-[12px] leading-snug text-[#F0EBE0]">{feature}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.filter(p => p.type === "novel").length > 0 ? (
                    projects.filter(p => p.type === "novel").map((p) => {
                      const words = p.totalWordsWritten || 0;
                      return (
                        <div
                          key={p.id}
                          className="relative group bg-[#161616] border border-[#242424] hover:border-[var(--gd)]/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-[var(--gd)]/5 overflow-hidden flex flex-col justify-between min-h-[160px]"
                        >
                          <div className="space-y-2">
                            <h3 className="font-serif text-lg font-black text-white group-hover:text-[var(--gd)] transition-colors line-clamp-1">
                              {p.name}
                            </h3>
                            <div className="flex items-center gap-3 text-[10px] text-[#606060] font-semibold tracking-wider uppercase">
                              <span>Novel</span>
                              <span>•</span>
                              <span>{words.toLocaleString()} words</span>
                            </div>
                          </div>

                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-[#080808]/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                            <button
                              onClick={() => handleViewProjectDetails(p)}
                              className="flex items-center gap-1.5 bg-[#161616] border border-[#242424] hover:border-[var(--gd)]/50 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all duration-200"
                            >
                              <Eye className="h-4 w-4 text-[var(--gd)]" /> Open
                            </button>
                            <button
                              onClick={() => handleSelectProject(p)}
                              className="flex items-center gap-1.5 bg-[var(--gd)] hover:bg-[var(--gl)] px-4 py-2 rounded-xl text-[#080808] text-xs font-bold transition-all duration-200"
                            >
                              <FileEdit className="h-4 w-4" /> Edit
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-16 border border-dashed border-[#242424] rounded-2xl text-xs text-[#606060] space-y-4">
                      <p>You haven't added any novels yet.</p>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setNewProjectType("novel");
                          setIsCreateOpen(true);
                        }}
                      >
                        + Create First Novel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MY SCRIPTS LIST PAGE */}
            {activeTab === "scripts-list" && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#242424] pb-4">
                  <div>
                    <h2 className="font-serif text-2xl md:text-3xl font-black text-white">My Scripts</h2>
                    <p className="text-xs text-[#909090] mt-1">Manage and format screenplays for screen production.</p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Segmented switch toggle */}
                    <div className="flex items-center gap-1 bg-[#161616] border border-[#242424] p-1 rounded-xl shrink-0">
                      <button
                        onClick={() => goToTab("novels-list")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                          (activeTab as string) === "novels-list"
                            ? "bg-[var(--gd)] text-[#080808]"
                            : "text-[#909090] hover:text-white"
                        }`}
                      >
                        Novels
                      </button>
                      <button
                        onClick={() => goToTab("scripts-list")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                          (activeTab as string) === "scripts-list"
                            ? "bg-red-600 text-white"
                            : "text-[#909090] hover:text-white"
                        }`}
                      >
                        Scripts
                      </button>
                    </div>

                    <Button 
                      onClick={() => {
                        setNewProjectType("script");
                        setIsCreateOpen(true);
                      }} 
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1.5 inline" /> Add Script
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#242424] bg-gradient-to-b from-[#1a080c] to-[#0c0c0c] p-5 md:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-400 mb-4">
                    Features
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      "Scene-by-scene writing and saving",
                      "Courier Prime Hollywood screenplay format",
                      "One-tap elements — heading, action, character, dialogue",
                      "Parentheticals, transitions, and Enter-to-next-element",
                      "Bold, italic, color, and quote formatting",
                      "Auto-save, live word count, and Ghost Writer save-in",
                    ].map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-2.5 rounded-xl border border-[#242424] bg-[#0c0c0c]/80 px-3.5 py-3"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-red-500/50 bg-[#2a0a10] text-[10px] font-bold text-red-400">
                          ✓
                        </span>
                        <p className="text-[12px] leading-snug text-[#F0EBE0]">{feature}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.filter(p => p.type === "script").length > 0 ? (
                    projects.filter(p => p.type === "script").map((p) => {
                      const words = p.totalWordsWritten || 0;
                      return (
                        <div
                          key={p.id}
                          className="relative group bg-[#161616] border border-[#242424] hover:border-[#E11D48]/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-[#E11D48]/5 overflow-hidden flex flex-col justify-between min-h-[160px]"
                        >
                          <div className="space-y-2">
                            <h3 className="font-serif text-lg font-black text-white group-hover:text-red-500 transition-colors line-clamp-1">
                              {p.name}
                            </h3>
                            <div className="flex items-center gap-3 text-[10px] text-[#606060] font-semibold tracking-wider uppercase">
                              <span>Screenplay</span>
                              <span>•</span>
                              <span>{words.toLocaleString()} words</span>
                            </div>
                          </div>

                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-[#080808]/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                            <button
                              onClick={() => handleViewProjectDetails(p)}
                              className="flex items-center gap-1.5 bg-[#161616] border border-[#242424] hover:border-[#E11D48]/50 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all duration-200"
                            >
                              <Eye className="h-4 w-4 text-red-500" /> Open
                            </button>
                            <button
                              onClick={() => handleSelectProject(p)}
                              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all duration-200"
                            >
                              <FileEdit className="h-4 w-4" /> Edit
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-16 border border-dashed border-[#242424] rounded-2xl text-xs text-[#606060] space-y-4">
                      <p>You haven't added any scripts yet.</p>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setNewProjectType("script");
                          setIsCreateOpen(true);
                        }}
                      >
                        + Create First Script
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DETAILED VIEW NOVEL PAGE */}
            {activeTab === "view-novel" && selectedViewProject && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#242424] pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="gold">Novel</Badge>
                      <span className="text-[10px] text-[#606060] uppercase font-bold tracking-wider">Project ID: {selectedViewProject.id.slice(0, 8)}...</span>
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl font-black text-white">{selectedViewProject.name}</h2>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => goToTab("novels-list")}>
                      Back to list
                    </Button>
                    <Button size="sm" onClick={() => handleSelectProject(selectedViewProject)}>
                      <PenTool className="h-4 w-4 mr-1.5 inline" /> Open in Editor
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Metadata & Chapters Index */}
                  <div className="lg:col-span-1 space-y-6">
                    <Card hoverable={false} className="p-5 space-y-4">
                      <h3 className="font-serif text-sm font-bold text-white border-b border-[#242424] pb-2">Novel Details</h3>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#606060]">Total Words:</span>
                          <span className="font-bold text-white">{(selectedViewProject.totalWordsWritten || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#606060]">Chapters:</span>
                          <span className="font-bold text-white">{viewProjectChapters.length} Chapters</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#606060]">Created On:</span>
                          <span className="text-white">
                            {selectedViewProject.createdAt ? new Date(selectedViewProject.createdAt).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </div>
                    </Card>

                    <Card hoverable={false} className="p-5 space-y-4">
                      <h3 className="font-serif text-sm font-bold text-white border-b border-[#242424] pb-2">Chapters List</h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {isViewChaptersLoading ? (
                          <div className="py-4 text-center"><Loader size="sm" /></div>
                        ) : viewProjectChapters.length > 0 ? (
                          viewProjectChapters.map((chap, idx) => (
                            <button
                              key={chap.id}
                              onClick={() => setActivePreviewChapter(chap)}
                              className={`w-full flex justify-between items-center p-2.5 rounded-lg text-xs transition-colors ${
                                activePreviewChapter?.id === chap.id
                                  ? "bg-[var(--gd)]/10 border border-[var(--gd)]/20 text-[var(--gd)] font-semibold"
                                  : "bg-zinc-950 border border-zinc-900 text-[#909090] hover:text-white"
                              }`}
                            >
                              <span>{chap.title}</span>
                              <span className="text-[10px] opacity-75">{(chap.wordCount || 0).toLocaleString()} w</span>
                            </button>
                          ))
                        ) : (
                          <p className="text-[10px] text-[#606060] text-center py-4">No chapters created yet.</p>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Right Column: Reading Preview Area */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card hoverable={false} className="p-6 md:p-8 min-h-[400px] flex flex-col justify-between bg-zinc-950/40">
                      {activePreviewChapter ? (
                        <div className="space-y-6">
                          <div className="border-b border-[#242424] pb-4">
                            <h3 className="font-serif text-xl font-bold text-white">{activePreviewChapter.title}</h3>
                            <span className="text-[10px] text-[#606060] mt-1 block">{(activePreviewChapter.wordCount || 0).toLocaleString()} words written in this chapter</span>
                          </div>
                          
                          <div 
                            className="text-sm text-[#F0EBE0] leading-relaxed max-w-none select-text whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-2 custom-scrollbar font-serif"
                            dangerouslySetInnerHTML={{ __html: activePreviewChapter.content || "<p className='italic text-[#606060]'>This chapter is empty.</p>" }}
                          />
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center text-xs text-[#606060] py-12">
                          <BookOpen className="h-10 w-10 text-[#606060]/50 mb-3" />
                          <p>Select a chapter from the list to preview its contents.</p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* DETAILED VIEW SCRIPT PAGE */}
            {activeTab === "view-script" && selectedViewProject && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#242424] pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="red">Screenplay</Badge>
                      <span className="text-[10px] text-[#606060] uppercase font-bold tracking-wider">Project ID: {selectedViewProject.id.slice(0, 8)}...</span>
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl font-black text-white">{selectedViewProject.name}</h2>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => goToTab("scripts-list")}>
                      Back to list
                    </Button>
                    <Button size="sm" onClick={() => handleSelectProject(selectedViewProject)}>
                      <PenTool className="h-4 w-4 mr-1.5 inline" /> Open in Editor
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Metadata & Scenes Index */}
                  <div className="lg:col-span-1 space-y-6">
                    <Card hoverable={false} className="p-5 space-y-4">
                      <h3 className="font-serif text-sm font-bold text-white border-b border-[#242424] pb-2">Screenplay Details</h3>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#606060]">Total Words:</span>
                          <span className="font-bold text-white">{(selectedViewProject.totalWordsWritten || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#606060]">Scenes / Chapters:</span>
                          <span className="font-bold text-white">{viewProjectChapters.length} Scenes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#606060]">Created On:</span>
                          <span className="text-white">
                            {selectedViewProject.createdAt ? new Date(selectedViewProject.createdAt).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </div>
                    </Card>

                    <Card hoverable={false} className="p-5 space-y-4">
                      <h3 className="font-serif text-sm font-bold text-white border-b border-[#242424] pb-2">Scenes List</h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {isViewChaptersLoading ? (
                          <div className="py-4 text-center"><Loader size="sm" /></div>
                        ) : viewProjectChapters.length > 0 ? (
                          viewProjectChapters.map((chap, idx) => (
                            <button
                              key={chap.id}
                              onClick={() => setActivePreviewChapter(chap)}
                              className={`w-full flex justify-between items-center p-2.5 rounded-lg text-xs transition-colors ${
                                activePreviewChapter?.id === chap.id
                                  ? "bg-red-500/10 border border-red-500/20 text-red-500 font-semibold"
                                  : "bg-zinc-950 border border-zinc-900 text-[#909090] hover:text-white"
                              }`}
                            >
                              <span>{chap.title}</span>
                              <span className="text-[10px] opacity-75">{(chap.wordCount || 0).toLocaleString()} w</span>
                            </button>
                          ))
                        ) : (
                          <p className="text-[10px] text-[#606060] text-center py-4">No scenes created yet.</p>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Right Column: Screenplay Preview Area */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card hoverable={false} className="p-6 md:p-8 min-h-[400px] flex flex-col justify-between bg-zinc-950/40">
                      {activePreviewChapter ? (
                        <div className="space-y-6">
                          <div className="border-b border-[#242424] pb-4">
                            <h3 className="font-serif text-xl font-bold text-white">{activePreviewChapter.title}</h3>
                            <span className="text-[10px] text-[#606060] mt-1 block">{(activePreviewChapter.wordCount || 0).toLocaleString()} words in this scene</span>
                          </div>
                          
                          <div 
                            className="text-sm leading-relaxed max-w-none select-text whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-2 custom-scrollbar font-mono text-[#F0EBE0]"
                            style={{ fontFamily: "'Courier New', Courier, monospace" }}
                            dangerouslySetInnerHTML={{ __html: activePreviewChapter.content || "<p className='italic text-[#606060]'>This scene is empty.</p>" }}
                          />
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center text-xs text-[#606060] py-12">
                          <BookOpen className="h-10 w-10 text-[#606060]/50 mb-3" />
                          <p>Select a scene from the list to preview its screenplay contents.</p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: HOME/DASHBOARD OVERVIEW */}
            {activeTab === "home" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Welcome & Writing Streak Banner */}
                <div className="bg-gradient-to-br from-[#1a1200] to-[#0f0f0f] border border-[var(--gm)] rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
                  <div className="space-y-2">
                    <h2 className="font-serif text-2xl md:text-3xl font-black text-white">
                      Welcome back, {profile?.displayName || "Writer"}! 👋
                    </h2>
                    <p className="text-xs text-[#909090] leading-relaxed max-w-md">
                      Select a project from the sidebar to continue writing, or create a new project.
                    </p>
                    <div className="flex gap-3 pt-3">
                      <Button onClick={() => setIsCreateOpen(true)} size="sm">
                        Create Project
                      </Button>
                      <Button onClick={() => goToTab("tools")} variant="outline" size="sm">
                        Use AI Tools
                      </Button>
                    </div>
                  </div>

                  {/* Streak widget on right */}
                  <div className="flex items-center gap-4 bg-zinc-950/60 border border-[#242424] p-5 rounded-2xl shrink-0 w-full md:w-auto">
                    <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center justify-center shrink-0">
                      <Flame className="h-6 w-6 text-orange-500 fill-current" />
                    </div>
                    <div>
                      <span className="text-[9px] text-[#606060] font-bold tracking-widest uppercase block">Writing Streak</span>
                      <span className="font-serif text-xl font-black text-white block mt-0.5">{writingStreak} Days Streak 🔥</span>
                      <span className="text-[10px] text-[#52C07A] block mt-0.5 font-medium">Last active: {lastWriteDate || "Never"}</span>
                    </div>
                  </div>
                </div>

                {/* Stats overview row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 [&>*]:min-w-0">
                  <Card hoverable={false} className="dashboard-stat-card p-4 sm:p-5 text-center min-w-0 overflow-hidden">
                    <div className="dashboard-stat-value font-serif font-black text-[var(--gd)] mb-1">
                      {totalWordsWritten.toLocaleString()}
                    </div>
                    <div className="dashboard-stat-label text-[10px] text-[#606060] font-bold tracking-wider uppercase">Total Words</div>
                  </Card>
                  <Card hoverable={false} className="dashboard-stat-card p-4 sm:p-5 text-center min-w-0 overflow-hidden">
                    <div className="dashboard-stat-value font-serif font-black text-[var(--gd)] mb-1">
                      {projects.length}
                    </div>
                    <div className="dashboard-stat-label text-[10px] text-[#606060] font-bold tracking-wider uppercase">My Projects</div>
                  </Card>
                  <Card hoverable={false} className="dashboard-stat-card p-4 sm:p-5 text-center min-w-0 overflow-hidden">
                    <div className="dashboard-stat-value font-serif font-black text-[var(--gd)] mb-1">94%</div>
                    <div className="dashboard-stat-label text-[10px] text-[#606060] font-bold tracking-wider uppercase">AI Quality Score</div>
                  </Card>
                  <Card hoverable={false} className="dashboard-stat-card p-4 sm:p-5 text-center min-w-0 overflow-hidden">
                    <div className="dashboard-stat-value font-serif font-black text-[var(--gd)] mb-1">₦35,000</div>
                    <div className="dashboard-stat-label text-[10px] text-[#606060] font-bold tracking-wider uppercase">Project Earnings</div>
                  </Card>
                </div>

                {/* Project Grid */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#242424] pb-2">
                    <h3 className="font-serif text-lg font-bold text-white">
                      Active Projects
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.length > 0 ? (
                      projects.map((p) => (
                        <Card key={p.id} className="flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <Badge variant={p.type === "novel" ? "gold" : "red"}>
                                {p.type === "novel" ? "Novel Draft" : "Screenplay"}
                              </Badge>
                              <span className="text-[9px] text-[#606060]">Status: {p.status}</span>
                            </div>
                            <h4 className="font-serif text-base font-bold text-white mb-2">{p.name}</h4>
                            
                            <div className="flex gap-4 text-[10px] text-[#606060] mb-6">
                              <div>
                                <span className="block text-[#909090] font-bold">{p.chapterCount || 1} Chapters</span>
                                <span>Length</span>
                              </div>
                              <div>
                                <span className="block text-[#909090] font-bold">{p.wordCount.toLocaleString()} words</span>
                                <span>Word Count</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleSelectProject(p)} className="flex-grow">
                              Open Editor
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => {
                                setDeleteTargetId(p.id);
                                setIsDeleteConfirmOpen(true);
                              }}
                              className="px-3"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12 border border-dashed border-[#242424] rounded-2xl text-xs text-[#606060] space-y-3">
                        <p>No active projects yet. Create your first novel or script draft!</p>
                        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                          + Add Project
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Tools */}
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold text-white border-b border-[#242424] pb-2">
                    Quick Tools
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => goToTab("tools")}
                      className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-xl p-5 cursor-pointer flex gap-4 items-start transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[var(--gd)]/10 border border-[var(--gm)] flex items-center justify-center text-[var(--gd)] shrink-0">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          Chapter Analyzer <CornerDownRight className="h-3 w-3 text-[#606060]" />
                        </h4>
                        <p className="text-[10px] text-[#909090] leading-relaxed mt-1">
                          Scan drafts against platform editorial guidelines (PocketFM, Dreame, GoodNovel compliance check).
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => goToTab("tools")}
                      className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-xl p-5 cursor-pointer flex gap-4 items-start transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[var(--gd)]/10 border border-[var(--gm)] flex items-center justify-center text-[var(--gd)] shrink-0">
                        <PenTool className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          Smart Edit Suite <CornerDownRight className="h-3 w-3 text-[#606060]" />
                        </h4>
                        <p className="text-[10px] text-[#909090] leading-relaxed mt-1">
                          Instantly refine grammar, pacing, vocabulary, and paragraph transitions for optimized reading flow.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: NOVEL EDITOR */}
            {activeTab === "novel" && (
              <div className="space-y-6 animate-fadeIn">
                {activeProject ? (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Chapters Sidebar */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-[#242424] pb-2">
                        <h4 className="text-[10px] font-bold text-[#606060] uppercase tracking-wider">Chapters</h4>
                        <button
                          onClick={handleAddChapter}
                          className="text-[var(--gd)] hover:text-[var(--gl)] font-bold text-xs"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {isChaptersLoading ? (
                          <Loader size="sm" />
                        ) : chapters.map((c) => (
                          <div
                            key={c.id}
                            className={`group w-full px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                              activeChapter?.id === c.id
                                ? "bg-[var(--gd)]/12 text-[var(--gd)]"
                                : "hover:bg-[#161616] text-[#909090]"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectChapter(c)}
                              className="flex-1 min-w-0 text-left flex justify-between items-center gap-2 px-1 py-0.5"
                            >
                              <span className="truncate">{c.title}</span>
                              <span className="text-[9px] text-[#606060] font-normal shrink-0">
                                {(c.wordCount || 0).toLocaleString()} w
                              </span>
                            </button>
                            <button
                              type="button"
                              title="Rename"
                              onClick={(e) => openRenameChapter(c, e)}
                              className="opacity-70 hover:opacity-100 p-1 rounded hover:bg-[#242424] text-[#909090] hover:text-[var(--gd)]"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={(e) => openDeleteChapter(c, e)}
                              className="opacity-70 hover:opacity-100 p-1 rounded hover:bg-[#242424] text-[#909090] hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* WYSIWYG Editor Workspace */}
                    <div className="lg:col-span-3 space-y-4">
                      <div className="flex justify-between items-center bg-[#161616] border border-[#242424] px-5 py-3.5 rounded-xl">
                        <div>
                          <h3 className="text-sm font-bold text-white">{activeProject.name}</h3>
                          <span className="text-[10px] text-[#606060]">
                            Editor view: {activeChapter?.title || "Draft"} ({currentWordCount} words)
                          </span>
                        </div>
                        <div className="text-right text-[10px] text-[#606060]">
                          <span className="block font-bold text-white">{saveStatus}</span>
                          <span>Autosave active</span>
                        </div>
                      </div>

                      {/* Formatting Toolbar */}
                      <div className="flex items-center gap-1 bg-[#161616] border border-[#242424] p-1.5 rounded-lg">
                        <button
                          onClick={() => execFormat("bold")}
                          className="p-1.5 hover:bg-zinc-800 text-[#909090] hover:text-white rounded transition-colors"
                          title="Bold"
                        >
                          <Bold className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => execFormat("italic")}
                          className="p-1.5 hover:bg-zinc-800 text-[#909090] hover:text-white rounded transition-colors"
                          title="Italic"
                        >
                          <Italic className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => execFormat("formatBlock")} // Uses blockquote tag
                          className="p-1.5 hover:bg-zinc-800 text-[#909090] hover:text-white rounded transition-colors"
                          title="Quote"
                        >
                          <Quote className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      {/* ContentEditable editor workspace */}
                      <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleEditorInput}
                        className="w-full min-h-[380px] bg-[#161616] border border-[#242424] rounded-2xl p-6 text-xs text-[#F0EBE0] leading-relaxed outline-none focus:border-[var(--gm)] overflow-y-auto whitespace-pre-wrap select-text"
                        // @ts-ignore
                        placeholder="Start typing your chapter story here..."
                      />

                      {/* Footer Metrics */}
                      <div className="flex justify-between items-center text-[10px] text-[#606060]">
                        <span>Words: {currentWordCount}</span>
                        <span className="text-[#52C07A] font-semibold">Saved locally to Firestore ✓</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-xs text-[#606060] space-y-4">
                    <p>Select a project from the sidebar to open the Novel Editor workspace.</p>
                    <Button onClick={() => setIsCreateOpen(true)}>Create Project</Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SCRIPT EDITOR */}
            {activeTab === "script" && (
              <div className="space-y-6 animate-fadeIn">
                {activeProject ? (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Scene lists */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-[#242424] pb-2">
                        <h4 className="text-[10px] font-bold text-[#606060] uppercase tracking-wider">Scenes</h4>
                        <button
                          onClick={handleAddChapter}
                          className="text-[var(--gd)] hover:text-[var(--gl)] font-bold text-xs"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {isChaptersLoading ? (
                          <Loader size="sm" />
                        ) : chapters.map((c) => (
                          <div
                            key={c.id}
                            className={`group w-full px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                              activeChapter?.id === c.id
                                ? "bg-[var(--gd)]/12 text-[var(--gd)]"
                                : "hover:bg-[#161616] text-[#909090]"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectChapter(c)}
                              className="flex-1 min-w-0 text-left flex justify-between items-center gap-2 px-1 py-0.5"
                            >
                              <span className="truncate">{c.title}</span>
                              <span className="text-[9px] text-[#606060] shrink-0">{(c.wordCount || 0).toLocaleString()} w</span>
                            </button>
                            <button
                              type="button"
                              title="Rename"
                              onClick={(e) => openRenameChapter(c, e)}
                              className="opacity-70 hover:opacity-100 p-1 rounded hover:bg-[#242424] text-[#909090] hover:text-[var(--gd)]"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={(e) => openDeleteChapter(c, e)}
                              className="opacity-70 hover:opacity-100 p-1 rounded hover:bg-[#242424] text-[#909090] hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Screenplay workspace (Courier font spacing) */}
                    <div className="lg:col-span-3 space-y-4">
                      <div className="flex justify-between items-center bg-[#161616] border border-[#242424] px-5 py-3 rounded-xl">
                        <div>
                          <h3 className="text-sm font-bold text-white font-serif">{activeProject.name}</h3>
                          <span className="text-[10px] text-[#606060] font-serif">Format Mode: Courier Prime formatting</span>
                        </div>
                        <div className="text-right text-[10px] text-[#606060]">
                          <span className="block font-bold text-white">{saveStatus}</span>
                          <span>Autosave active</span>
                        </div>
                      </div>

                      {/* Screenplay Formatting Toolbar */}
                      <ScriptEditorToolbar
                        scriptElement={scriptElement}
                        onScriptElement={handleScriptElementApply}
                        onCommand={execFormat}
                      />

                      {/* Screenplay workspace contentEditable with Courier Prime specs */}
                      <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleEditorInput}
                        onKeyDown={handleScriptKeyDown}
                        data-placeholder="Write screenplay script..."
                        className="script-editor-surface w-full min-h-[380px] bg-[#161616] border border-[#242424] rounded-2xl p-6 sm:p-10 outline-none focus:border-[var(--gm)] overflow-y-auto whitespace-pre-wrap select-text text-[#F0EBE0]"
                      />

                      {/* Footer Metrics */}
                      <div className="flex justify-between items-center text-[10px] text-[#606060] font-mono">
                        <span>Pages: {scriptPageCount} Page(s)</span>
                        <span>Auto Saved to Firestore ✓</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-xs text-[#606060] space-y-4">
                    <p>Select a project from the sidebar to open the Screenplay Script Editor.</p>
                    <Button onClick={() => setIsCreateOpen(true)}>Create Project</Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: QUICK TOOLS */}
            {activeTab === "tools" && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white">AI Writing Tools</h2>
                  <p className="text-xs text-[#909090]">Use platform analysis algorithms and prose editing suites to polish your manuscripts.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  {/* Chapter Analyzer Widget */}
                  <Card className="space-y-4">
                    <div className="flex justify-between items-center border-b border-[#242424] pb-2">
                      <h3 className="font-serif text-sm font-bold text-[var(--gd)] flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> AI Chapter Analyzer
                      </h3>
                      <Badge variant="gold">OpenAI Engine</Badge>
                    </div>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Select your projects, select the target serialization platform, and scan compliance quality metrics including hooks, pacing, conflict, and emotion.
                    </p>
                    <Button onClick={() => goToTab("analyzer-workspace")} className="w-full">
                      Open Analyzer Workspace
                    </Button>
                  </Card>

                  {/* Smart Edit Prose Widget */}
                  <Card className="space-y-4">
                    <h3 className="font-serif text-sm font-bold text-[var(--gd)] flex items-center gap-1.5">
                      <PenTool className="h-4 w-4" /> AI Smart Edit Suite
                    </h3>
                    
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Analyze your text for grammar, pacing, repetition, and more using advanced AI.
                    </p>
                    <Button
                      onClick={() => goToTab("smart-edit")}
                      variant="outline"
                      className="w-full"
                    >
                      Open Smart Edit Suite
                    </Button>
                  </Card>

                  <Card className="space-y-4">
                    <div className="flex justify-between items-center border-b border-[#242424] pb-2">
                      <h3 className="font-serif text-sm font-bold text-[var(--gd)] flex items-center gap-1.5">
                        <Ghost className="h-4 w-4" /> AI Ghost Writer
                      </h3>
                      <Badge variant="gold">PREMIUM</Badge>
                    </div>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Generate a full serialized chapter or screenplay scene from your plot notes, then copy, rewrite, or save it into Novel Editor or Script Editor.
                    </p>
                    <Button onClick={() => goToTab("ghost-writer")} className="w-full">
                      Open Ghost Writer
                    </Button>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB: SMART EDIT SUITE */}
            {activeTab === "smart-edit" && (
              <div className="animate-fadeIn">
                <SmartEditSuite />
              </div>
            )}

            {activeTab === "ghost-writer" && (
              <GhostWriterWorkspace
                projects={projects}
                initialMode={searchParams.get("mode") === "script" ? "script" : "novel"}
                onOpenProject={handleSelectProject}
                onProjectCreated={(proj) => setProjects((prev) => [proj, ...prev])}
              />
            )}

            {/* TAB 5: STUDENT HUB */}
            {activeTab === "student" && (
              <StudentHubWorkspace
                onToolChange={(tool) => {
                  if (tool) {
                    router.push(`/dashboard?tab=student&tool=${encodeURIComponent(tool)}`);
                  } else {
                    router.push("/dashboard?tab=student");
                  }
                }}
              />
            )}

            {/* TAB 6: WEALTH TAB (INTERACTIVE HUB) */}
            {activeTab === "wealth" && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-[#242424] pb-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-white">WEALTH Engine</h2>
                    <p className="text-xs text-[#909090]">Manage publishing contracts, view jobs, and build pitching assets.</p>
                  </div>
                  <div className="bg-[#161616] p-1 rounded-xl flex gap-1 border border-[#242424]">
                    <button
                      onClick={() => setWealthSubTab("jobs")}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg ${
                        wealthSubTab === "jobs" ? "bg-[var(--gd)] text-zinc-950" : "text-[#909090]"
                      }`}
                    >
                      Jobs & Calls
                    </button>
                    <button
                      onClick={() => setWealthSubTab("branding")}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg ${
                        wealthSubTab === "branding" ? "bg-[var(--gd)] text-zinc-950" : "text-[#909090]"
                      }`}
                    >
                      AI Branding
                    </button>
                  </div>
                </div>

                {wealthSubTab === "jobs" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="space-y-4">
                      <h3 className="font-serif text-sm font-bold text-white border-b border-[#242424] pb-2">
                        Writing Jobs Marketplace
                      </h3>
                      <p className="text-xs text-[#909090] leading-relaxed">
                        Browse live gigs, apply with a cover message, or post a job for admin review.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => router.push("/wealth/jobs")}>
                          Browse Jobs
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push("/wealth/jobs/post")}
                        >
                          Post a Job
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push("/wealth/applications")}
                        >
                          My Applications
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push("/wealth/jobs/mine")}
                        >
                          My Jobs
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {[
                          { label: "Novel", href: "/wealth/jobs?category=novel" },
                          { label: "Screenwriting", href: "/wealth/jobs?category=screenwriting" },
                          { label: "Ghostwriting", href: "/wealth/jobs?category=ghostwriting" },
                          { label: "Editing", href: "/wealth/jobs?category=editing" },
                        ].map((c) => (
                          <button
                            key={c.href}
                            type="button"
                            onClick={() => router.push(c.href)}
                            className="rounded-xl border border-[#242424] bg-zinc-950 px-3 py-2 text-left text-[11px] font-bold text-white hover:border-[var(--gm)]"
                          >
                            {c.label} →
                          </button>
                        ))}
                      </div>
                    </Card>

                    <Card className="space-y-4">
                      <h3 className="font-serif text-sm font-bold text-white border-b border-[#242424] pb-2">
                        Industry Connect
                      </h3>
                      <p className="text-[10px] text-[#909090] mt-1 leading-relaxed">
                        Open calls, pitches, and producer connections ship in the next phase. Writing
                        Jobs marketplace is live now.
                      </p>
                      <Button
                        onClick={() => router.push("/wealth")}
                        variant="outline"
                        size="sm"
                        className="mt-3"
                      >
                        Open WEALTH Hub
                      </Button>
                    </Card>
                  </div>
                ) : (
                  /* AI BRANDING TOOLS */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <Card className="space-y-4">
                      <h3 className="font-serif text-sm font-bold text-white">Book Blurb Writer</h3>
                      <Input
                        type="text"
                        value={blurbTitle}
                        onChange={(e) => setBlurbTitle(e.target.value)}
                        className="bg-[#080808]"
                        placeholder="Book Title (e.g. Scorned She-wolf)..."
                      />
                      <Button
                        onClick={runBlurbGenerator}
                        isLoading={isGeneratingBlurb}
                        className="w-full"
                      >
                        Generate Blurb
                      </Button>
                      {generatedBlurb && (
                        <p className="bg-zinc-950 p-3 rounded-lg text-[11px] text-[#52C07A] italic leading-relaxed">{generatedBlurb}</p>
                      )}
                    </Card>

                    <Card className="space-y-4">
                      <h3 className="font-serif text-sm font-bold text-white">Author Bio Generator</h3>
                      <Input
                        type="text"
                        value={bioName}
                        onChange={(e) => setBioName(e.target.value)}
                        className="bg-[#080808]"
                        placeholder="Pen Name..."
                      />
                      <Button
                        onClick={runBioGenerator}
                        isLoading={isGeneratingBio}
                        className="w-full"
                      >
                        Generate Bio
                      </Button>
                      {generatedBio && (
                        <p className="bg-zinc-950 p-3 rounded-lg text-[11px] text-[#52C07A] italic leading-relaxed">{generatedBio}</p>
                      )}
                    </Card>

                    <Card className="space-y-4">
                      <h3 className="font-serif text-sm font-bold text-white">Query Letter Builder</h3>
                      <Input
                        type="text"
                        value={queryTitle}
                        onChange={(e) => setQueryTitle(e.target.value)}
                        className="bg-[#080808]"
                        placeholder="Manuscript Title..."
                      />
                      <Button
                        onClick={runQueryBuilder}
                        isLoading={isGeneratingQuery}
                        className="w-full"
                      >
                        Build Query Package
                      </Button>
                      {generatedQuery && (
                        <pre className="bg-zinc-950 p-3 rounded-lg text-[10px] text-[#52C07A] whitespace-pre-wrap font-sans leading-relaxed">{generatedQuery}</pre>
                      )}
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: PROFILE SETTINGS */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white">Profile & Settings</h2>
                  <p className="text-xs text-[#909090]">Manage your personal profile details and upload an avatar photo.</p>
                </div>

                {feedback.message && (
                  <div
                    className={`px-4 py-3 rounded-lg text-sm border flex items-center gap-2 ${
                      feedback.type === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}
                  >
                    {feedback.type === "success" ? "✓ " : ""}
                    {feedback.message}
                  </div>
                )}

                <Card hoverable={false} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                  
                  {/* Avatar upload */}
                  <div className="flex flex-col items-center gap-4 text-center">
                    <FileUpload
                      label="Avatar Photo"
                      onFileSelect={handleAvatarUpload}
                      isUploading={isUploading}
                      accept="image/*"
                      fileName={profile?.photoURL ? "avatar_image.jpg" : undefined}
                    />
                    <p className="text-[9px] text-[#606060]">Drag/drop or click to change your profile avatar.</p>
                  </div>

                  {/* Account Details form */}
                  <div className="md:col-span-2">
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div>
                        <Input
                          label="Email Address"
                          type="email"
                          disabled
                          value={profile?.email || ""}
                          leftIcon={<Mail className="h-4 w-4 text-[#606060]" />}
                          className="cursor-not-allowed text-[#606060] bg-zinc-950/50"
                        />
                        <p className="text-[9px] text-[#606060] mt-1">Contact system admin to modify email address</p>
                      </div>

                      <div>
                        <Input
                          label="Display Name"
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          leftIcon={<UserIcon className="h-4 w-4" />}
                        />
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          isLoading={isSaving}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </div>
                </Card>

                {/* Grid for Stats and Subscription */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Writing Stats Card */}
                  <Card hoverable={false} className="p-6 space-y-4">
                    <h3 className="font-serif text-lg font-bold text-white border-b border-[#242424] pb-2">Writing Stats</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#161616] border border-[#242424] rounded-xl flex items-center justify-center">
                        <Flame className="h-6 w-6 text-orange-500 fill-current" />
                      </div>
                      <div>
                        <span className="text-xs text-[#909090] font-bold uppercase tracking-wider block">Current Streak</span>
                        <span className="font-serif text-2xl font-black text-white">{writingStreak} Days</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="w-12 h-12 bg-[#161616] border border-[#242424] rounded-xl flex items-center justify-center">
                        <PenTool className="h-5 w-5 text-[var(--gd)]" />
                      </div>
                      <div>
                        <span className="text-xs text-[#909090] font-bold uppercase tracking-wider block">Total Words Written</span>
                        <span className="font-serif text-2xl font-black text-white">{totalWordsWritten.toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Subscription Details Card */}
                  <Card hoverable={false} className="p-6 space-y-4">
                    <h3 className="font-serif text-lg font-bold text-white border-b border-[#242424] pb-2">Subscription Details</h3>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-[#606060] font-bold uppercase tracking-wider block mb-1">Current Plan</span>
                        <span className="inline-block bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] text-zinc-950 font-black text-xs uppercase tracking-wider px-3 py-1 rounded-full">
                          {profile?.subscriptionPlan === 'free' ? 'FREE PLAN' : profile?.subscriptionPlan?.replace('plan_', '').toUpperCase() || 'NONE'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-[#606060] font-bold uppercase tracking-wider block mb-0.5">Purchased On</span>
                          <span className="text-sm font-semibold text-white">
                            {profile?.subscriptionDate ? new Date(profile.subscriptionDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#606060] font-bold uppercase tracking-wider block mb-0.5">Expires On</span>
                          <span className="text-sm font-semibold text-white">
                            {profile?.subscriptionExpiry ? new Date(profile.subscriptionExpiry).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.location.href = '/pricing'}>
                        Upgrade Plan
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* Support & Settings Links */}
                <Card hoverable={false} className="p-6">
                  <h3 className="font-serif text-lg font-bold text-white border-b border-[#242424] pb-4 mb-4">Support & Legal</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="secondary" className="flex-1 justify-center" onClick={() => triggerToast("Support email copied: support@ink2wealth.com")}>
                      <Mail className="h-4 w-4 mr-2" /> Contact Support
                    </Button>
                    <Link href="/terms-of-service" className="flex-1">
                      <Button variant="secondary" className="w-full justify-center">
                        <FileText className="h-4 w-4 mr-2" /> Terms of Service
                      </Button>
                    </Link>
                    <Link href="/privacy-policy" className="flex-1">
                      <Button variant="secondary" className="w-full justify-center">
                        <Shield className="h-4 w-4 mr-2" /> Privacy Policy
                      </Button>
                    </Link>
                  </div>
                </Card>

                {/* Danger zone / logout */}
                <div className="bg-[#161616] border border-red-500/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white">Log Out Session</h4>
                    <p className="text-[10px] text-[#909090] mt-0.5">Disconnect your account and clear session cookies.</p>
                  </div>
                  <Button
                    onClick={() => setIsLogoutConfirmOpen(true)}
                    variant="danger"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            )}

          </main>
        </div>

      </div>

    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <Loader size="lg" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
