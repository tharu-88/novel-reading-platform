import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import "./delete-actions.css";
import { Settings, Trash2 } from "lucide-react";
import "./saffron-theme.css";
import Avatar from "./components/Avatar.jsx";
import AppHeader from "./components/AppHeader.jsx";
import BookGrid from "./components/BookGrid.jsx";
import AuthModal from "./components/AuthModal.jsx";
import ProfileSettingsDialog from "./components/ProfileSettingsDialog.jsx";
import "./profile-settings.css";
const genres = [
    "Sci-Fi",
    "Romance",
    "Dark Romance",
    "Mystery",
    "Thriller",
    "Fantasy",
    "Other",
];
const blank = () => ({
    title: "",
    description: "",
    genre: "Fantasy",
    cover: "",
    status: "draft",
    chapters: [],
});
const imageFile = (file, done) => {
    if (!file) return;
    if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 1200000
    ) {
        alert("Please choose a JPG, PNG or WebP image under 1.2 MB.");
        return;
    }
    const reader = new FileReader();
    reader.onload = () => done(reader.result);
    reader.readAsDataURL(file);
};

function App() {
    const [user, U] = useState(null),
        [token, T] = useState(localStorage.getItem("storyhaven_token") || ""),
        [tab, S] = useState("home"),
        [books, B] = useState([]),
        [mine, M] = useState([]),
        [library, L] = useState([]),
        [search, Q] = useState(""),
        [genre, G] = useState(""),
        [sort, Sort] = useState("newest"),
        [error, E] = useState(""),
        [notice, N] = useState(""),
        [authMode, A] = useState(""),
        [form, F] = useState({ username: "", email: "", password: "" }),
        [book, Open] = useState(null),
        [chapter, C] = useState(0),
        [font, Font] = useState(Number(localStorage.getItem("story_font") || 19)),
        [comments, Comments] = useState([]),
        [comment, Comment] = useState(""),
        [edit, Edit] = useState(null),
        [draft, D] = useState(blank()),
        [profile, P] = useState(null),
        [bio, Bio] = useState(""),
        [photo, Photo] = useState(""),
        [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
    const reader = useRef(null),
        timer = useRef(null),
        restoring = useRef(false);

    async function api(path, opts = {}) {
        const res = await fetch("/api" + path, {
            ...opts,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: "Bearer " + token } : {}),
                ...(opts.headers || {}),
            },
        });
        const data = await res.json();
        if (!res.ok) throw Error(data.message || "Request failed");
        return data;
    }
    const run = async (fn) => {
        E("");
        try {
            await fn();
        } catch (e) {
            E(e.message);
        }
    };
    const load = async () =>
        B(await api("/books?" + new URLSearchParams({ search, genre, sort })));
    const loadMine = async () => M(await api("/my/books"));
    const loadLibrary = async () => L(await api("/my/library"));

    useEffect(() => {
        run(load);
    }, [search, genre, sort]);
    useEffect(() => {
        if (token)
            run(async () => {
                U(await api("/me"));
                await Promise.all([loadMine(), loadLibrary()]);
            });
        else {
            U(null);
            M([]);
            L([]);
        }
    }, [token]);
    useEffect(() => {
        const id = new URLSearchParams(location.search).get("book");
        if (id)
            run(async () => {
                const shared = await api("/books/" + encodeURIComponent(id));
                Open(shared);
                C(0);
            });
    }, []);
    useEffect(() => {
        if (book?.chapters?.[chapter])
            run(async () =>
                Comments(
                    await api(
                        `/books/${book._id}/comments/${book.chapters[chapter]._id}`,
                    ),
                ),
            );
    }, [book?._id, chapter]);
    useEffect(() => {
        if (!notice) return;
        const timeoutId = setTimeout(() => N(""), 4000);
        return () => clearTimeout(timeoutId);
    }, [notice]);

    useEffect(() => {
        if (!error) return;
        const timeoutId = setTimeout(() => E(""), 4000);
        return () => clearTimeout(timeoutId);
    }, [error]);

    const requireUser = () => {
        if (!user) {
            A("login");
            return false;
        }
        return true;
    };
    const sign = () =>
        run(async () => {
            const result = await api(
                "/auth/" + (authMode === "login" ? "login" : "register"),
                { method: "POST", body: JSON.stringify(form) },
            );
            localStorage.setItem("storyhaven_token", result.token);
            T(result.token);
            U(result.user);
            A("");
            F({ username: "", email: "", password: "" });
            N("Welcome to Storyhaven!");
        });
    const selectTab = (nextTab) => {
        S(nextTab);
        Open(null);
        P(null);
        E("");
        if (nextTab === "publish" && user) run(loadMine);
        if (nextTab === "library" && user) run(loadLibrary);
    };
    const openBook = (selectedBook) =>
        run(async () => {
            const full = await api("/books/" + selectedBook._id);
            Open(full);
            P(null);
            const progress = user?.progress?.find(
                (item) => String(item.book) === full._id,
            );
            const nextChapter = Math.min(
                progress?.chapter || 0,
                full.chapters.length - 1,
            );
            C(nextChapter);
            restoring.current = true;
            setTimeout(() => {
                if (reader.current && progress?.scroll)
                    reader.current.scrollTop =
                        (reader.current.scrollHeight - reader.current.clientHeight) *
                        progress.scroll;
                restoring.current = false;
            }, 100);
        });
    const savePos = (ch, scroll) => {
        if (!user || !book) return;
        clearTimeout(timer.current);
        timer.current = setTimeout(
            () =>
                run(async () => {
                    await api("/progress/" + book._id, {
                        method: "PUT",
                        body: JSON.stringify({ chapter: ch, scroll }),
                    });
                    U((u) => ({
                        ...u,
                        progress: [
                            ...(u.progress || []).filter((p) => String(p.book) !== book._id),
                            { book: book._id, chapter: ch, scroll },
                        ],
                    }));
                }),
            400,
        );
    };
    const changeChapter = (n) => {
        C(n);
        if (reader.current) reader.current.scrollTop = 0;
        savePos(n, 0);
    };
    const libraryAction = (b, remove) => {
        if (!requireUser()) return;
        run(async () => {
            U(await api("/library/" + b._id, { method: remove ? "DELETE" : "POST" }));
            await loadLibrary();
            N(remove ? "Removed from your library" : "Added to your library");
        });
    };
    const saveBook = (status, successMessage) =>
        run(async () => {
            if (!requireUser()) return;
            const saved = await api("/books" + (draft._id ? "/" + draft._id : ""), {
                method: draft._id ? "PUT" : "POST",
                body: JSON.stringify({ ...draft, status }),
            });
            D(blank());
            await loadMine();
            await load();
                        N(
                            successMessage ||
                                (status === "draft"
                                    ? "Draft saved"
                                    : draft._id
                                        ? "Chapter changes saved"
                                        : "Your book is published!"),
                        );
        });
    const unpublishBook = (book) =>
        run(async () => {
            if (!confirm(`Unpublish "${book.title}"? Readers will no longer see it.`))
                return;
            await api(`/books/${book._id}/unpublish`, { method: "PATCH" });
            if (draft._id === book._id)
                D((current) => ({ ...current, status: "draft" }));
            await Promise.all([loadMine(), load(), loadLibrary()]);
            N("Book unpublished");
        });
    const showProfile = (id) =>
        run(async () => {
            P(await api("/users/" + id));
            Open(null);
            S("profile");
            if (user?.id === id) {
                Bio(user.bio || "");
                Photo(user.photo || "");
            }
        });
    const saveProfileSettings = async () => {
        E("");
        try {
            const updatedUser = await api("/me", {
                method: "PUT",
                body: JSON.stringify({ bio, photo }),
            });
            U(updatedUser);
            P(await api("/users/" + updatedUser.id));
            N("Profile updated");
            return true;
        } catch (error) {
            E(error.message);
            return false;
        }
    };
    const changePassword = async ({ currentPassword, newPassword }) => {
        E("");
        try {
            const result = await api("/me/password", {
                method: "PUT",
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            N(result.message);
            return true;
        } catch (error) {
            E(error.message);
            return false;
        }
    };
    const signOut = () => {
        localStorage.removeItem("storyhaven_token");
        T("");
        P(null);
        setProfileSettingsOpen(false);
        S("home");
    };
    const grid = (items) => (
        <BookGrid
            books={items}
            onOpen={openBook}
            onShowProfile={showProfile}
        />
    );
    return (
        <>
            <AppHeader
                user={user}
                activeTab={tab}
                onSelectTab={selectTab}
                onShowProfile={showProfile}
                onSignIn={() => A("login")}
            />
            {error && (
                <div className="alert error" role="alert">
                    {error}
                    <button onClick={() => E("")}>×</button>
                </div>
            )}
            {notice && (
                <div className="alert" role="status">
                    {notice}
                    <button onClick={() => N("")}>×</button>
                </div>
            )}
            {book ? (
                <main className="reader-shell">
                    <button className="text-button" onClick={() => Open(null)}>
                        ← Back to {tab}
                    </button>
                    <div className="reader-top">
                        <div>
                            <span className="eyebrow">
                                {book.genre} · {book.title}
                            </span>
                            <h1>{book.chapters[chapter]?.title}</h1>
                            <p className="muted">
                                A story by{" "}
                                <button
                                    className="author"
                                    onClick={() => showProfile(book.author._id)}
                                >
                                    {book.author.username}
                                </button>
                            </p>
                        </div>
                        <div className="reader-controls">
                            <select
                                aria-label="Choose chapter"
                                value={chapter}
                                onChange={(e) => changeChapter(Number(e.target.value))}
                            >
                                {book.chapters.map((c, i) => (
                                    <option value={i} key={c._id}>
                                        {i + 1}. {c.title}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => {
                                    Font(Math.max(14, font - 2));
                                    localStorage.setItem("story_font", Math.max(14, font - 2));
                                }}
                            >
                                A−
                            </button>
                            <button
                                onClick={() => {
                                    Font(Math.min(30, font + 2));
                                    localStorage.setItem("story_font", Math.min(30, font + 2));
                                }}
                            >
                                A+
                            </button>
                        </div>
                    </div>
                    <div
                        className="reading-area"
                        ref={reader}
                        onScroll={(e) => {
                            if (!restoring.current) {
                                const el = e.currentTarget;
                                savePos(
                                    chapter,
                                    el.scrollHeight > el.clientHeight
                                        ? el.scrollTop / (el.scrollHeight - el.clientHeight)
                                        : 0,
                                );
                            }
                        }}
                    >
                        <div className="chapter-content" style={{ fontSize: font }}>
                            {book.chapters[chapter]?.content}
                        </div>
                        <div className="chapter-end">
                            <span>✦</span>
                            <p>End of chapter</p>
                            <div className="row">
                                <button
                                    disabled={chapter === 0}
                                    onClick={() => changeChapter(chapter - 1)}
                                >
                                    ← Previous
                                </button>
                                <button
                                    disabled={chapter === book.chapters.length - 1}
                                    onClick={() => changeChapter(chapter + 1)}
                                >
                                    Next chapter →
                                </button>
                            </div>
                        </div>
                        <div className="engage">
                            <button
                                onClick={() => {
                                    if (requireUser())
                                        run(async () => {
                                            const v = await api("/books/" + book._id + "/vote", {
                                                method: "POST",
                                            });
                                            Open({ ...book, votes: v.votes });
                                        });
                                }}
                            >
                                ★{" "}
                                {book.votes?.some((v) => String(v) === user?.id)
                                    ? "Voted"
                                    : "Vote"}{" "}
                                · {book.votes?.length || 0}
                            </button>
                            <button
                                onClick={() =>
                                    document
                                        .getElementById("comments")
                                        ?.scrollIntoView({ behavior: "smooth" })
                                }
                            >
                                ♡ Comment
                            </button>
                            <button
                                onClick={() =>
                                    run(async () => {
                                        const url = location.origin + "/?book=" + book._id;
                                        if (navigator.share)
                                            await navigator.share({ title: book.title, url });
                                        else {
                                            await navigator.clipboard.writeText(url);
                                            N("Book link copied");
                                        }
                                    })
                                }
                            >
                                ↗ Share
                            </button>
                            <button
                                onClick={() =>
                                    libraryAction(
                                        book,
                                        user?.library?.some((x) => String(x) === book._id),
                                    )
                                }
                            >
                                {user?.library?.some((x) => String(x) === book._id)
                                    ? "− Library"
                                    : "+ Library"}
                            </button>
                        </div>
                        <section id="comments">
                            <h2>
                                Conversation <span className="muted">({comments.length})</span>
                            </h2>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (requireUser())
                                        run(async () => {
                                            await api(
                                                `/books/${book._id}/comments/${book.chapters[chapter]._id}`,
                                                {
                                                    method: "POST",
                                                    body: JSON.stringify({ text: comment }),
                                                },
                                            );
                                            Comment("");
                                            Comments(
                                                await api(
                                                    `/books/${book._id}/comments/${book.chapters[chapter]._id}`,
                                                ),
                                            );
                                        });
                                }}
                            >
                                <textarea
                                    placeholder="Share your thoughts on this chapter..."
                                    value={comment}
                                    maxLength="1000"
                                    onChange={(e) => Comment(e.target.value)}
                                    required
                                />
                                <button className="primary">Post comment</button>
                            </form>
                            {comments.map((c) => (
                                <div className="comment" key={c._id}>
                                    <Avatar profile={c.author} small />
                                    <div>
                                        <strong>{c.author?.username}</strong>
                                        <p>{c.text}</p>
                                        {user?.id === c.author?._id && (
                                            <div>
                                                <button
                                                    className="text-button"
                                                    onClick={() => {
                                                        const v = prompt("Edit your comment", c.text);
                                                        if (v !== null)
                                                            run(async () => {
                                                                await api("/comments/" + c._id, {
                                                                    method: "PUT",
                                                                    body: JSON.stringify({ text: v }),
                                                                });
                                                                Comments(
                                                                    await api(
                                                                        `/books/${book._id}/comments/${book.chapters[chapter]._id}`,
                                                                    ),
                                                                );
                                                            });
                                                    }}
                                                >
                                                    Edit
                                                </button>{" "}
                                                <button
                                                    className="icon-button danger"
                                                    aria-label="Delete comment"
                                                    title="Delete comment"
                                                    onClick={() => {
                                                        if (confirm("Delete this comment?"))
                                                            run(async () => {
                                                                await api("/comments/" + c._id, {
                                                                    method: "DELETE",
                                                                });
                                                                Comments(
                                                                    comments.filter((x) => x._id !== c._id),
                                                                );
                                                            });
                                                    }}
                                                >
                                                    <Trash2 aria-hidden="true" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </section>
                    </div>
                </main>
            ) : (
                <main>
                    {tab === "home" && (
                        <>
                            <section className="hero">
                                <div>
                                    <span className="eyebrow">
                                        A LITTLE SPACE FOR BIG STORIES
                                    </span>
                                    <h1>
                                        Find your next
                                        <br />
                                        <em>great escape.</em>
                                    </h1>
                                    <p>
                                        Somewhere between the first page and the last, you’ll find a
                                        world that feels like yours.
                                    </p>
                                    <button
                                        className="primary"
                                        onClick={() => selectTab("explore")}
                                    >
                                        Explore stories <span>↗</span>
                                    </button>
                                </div>
                                <div className="hero-art">
                                    <div className="orbit one"></div>
                                    <div className="orbit two"></div>
                                    <div className="hero-book">
                                        <span>✦</span>
                                        <small>
                                            EVERY STORY
                                            <br />
                                            STARTS SOMEWHERE
                                        </small>
                                        <b>
                                            your next
                                            <br />
                                            <i>chapter.</i>
                                        </b>
                                        <span>☾</span>
                                    </div>
                                    <span className="spark s1">✧</span>
                                    <span className="spark s2">✳</span>
                                </div>
                            </section>
                            <div className="section-heading">
                                <div>
                                    <span className="eyebrow">THE STORY SHELF</span>
                                    <h2>Stories to get lost in</h2>
                                    <p>Discover something new, one chapter at a time.</p>
                                </div>
                                <button
                                    className="text-button"
                                    onClick={() => selectTab("explore")}
                                >
                                    View all stories →
                                </button>
                            </div>
                            <div className="chips">
                                {["All", ...genres].map((g) => (
                                    <button
                                        key={g}
                                        className={
                                            (g === "All" && !genre) || g === genre ? "selected" : ""
                                        }
                                        onClick={() => G(g === "All" ? "" : g)}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                            {books.length ? (
                                grid(books)
                            ) : (
                                <div className="empty">
                                    No stories here yet. Be the first to publish one.
                                </div>
                            )}
                        </>
                    )}
                    {tab === "explore" && (
                        <>
                            <div className="page-heading">
                                <span className="eyebrow">DISCOVER YOUR NEXT FAVOURITE</span>
                                <h1>Explore stories</h1>
                                <p>Search by book title or author username.</p>
                            </div>
                            <div className="filters">
                                <input
                                    aria-label="Search stories"
                                    placeholder="⌕  Search books or authors..."
                                    value={search}
                                    onChange={(e) => Q(e.target.value)}
                                />
                                <select value={genre} onChange={(e) => G(e.target.value)}>
                                    <option value="">All genres</option>
                                    {genres.map((g) => (
                                        <option key={g}>{g}</option>
                                    ))}
                                </select>
                                <select value={sort} onChange={(e) => Sort(e.target.value)}>
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                    <option value="title">Title A–Z</option>
                                </select>
                            </div>
                            {books.length ? (
                                grid(books)
                            ) : (
                                <div className="empty">
                                    No stories found. Try another search or genre.
                                </div>
                            )}
                        </>
                    )}
                    {tab === "library" && (
                        <>
                            <div className="page-heading">
                                <span className="eyebrow">YOUR PERSONAL SHELF</span>
                                <h1>My library</h1>
                                <p>Keep the stories you love close by.</p>
                            </div>
                            {!user ? (
                                <div className="empty">
                                    Sign in to keep your favourite books in one place.{" "}
                                    <button className="primary" onClick={() => A("login")}>
                                        Sign in
                                    </button>
                                </div>
                            ) : library.length ? (
                                <>
                                    {grid(library)}
                                    <p className="muted">
                                        Open a book to continue reading or remove it from your
                                        library.
                                    </p>
                                </>
                            ) : (
                                <div className="empty">
                                    Your shelf is waiting. Find a story you love in Explore.{" "}
                                    <button
                                        className="primary"
                                        onClick={() => selectTab("explore")}
                                    >
                                        Explore stories
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    {tab === "publish" && (
                        <>
                            <div className="page-heading">
                                <span className="eyebrow">YOUR WORDS, YOUR WORLD</span>
                                <h1>Writer’s corner</h1>
                                <p>Bring your ideas to life, one chapter at a time.</p>
                            </div>
                            {!user ? (
                                <div className="empty">
                                    Sign in to start writing.{" "}
                                    <button className="primary" onClick={() => A("login")}>
                                        Sign in
                                    </button>
                                </div>
                            ) : (
                                <div className="publish-layout">
                                    <section className="panel">
                                        <div className="section-heading">
                                            <h2>{draft._id ? "Edit story" : "Create a story"}</h2>
                                            {draft._id && (
                                                <button
                                                    className="text-button"
                                                    onClick={() => D(blank())}
                                                >
                                                    Start new
                                                </button>
                                            )}
                                        </div>
                                        <label>
                                            Book title
                                            <input
                                                value={draft.title}
                                                maxLength="150"
                                                onChange={(e) => D({ ...draft, title: e.target.value })}
                                                placeholder="Give your story a title"
                                            />
                                        </label>
                                        <label>
                                            Genre
                                            <select
                                                value={draft.genre}
                                                onChange={(e) => D({ ...draft, genre: e.target.value })}
                                            >
                                                {genres.map((g) => (
                                                    <option key={g}>{g}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label>
                                            Description
                                            <textarea
                                                value={draft.description}
                                                maxLength="3000"
                                                onChange={(e) =>
                                                    D({ ...draft, description: e.target.value })
                                                }
                                                placeholder="What is your story about?"
                                            />
                                        </label>
                                        <label>
                                            Cover image <small>JPG, PNG or WebP · max 1.2 MB</small>
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={(e) =>
                                                    imageFile(e.target.files[0], (x) =>
                                                        D({ ...draft, cover: x }),
                                                    )
                                                }
                                            />
                                        </label>
                                        {draft.cover && (
                                            <div>
                                                <img className="cover-preview" src={draft.cover} />
                                                <button
                                                    className="icon-button danger"
                                                    aria-label="Remove cover"
                                                    title="Remove cover"
                                                    onClick={() => D({ ...draft, cover: "" })}
                                                >
                                                    <Trash2 aria-hidden="true" />
                                                </button>
                                            </div>
                                        )}
                                        <h3>Chapters</h3>
                                        {draft.chapters.map((c, i) => (
                                            <div className="chapter-edit" key={c._id || i}>
                                                <div className="row">
                                                    <strong>Chapter {i + 1}</strong>
                                                    <strong>Chapter {i + 1}</strong>
                                                    <select
                                                        aria-label={`Chapter ${i + 1} status`}
                                                        value={c.status || "published"}
                                                        onChange={(e) =>
                                                            D({
                                                                ...draft,
                                                                chapters: draft.chapters.map((x, j) =>
                                                                    i === j
                                                                        ? { ...x, status: e.target.value }
                                                                        : x,
                                                                ),
                                                            })
                                                        }
                                                    >
                                                        <option value="published">Published</option>
                                                        <option value="draft">Draft</option>
                                                    </select>
                                                    <button
                                                        className="icon-button danger"
                                                        aria-label={"Remove chapter " + (i + 1)}
                                                        title={"Remove chapter " + (i + 1)}
                                                        onClick={() => {
                                                            if (
                                                                confirm("Remove this chapter and its comments?")
                                                            )
                                                                D({
                                                                    ...draft,
                                                                    chapters: draft.chapters.filter(
                                                                        (_, j) => j !== i,
                                                                    ),
                                                                });
                                                        }}
                                                    >
                                                        <Trash2 aria-hidden="true" />
                                                    </button>
                                                </div>
                                                <input
                                                    placeholder="Chapter title"
                                                    value={c.title}
                                                    onChange={(e) =>
                                                        D({
                                                            ...draft,
                                                            chapters: draft.chapters.map((x, j) =>
                                                                i === j ? { ...x, title: e.target.value } : x,
                                                            ),
                                                        })
                                                    }
                                                />
                                                <textarea
                                                    className="chapter-input"
                                                    placeholder="Write your chapter here..."
                                                    value={c.content}
                                                    onChange={(e) =>
                                                        D({
                                                            ...draft,
                                                            chapters: draft.chapters.map((x, j) =>
                                                                i === j ? { ...x, content: e.target.value } : x,
                                                            ),
                                                        })
                                                    }
                                                />
                                            </div>
                                        ))}
                                        <button
                                            className="outline"
                                            onClick={() =>
                                                D({
                                                    ...draft,
                                                    chapters: [
                                                        ...draft.chapters,
                                                        {
                                                            title: "",
                                                            content: "",
                                                            status:
                                                                draft._id && draft.status === "published"
                                                                    ? "draft"
                                                                    : "published",
                                                        },
                                                    ],
                                                })
                                            }
                                        >
                                            + Add chapter
                                        </button>
                                        {draft._id && draft.status === "published" ? (
                                            <div className="row actions">
                                                <button
                                                    className="outline"
                                                    onClick={() =>
                                                        saveBook("published", "Chapter draft saved")
                                                    }
                                                >
                                                    Save chapter draft
                                                </button>
                                                <button
                                                    className="primary"
                                                    onClick={() =>
                                                        saveBook("published", "Chapter update published")
                                                    }
                                                >
                                                    Publish chapter update →
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="row actions">
                                                <button
                                                    className="outline"
                                                    onClick={() => saveBook("draft")}
                                                >
                                                    Save draft
                                                </button>
                                                <button
                                                    className="primary"
                                                    onClick={() => saveBook("published")}
                                                >
                                                    Publish story →
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                    <aside className="panel">
                                        <h2>Your stories</h2>
                                        <p className="muted">Drafts are only visible to you.</p>
                                        {mine.length ? (
                                            mine.map((b) => (
                                                <div className="work" key={b._id}>
                                                    <span className="eyebrow">{b.status}</span>
                                                    <h3>{b.title}</h3>
                                                    <p>{b.chapters.length} chapters</p>
                                                    <button
                                                        className="text-button"
                                                        onClick={() => {
                                                            D(b);
                                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                                        }}
                                                    >
                                                        Edit
                                                    </button>{" "}
                                                    {b.status === "published" && (
                                                        <>
                                                            <button
                                                                className="text-button"
                                                                onClick={() => unpublishBook(b)}
                                                            >
                                                                Unpublish
                                                            </button>{" "}
                                                        </>
                                                    )}
                                                    <button
                                                        className="icon-button danger"
                                                        aria-label="Delete book"
                                                        title="Delete book"
                                                        onClick={() => {
                                                            if (
                                                                confirm(
                                                                    "Permanently delete this book and its comments?",
                                                                )
                                                            )
                                                                run(async () => {
                                                                    await api("/books/" + b._id, {
                                                                        method: "DELETE",
                                                                    });
                                                                    if (draft._id === b._id) D(blank());
                                                                    await Promise.all([
                                                                        loadMine(),
                                                                        load(),
                                                                        loadLibrary(),
                                                                    ]);
                                                                    N("Book deleted");
                                                                });
                                                        }}
                                                    >
                                                        <Trash2 aria-hidden="true" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="muted">Your stories will appear here.</p>
                                        )}
                                    </aside>
                                </div>
                            )}
                        </>
                    )}
                    {tab === "profile" && profile && (
                        <>
                            <div className="profile-head">
                                <Avatar profile={profile.user} />
                                <div>
                                    <span className="eyebrow">READER & STORYTELLER</span>
                                    <h1>{profile.user.username}</h1>
                                    <p>{profile.user.bio || "No bio yet."}</p>
                                </div>
                                {user?.id === profile.user.id && (
                                    <button
                                        className="outline profile-settings-trigger"
                                        onClick={() => setProfileSettingsOpen(true)}
                                    >
                                        <Settings aria-hidden="true" />
                                        Profile settings
                                    </button>
                                )}
                            </div>
                            {user?.id === profile.user.id && profileSettingsOpen && (
                                <ProfileSettingsDialog
                                    bio={bio}
                                    photo={photo}
                                    onBioChange={Bio}
                                    onPhotoChange={Photo}
                                    onImageSelect={imageFile}
                                    onClearPhoto={() => Photo("")}
                                    onSaveProfile={saveProfileSettings}
                                    onChangePassword={changePassword}
                                    onSignOut={signOut}
                                    onClose={() => setProfileSettingsOpen(false)}
                                />
                            )}
                            <div className="section-heading">
                                <h2>Published stories</h2>
                            </div>
                            {profile.books.length ? (
                                grid(profile.books)
                            ) : (
                                <p className="muted">No published stories yet.</p>
                            )}
                            <div className="section-heading">
                                <h2>Reading list</h2>
                            </div>
                            {profile.library.length ? (
                                grid(profile.library)
                            ) : (
                                <p className="muted">No books on this shelf yet.</p>
                            )}
                        </>
                    )}
                </main>
            )}
            <footer>
                <div className="brand">
                    <span className="brand-mark">✺</span>
                    <span>storyhaven</span>
                </div>
                <p>Stories bring us together. Make yourself at home.</p>
                <small>MADE FOR READERS & WRITERS ✦</small>
            </footer>
            {authMode && (
                <AuthModal
                    mode={authMode}
                    form={form}
                    onChange={F}
                    onClose={() => A("")}
                    onModeChange={A}
                    onSubmit={sign}
                />
            )}
        </>
    );
}
createRoot(document.getElementById("root")).render(<App />);
