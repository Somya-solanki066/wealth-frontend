"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Flag,
  Heart,
  Loader2,
  MessageCircle,
  Search,
  Users,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

type Room = {
  id: string;
  name: string;
  description: string;
  type: "public" | "genre" | "feedback" | "mentorship";
  subtitle?: string;
  memberCount?: number;
  isMember?: boolean;
  feedbackOpen?: boolean;
  weekLabel?: string;
  mentorsAvailable?: number;
};

type Post = {
  id: string;
  roomId: string;
  title: string;
  content: string;
  authorName: string;
  postType: string;
  likeCount: number;
  replyCount: number;
  liked?: boolean;
  createdAt?: string;
};

type View =
  | "home"
  | "room"
  | "post"
  | "new-post"
  | "feedback"
  | "feedback-detail"
  | "submit-feedback"
  | "mentorship"
  | "mentor"
  | "my-discussions"
  | "notifications"
  | "profile";

const POST_TYPES = ["Discussion", "Question", "Announcement", "Writing Advice", "Collaboration"];
const FEEDBACK_AREAS = ["Story", "Characters", "Dialogue", "Pacing", "Ending"];
const MENTOR_NEEDS = ["Story structure", "Character", "Dialogue", "Industry", "Career", "Pitching"];
const REPORT_REASONS = ["Spam", "Harassment", "Inappropriate content", "Copyright issue", "Other"];

export default function ScreenwriterCommunityWorkspace({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<View>("home");
  const [homeFilter, setHomeFilter] = useState<"all" | "mine" | "discussions">("all");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activePost, setActivePost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [reply, setReply] = useState("");

  const [newPost, setNewPost] = useState({ title: "", content: "", postType: "Discussion" });

  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackDetail, setFeedbackDetail] = useState<any>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    title: "",
    genre: "Thriller",
    areas: [] as string[],
    previewText: "",
  });
  const [feedbackFile, setFeedbackFile] = useState<File | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");

  const [mentors, setMentors] = useState<any[]>([]);
  const [mentorPrefs, setMentorPrefs] = useState({ genre: "Drama", need: "" });
  const [activeMentor, setActiveMentor] = useState<any>(null);
  const [mentorReq, setMentorReq] = useState({ workingOn: "", helpNeeded: "", preferredTime: "" });
  const [myMentorReqs, setMyMentorReqs] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: string; id: string } | null>(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/community/rooms");
      setRooms(res.data.rooms || []);
      setMeta(res.data.meta || null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load community.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const openRoom = async (room: Room) => {
    setError("");
    setActiveRoom(room);
    if (room.type === "feedback") {
      setView("feedback");
      setBusy(true);
      try {
        const res = await api.get("/community/feedback");
        setFeedbackList(res.data.submissions || []);
        if (res.data.meta) setMeta(res.data.meta);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load feedback.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (room.type === "mentorship") {
      setView("mentorship");
      setBusy(true);
      try {
        const [mRes, rRes] = await Promise.all([
          api.get("/community/mentors"),
          api.get("/community/mentorship/requests?role=mentee"),
        ]);
        setMentors(mRes.data.mentors || []);
        setMyMentorReqs(rRes.data.requests || []);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load mentors.");
      } finally {
        setBusy(false);
      }
      return;
    }
    setView("room");
    setBusy(true);
    try {
      const [roomRes, postsRes] = await Promise.all([
        api.get(`/community/rooms/${room.id}`),
        api.get(`/community/posts?roomId=${room.id}`),
      ]);
      setActiveRoom(roomRes.data.room);
      setPosts(postsRes.data.posts || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to open room.");
    } finally {
      setBusy(false);
    }
  };

  const joinOrLeave = async () => {
    if (!activeRoom) return;
    setBusy(true);
    try {
      if (activeRoom.isMember) {
        await api.post(`/community/rooms/${activeRoom.id}/leave`);
        setActiveRoom({ ...activeRoom, isMember: false });
        showToast("Left room");
      } else {
        const res = await api.post(`/community/rooms/${activeRoom.id}/join`);
        setActiveRoom(res.data.room || { ...activeRoom, isMember: true });
        showToast("Joined room");
      }
      await loadRooms();
    } catch (err: any) {
      setError(err.response?.data?.error || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const openPost = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await api.get(`/community/posts/${id}`);
      setActivePost(res.data.post);
      setComments(res.data.comments || []);
      setView("post");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to open post.");
    } finally {
      setBusy(false);
    }
  };

  const createDiscussion = async () => {
    if (!activeRoom) return;
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setError("Title and message are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/community/posts", {
        roomId: activeRoom.id,
        ...newPost,
      });
      setNewPost({ title: "", content: "", postType: "Discussion" });
      showToast("Posted");
      await openPost(res.data.post.id);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to post.");
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!activePost || !reply.trim()) return;
    setBusy(true);
    try {
      const res = await api.post(`/community/posts/${activePost.id}/comments`, { content: reply });
      setComments((c) => [...c, res.data.comment]);
      setReply("");
      setActivePost({ ...activePost, replyCount: (activePost.replyCount || 0) + 1 });
    } catch (err: any) {
      setError(err.response?.data?.error || "Reply failed.");
    } finally {
      setBusy(false);
    }
  };

  const toggleLike = async () => {
    if (!activePost) return;
    try {
      const res = await api.post(`/community/posts/${activePost.id}/like`);
      const liked = res.data.liked;
      setActivePost({
        ...activePost,
        liked,
        likeCount: Math.max(0, (activePost.likeCount || 0) + (liked ? 1 : -1)),
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Like failed.");
    }
  };

  const submitReport = async () => {
    if (!reportTarget) return;
    try {
      await api.post("/community/report", {
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason,
      });
      setReportOpen(false);
      showToast("Report submitted");
    } catch (err: any) {
      setError(err.response?.data?.error || "Report failed.");
    }
  };

  const submitFeedbackScript = async () => {
    if (!feedbackForm.title.trim()) {
      setError("Script title is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/community/feedback", {
        title: feedbackForm.title,
        genre: feedbackForm.genre,
        requestedAreas: feedbackForm.areas,
        previewText: feedbackForm.previewText,
        roomId: "weekly-feedback",
      });
      const id = res.data.submission.id;
      if (feedbackFile) {
        const body = new FormData();
        body.append("file", feedbackFile);
        await api.post(`/community/feedback/${id}/upload`, body, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      showToast("Submitted for feedback");
      setFeedbackForm({ title: "", genre: "Thriller", areas: [], previewText: "" });
      setFeedbackFile(null);
      const room = rooms.find((r) => r.type === "feedback") || activeRoom;
      if (room) await openRoom(room);
    } catch (err: any) {
      setError(err.response?.data?.error || "Submit failed.");
    } finally {
      setBusy(false);
    }
  };

  const openFeedback = async (id: string) => {
    setBusy(true);
    try {
      const res = await api.get(`/community/feedback/${id}`);
      setFeedbackDetail(res.data.submission);
      setView("feedback-detail");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to open submission.");
    } finally {
      setBusy(false);
    }
  };

  const sendFeedbackComment = async () => {
    if (!feedbackDetail || !feedbackComment.trim()) return;
    setBusy(true);
    try {
      const res = await api.post(`/community/feedback/${feedbackDetail.id}/comments`, {
        content: feedbackComment,
      });
      setFeedbackDetail({
        ...feedbackDetail,
        comments: [...(feedbackDetail.comments || []), res.data.comment],
        feedbackCount: (feedbackDetail.feedbackCount || 0) + 1,
      });
      setFeedbackComment("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Comment failed.");
    } finally {
      setBusy(false);
    }
  };

  const searchMentors = async () => {
    setBusy(true);
    try {
      const params = new URLSearchParams();
      if (mentorPrefs.genre) params.set("genre", mentorPrefs.genre);
      if (mentorPrefs.need) params.set("need", mentorPrefs.need);
      const res = await api.get(`/community/mentors?${params}`);
      setMentors(res.data.mentors || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Search failed.");
    } finally {
      setBusy(false);
    }
  };

  const sendMentorRequest = async () => {
    if (!activeMentor) return;
    if (!mentorReq.workingOn.trim() || !mentorReq.helpNeeded.trim()) {
      setError("Describe your project and the help you need.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/community/mentorship/request", {
        mentorId: activeMentor.id,
        ...mentorReq,
      });
      showToast("Request sent ✓");
      setMentorReq({ workingOn: "", helpNeeded: "", preferredTime: "" });
      const rRes = await api.get("/community/mentorship/requests?role=mentee");
      setMyMentorReqs(rRes.data.requests || []);
      setView("mentorship");
    } catch (err: any) {
      setError(err.response?.data?.error || "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const loadMyDiscussions = async () => {
    setBusy(true);
    setView("my-discussions");
    try {
      const res = await api.get("/community/posts?mine=1");
      setPosts(res.data.posts || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load.");
    } finally {
      setBusy(false);
    }
  };

  const loadNotifications = async () => {
    setBusy(true);
    setView("notifications");
    try {
      const res = await api.get("/community/notifications");
      setNotifications(res.data.notifications || []);
      await api.post("/community/notifications/read");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load notifications.");
    } finally {
      setBusy(false);
    }
  };

  const loadProfile = async () => {
    setBusy(true);
    setView("profile");
    try {
      const res = await api.get("/community/profile/me");
      setProfile(res.data.profile);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load profile.");
    } finally {
      setBusy(false);
    }
  };

  const filteredRooms =
    homeFilter === "mine"
      ? rooms.filter((r) => r.isMember)
      : rooms.filter(
          (r) =>
            !search.trim() ||
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            (r.description || "").toLowerCase().includes(search.toLowerCase())
        );

  const searchPosts = async () => {
    if (!search.trim()) {
      await loadRooms();
      return;
    }
    setBusy(true);
    setView("my-discussions");
    try {
      const res = await api.get(`/community/posts?search=${encodeURIComponent(search.trim())}`);
      setPosts(res.data.posts || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Search failed.");
    } finally {
      setBusy(false);
    }
  };

  const backHome = () => {
    setView("home");
    setActiveRoom(null);
    setActivePost(null);
    void loadRooms();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {(view !== "home" || onBack) && (
            <button
              type="button"
              onClick={() => {
                if (view === "home" && onBack) onBack();
                else if (view === "post" || view === "new-post") {
                  setView("room");
                } else if (view === "feedback-detail" || view === "submit-feedback") {
                  setView("feedback");
                } else if (view === "mentor") {
                  setView("mentorship");
                } else backHome();
              }}
              className="rounded-lg border border-[#242424] p-2 text-[#909090] hover:text-white"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h2 className="font-serif text-2xl font-bold text-white">Screenwriter Community</h2>
            <p className="text-xs text-[#909090]">
              Rooms · feedback · mentorship — your industry family
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadNotifications()}
            className="rounded-lg border border-[#242424] p-2 text-[#909090] hover:text-white"
            title="Notifications"
          >
            <Bell size={16} />
          </button>
          <button
            type="button"
            onClick={() => void loadProfile()}
            className="rounded-lg border border-[#242424] px-3 py-2 text-xs text-[#909090] hover:text-white"
          >
            Profile
          </button>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl border border-[#52C07A]/30 bg-[#52C07A]/10 px-4 py-2 text-sm text-[#52C07A]">
          {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {view === "home" && (
        <>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606060]" size={14} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void searchPosts()}
                placeholder="Search discussions..."
                className="w-full rounded-xl border border-[#242424] bg-[#121212] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-[var(--gd)]"
              />
            </div>
            <Button variant="secondary" onClick={() => void searchPosts()}>
              Search
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All Rooms"],
                ["mine", "My Rooms"],
                ["discussions", "My Discussions"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setHomeFilter(id);
                  if (id === "discussions") void loadMyDiscussions();
                  else setView("home");
                }}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  homeFilter === id
                    ? "bg-[var(--gd)]/20 text-[var(--gd)]"
                    : "border border-[#242424] text-[#909090]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-[var(--gd)]" />
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#606060]">Rooms</h3>
              {filteredRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => void openRoom(room)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-[#2a1810] bg-gradient-to-r from-[#160804] to-[#0c0c0c] px-5 py-4 text-left transition hover:border-[var(--gd)]/50"
                >
                  <span className="text-lg text-red-500">●</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-lg font-bold text-white">{room.name}</div>
                    <div className="text-xs text-[#909090]">{room.subtitle || room.description}</div>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--gd)]">
                    {room.type === "feedback"
                      ? "Submit / View"
                      : room.type === "mentorship"
                        ? "Find Mentor"
                        : room.isMember
                          ? "Enter"
                          : "Join / Enter"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {view === "room" && activeRoom && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">{activeRoom.name}</h3>
              <p className="mt-1 max-w-xl text-sm text-[#909090]">{activeRoom.description}</p>
              <p className="mt-1 text-xs text-[#606060]">
                <Users size={12} className="mr-1 inline" />
                {activeRoom.memberCount || 0} members
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => void joinOrLeave()} disabled={busy}>
                {activeRoom.isMember ? "Leave Room" : "Join Room"}
              </Button>
              <Button onClick={() => setView("new-post")}>+ New Post</Button>
            </div>
          </div>

          {busy && !posts.length ? (
            <Loader2 className="mx-auto animate-spin text-[var(--gd)]" />
          ) : posts.length === 0 ? (
            <p className="text-sm text-[#606060]">No discussions yet. Start one.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => void openPost(p.id)}
                  className="w-full rounded-2xl border border-[#242424] bg-[#121212] p-4 text-left hover:border-[var(--gd)]/40"
                >
                  <div className="text-xs text-[#606060]">
                    {p.authorName} · {p.postType}
                  </div>
                  <div className="mt-1 font-serif text-lg font-bold text-white">{p.title}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-[#909090]">{p.content}</p>
                  <div className="mt-3 flex gap-4 text-xs text-[#606060]">
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} /> {p.replyCount || 0} replies
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {p.likeCount || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "new-post" && activeRoom && (
        <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-[#242424] bg-[#121212] p-6">
          <h3 className="font-serif text-xl font-bold text-white">New Post</h3>
          <label className="block space-y-1 text-xs text-[#909090]">
            Title
            <input
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="w-full rounded-xl border border-[#242424] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block space-y-1 text-xs text-[#909090]">
            Post type
            <select
              value={newPost.postType}
              onChange={(e) => setNewPost({ ...newPost, postType: e.target.value })}
              className="w-full rounded-xl border border-[#242424] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
            >
              {POST_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-xs text-[#909090]">
            Message
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              rows={6}
              className="w-full rounded-xl border border-[#242424] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
            />
          </label>
          <Button onClick={() => void createDiscussion()} disabled={busy} className="w-full">
            {busy ? "Posting…" : "Post"}
          </Button>
        </div>
      )}

      {view === "post" && activePost && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#242424] bg-[#121212] p-6">
            <div className="text-xs text-[#606060]">Posted by {activePost.authorName}</div>
            <h3 className="mt-1 font-serif text-2xl font-bold text-white">{activePost.title}</h3>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#c8c4bc]">
              {activePost.content}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void toggleLike()}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${
                  activePost.liked
                    ? "border-red-500/40 text-red-400"
                    : "border-[#242424] text-[#909090]"
                }`}
              >
                <Heart size={14} fill={activePost.liked ? "currentColor" : "none"} />
                {activePost.likeCount || 0} Likes
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportTarget({ type: "post", id: activePost.id });
                  setReportOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-[#242424] px-3 py-1.5 text-xs text-[#909090]"
              >
                <Flag size={14} /> Report
              </button>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#606060]">
              Replies
            </h4>
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] p-4">
                  <div className="text-xs font-bold text-[var(--gd)]">{c.authorName}</div>
                  <p className="mt-1 text-sm text-[#c8c4bc]">{c.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 rounded-xl border border-[#242424] bg-[#121212] px-3 py-2 text-sm text-white"
              />
              <Button onClick={() => void sendReply()} disabled={busy}>
                Reply
              </Button>
            </div>
          </div>
        </div>
      )}

      {view === "feedback" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">Weekly Feedback Thread</h3>
              <p className="text-xs text-[#909090]">
                {meta?.weekLabel} · {meta?.feedbackClosesLabel || "Closes Sunday"}
              </p>
            </div>
            <Button
              onClick={() => setView("submit-feedback")}
              disabled={meta && meta.feedbackOpen === false}
            >
              Submit for Feedback
            </Button>
          </div>
          {meta && meta.feedbackOpen === false && (
            <p className="rounded-xl border border-[#242424] bg-[#121212] px-4 py-3 text-sm text-[#909090]">
              Thread is closed for new submissions. Past feedback remains readable. Opens Monday.
            </p>
          )}
          {busy ? (
            <Loader2 className="mx-auto animate-spin text-[var(--gd)]" />
          ) : feedbackList.length === 0 ? (
            <p className="text-sm text-[#606060]">No submissions this week yet.</p>
          ) : (
            <div className="space-y-3">
              {feedbackList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => void openFeedback(s.id)}
                  className="w-full rounded-2xl border border-[#242424] bg-[#121212] p-4 text-left hover:border-[var(--gd)]/40"
                >
                  <div className="font-serif text-lg font-bold text-white">{s.title}</div>
                  <div className="mt-1 text-xs text-[#606060]">
                    {s.genre} · Author: {s.authorName} · {s.feedbackCount || 0} feedback
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(s.requestedAreas || []).map((a: string) => (
                      <span
                        key={a}
                        className="rounded bg-[var(--gd)]/15 px-2 py-0.5 text-[10px] text-[var(--gd)]"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "submit-feedback" && (
        <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-[#242424] bg-[#121212] p-6">
          <h3 className="font-serif text-xl font-bold text-white">Submit for Feedback</h3>
          <label className="block space-y-1 text-xs text-[#909090]">
            Script Title
            <input
              value={feedbackForm.title}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
              className="w-full rounded-xl border border-[#242424] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block space-y-1 text-xs text-[#909090]">
            Genre
            <select
              value={feedbackForm.genre}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, genre: e.target.value })}
              className="w-full rounded-xl border border-[#242424] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
            >
              {(meta?.genres || ["Thriller", "Drama"]).map((g: string) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <div className="space-y-2 text-xs text-[#909090]">
            What feedback do you want?
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_AREAS.map((a) => {
                const on = feedbackForm.areas.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      setFeedbackForm({
                        ...feedbackForm,
                        areas: on
                          ? feedbackForm.areas.filter((x) => x !== a)
                          : [...feedbackForm.areas, a],
                      })
                    }
                    className={`rounded-full px-3 py-1 ${
                      on ? "bg-[var(--gd)]/20 text-[var(--gd)]" : "border border-[#242424]"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block space-y-1 text-xs text-[#909090]">
            Preview excerpt (first pages — not a public download)
            <textarea
              value={feedbackForm.previewText}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, previewText: e.target.value })}
              rows={5}
              className="w-full rounded-xl border border-[#242424] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
              placeholder="Paste a short excerpt for reviewers…"
            />
          </label>
          <label className="block space-y-1 text-xs text-[#909090]">
            Upload PDF (stored privately)
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => setFeedbackFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-[#909090]"
            />
          </label>
          <Button onClick={() => void submitFeedbackScript()} disabled={busy} className="w-full">
            {busy ? "Submitting…" : "Submit"}
          </Button>
        </div>
      )}

      {view === "feedback-detail" && feedbackDetail && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#242424] bg-[#121212] p-6">
            <h3 className="font-serif text-2xl font-bold text-white">{feedbackDetail.title}</h3>
            <p className="mt-1 text-xs text-[#606060]">
              {feedbackDetail.genre} · Author: {feedbackDetail.authorName} ·{" "}
              {feedbackDetail.weekLabel}
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {(feedbackDetail.requestedAreas || []).map((a: string) => (
                <span
                  key={a}
                  className="rounded bg-[var(--gd)]/15 px-2 py-0.5 text-[10px] text-[var(--gd)]"
                >
                  ✓ {a}
                </span>
              ))}
            </div>
            {feedbackDetail.previewText && (
              <div className="mt-4 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-4">
                <div className="mb-2 text-[10px] uppercase tracking-widest text-[#606060]">
                  Read Preview
                </div>
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#c8c4bc]">
                  {feedbackDetail.previewText}
                </pre>
              </div>
            )}
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#606060]">
              Feedback
            </h4>
            {(feedbackDetail.comments || []).map((c: any) => (
              <div key={c.id} className="mb-3 rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] p-4">
                <div className="text-xs font-bold text-[var(--gd)]">{c.authorName}</div>
                <p className="mt-1 text-sm text-[#c8c4bc]">{c.content}</p>
              </div>
            ))}
            <div className="mt-4 flex gap-2">
              <input
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Leave feedback..."
                className="flex-1 rounded-xl border border-[#242424] bg-[#121212] px-3 py-2 text-sm text-white"
              />
              <Button onClick={() => void sendFeedbackComment()} disabled={busy}>
                Reply
              </Button>
            </div>
          </div>
        </div>
      )}

      {view === "mentorship" && (
        <div className="space-y-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-white">Mentorship Matching</h3>
            <p className="text-xs text-[#909090]">Find a mentor for craft or industry help</p>
          </div>
          <div className="flex flex-wrap gap-3 rounded-2xl border border-[#242424] bg-[#121212] p-4">
            <label className="text-xs text-[#909090]">
              What do you write?
              <select
                value={mentorPrefs.genre}
                onChange={(e) => setMentorPrefs({ ...mentorPrefs, genre: e.target.value })}
                className="mt-1 block rounded-lg border border-[#242424] bg-[#0a0a0a] px-2 py-1.5 text-sm text-white"
              >
                {(meta?.genres || ["Drama", "Thriller"]).map((g: string) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <div className="text-xs text-[#909090]">
              What help do you need?
              <div className="mt-1 flex flex-wrap gap-1">
                {MENTOR_NEEDS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      setMentorPrefs({
                        ...mentorPrefs,
                        need: mentorPrefs.need === n ? "" : n,
                      })
                    }
                    className={`rounded-full px-2 py-0.5 ${
                      mentorPrefs.need === n
                        ? "bg-[var(--gd)]/20 text-[var(--gd)]"
                        : "border border-[#242424]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => void searchMentors()} disabled={busy}>
              Find Mentors
            </Button>
          </div>

          <h4 className="text-xs font-bold uppercase tracking-widest text-[#606060]">
            Available Mentors
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {mentors.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-[#242424] bg-[#121212] p-4"
              >
                <div className="font-serif text-lg font-bold text-white">{m.name}</div>
                <div className="text-xs text-[#909090]">
                  {m.title} · {m.yearsExperience} years experience
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(m.focus || []).map((f: string) => (
                    <span
                      key={f}
                      className="rounded bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-[#909090]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[#606060]">
                  {m.slotsAvailable} slots this week
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActiveMentor(m);
                      setView("mentor");
                    }}
                  >
                    View Profile
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveMentor(m);
                      setView("mentor");
                    }}
                  >
                    Request Mentorship
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {myMentorReqs.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#606060]">
                My Requests
              </h4>
              {myMentorReqs.map((r) => (
                <div
                  key={r.id}
                  className="mb-2 rounded-xl border border-[#242424] bg-[#0e0e0e] px-4 py-3 text-sm"
                >
                  <span className="text-white">{r.mentorName}</span>
                  <span className="ml-2 text-xs text-[#606060]">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "mentor" && activeMentor && (
        <div className="mx-auto max-w-xl space-y-4">
          <div className="rounded-2xl border border-[#242424] bg-[#121212] p-6">
            <h3 className="font-serif text-2xl font-bold text-white">{activeMentor.name}</h3>
            <p className="text-sm text-[#909090]">
              {activeMentor.title} · {activeMentor.yearsExperience} years experience
            </p>
            <p className="mt-3 text-sm text-[#c8c4bc]">{activeMentor.bio}</p>
            <p className="mt-2 text-xs text-[#606060]">
              Available: {activeMentor.slotsAvailable} slots · Languages:{" "}
              {(activeMentor.languages || []).join(", ")}
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-[#242424] bg-[#121212] p-6">
            <h4 className="font-bold text-white">Request Mentorship</h4>
            <label className="block space-y-1 text-xs text-[#909090]">
              What are you working on?
              <textarea
                value={mentorReq.workingOn}
                onChange={(e) => setMentorReq({ ...mentorReq, workingOn: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-[#242424] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="block space-y-1 text-xs text-[#909090]">
              What help do you need?
              <textarea
                value={mentorReq.helpNeeded}
                onChange={(e) => setMentorReq({ ...mentorReq, helpNeeded: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-[#242424] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="block space-y-1 text-xs text-[#909090]">
              Preferred time
              <input
                value={mentorReq.preferredTime}
                onChange={(e) => setMentorReq({ ...mentorReq, preferredTime: e.target.value })}
                className="w-full rounded-xl border border-[#242424] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
                placeholder="e.g. Weekday evenings"
              />
            </label>
            <Button onClick={() => void sendMentorRequest()} disabled={busy} className="w-full">
              Send Request
            </Button>
          </div>
        </div>
      )}

      {view === "my-discussions" && (
        <div className="space-y-3">
          <h3 className="font-serif text-xl font-bold text-white">Discussions</h3>
          {posts.length === 0 ? (
            <p className="text-sm text-[#606060]">No posts found.</p>
          ) : (
            posts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => void openPost(p.id)}
                className="w-full rounded-2xl border border-[#242424] bg-[#121212] p-4 text-left hover:border-[var(--gd)]/40"
              >
                <div className="font-serif font-bold text-white">{p.title}</div>
                <div className="text-xs text-[#606060]">
                  {p.authorName} · {p.replyCount || 0} replies
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {view === "notifications" && (
        <div className="space-y-3">
          <h3 className="font-serif text-xl font-bold text-white">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-[#606060]">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border border-[#242424] bg-[#121212] px-4 py-3"
              >
                <div className="text-sm font-bold text-white">{n.title}</div>
                <div className="text-xs text-[#909090]">{n.body}</div>
              </div>
            ))
          )}
        </div>
      )}

      {view === "profile" && profile && (
        <div className="max-w-md rounded-2xl border border-[#242424] bg-[#121212] p-6">
          <h3 className="font-serif text-2xl font-bold text-white">{profile.displayName}</h3>
          <p className="text-xs text-[#606060]">Screenwriter</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
            <div className="rounded-xl bg-[#0a0a0a] p-3">
              <div className="text-lg font-bold text-white">{profile.posts}</div>
              <div className="text-[10px] text-[#606060]">Posts</div>
            </div>
            <div className="rounded-xl bg-[#0a0a0a] p-3">
              <div className="text-lg font-bold text-white">{profile.replies}</div>
              <div className="text-[10px] text-[#606060]">Replies</div>
            </div>
            <div className="rounded-xl bg-[#0a0a0a] p-3">
              <div className="text-lg font-bold text-white">{profile.feedbackGiven}</div>
              <div className="text-[10px] text-[#606060]">Feedback Given</div>
            </div>
            <div className="rounded-xl bg-[#0a0a0a] p-3">
              <div className="text-lg font-bold text-white">{profile.feedbackReceived}</div>
              <div className="text-[10px] text-[#606060]">Feedback Received</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold text-[#606060]">Rooms</div>
            {(profile.rooms || []).map((r: any) => (
              <div key={r.id} className="mt-1 text-sm text-[#c8c4bc]">
                {r.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Report">
        <div className="space-y-3">
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full rounded-xl border border-[#242424] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <Button onClick={() => void submitReport()} className="w-full">
            Submit Report
          </Button>
        </div>
      </Modal>
    </div>
  );
}
