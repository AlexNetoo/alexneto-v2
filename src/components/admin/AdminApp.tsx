'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Project } from '@/data/projects';
import { AdminAnalytics } from './AdminAnalytics';
import { AlertBanner, AlertDialog, Badge, Button, Card, Caption, Checkbox, Heading, IconButton, Label as KitLabel, SwitchToggle, Tabs, TextArea, TextInput } from '@/halaska-kit';
import { AdminPortal } from './AdminProviders';
import { MediaLibrary } from './MediaLibrary';
import { fromImg, itemFromFile, itemFromUrl, slugify, thumb, uploadItem, type ImgItem } from './images';

const MAX_GALLERY = 30;

type Form = {
  title: string;
  slug: string;
  year: string;
  link: string;
  industry: string;
  scope: string;
  description: string;
  featured: boolean;
  cover: ImgItem | null;
  gallery: ImgItem[];
};

const emptyForm: Form = { title: '', slug: '', year: '', link: '', industry: '', scope: '', description: '', featured: false, cover: null, gallery: [] };

type Notice = { kind: 'ok' | 'err'; text: string } | null;
type Picker = null | 'cover' | 'gallery';

export function AdminApp({ initial, storageReady }: { initial: Project[]; storageReady: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<'projects' | 'analytics'>('projects');
  const [projects, setProjects] = useState<Project[]>(initial);
  const [form, setForm] = useState<Form>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [notice, setNotice] = useState<Notice>(initial.length || storageReady ? null : { kind: 'err', text: 'Storage is not configured, changes cannot be saved.' });
  const [picker, setPicker] = useState<Picker>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const formTop = useRef<HTMLDivElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const say = (kind: 'ok' | 'err', text: string) => {
    clearTimeout(noticeTimer.current);
    setNotice({ kind, text });
    if (kind === 'ok') noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  };
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  /** Saves the whole list. Returns the list the server stored, or null on failure. */
  async function persist(next: Project[]): Promise<Project[] | null> {
    try {
      const res = await fetch('/api/admin/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projects: next }) });
      const data = (await res.json().catch(() => ({}))) as { projects?: Project[]; error?: string };
      if (res.status === 401) {
        say('err', 'Your session expired. Reloading…');
        setTimeout(() => router.refresh(), 800);
        return null;
      }
      if (!res.ok || !data.projects) throw new Error(data.error || 'Could not save.');
      return data.projects;
    } catch (e) {
      say('err', e instanceof Error ? e.message : 'Could not save.');
      return null;
    }
  }

  /** Optimistic update for quick actions (feature, reorder, delete). */
  async function quick(next: Project[], okText: string) {
    if (busy) return;
    const prev = projects;
    setProjects(next);
    setBusy(true);
    const saved = await persist(next);
    setBusy(false);
    if (saved) {
      setProjects(saved);
      say('ok', okText);
    } else setProjects(prev);
  }

  const resetForm = () => {
    for (const it of [form.cover, ...form.gallery]) if (it?.file) URL.revokeObjectURL(it.src);
    setForm(emptyForm);
    setSlugTouched(false);
    setEditing(null);
  };

  const startEdit = (p: Project) => {
    resetForm();
    setEditing(p.slug);
    setSlugTouched(true);
    setForm({
      title: p.title,
      slug: p.slug,
      year: p.year ?? '',
      link: p.link ?? '',
      industry: p.industry ?? '',
      scope: p.scope ?? '',
      description: p.description ?? '',
      featured: Boolean(p.featured),
      cover: fromImg(p.cover),
      gallery: p.gallery.map(fromImg),
    });
    setNotice(null);
    formTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onTitle = (v: string) => setForm((f) => ({ ...f, title: v, slug: slugTouched ? f.slug : slugify(v) }));

  const pickCover = async (file?: File) => {
    if (!file) return;
    try {
      const it = await itemFromFile(file);
      if (form.cover?.file) URL.revokeObjectURL(form.cover.src);
      set('cover', it);
    } catch (e) {
      say('err', e instanceof Error ? e.message : 'Could not read that image.');
    }
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_GALLERY - form.gallery.length;
    const added: ImgItem[] = [];
    for (const f of Array.from(files).slice(0, room)) {
      try {
        added.push(await itemFromFile(f));
      } catch (e) {
        say('err', e instanceof Error ? e.message : 'Could not read that image.');
      }
    }
    if (files.length > room) say('err', `Only ${MAX_GALLERY} images per project, the rest were skipped.`);
    setForm((f) => ({ ...f, gallery: [...f.gallery, ...added] }));
  };

  const fromLibrary = async (urls: string[]) => {
    const target = picker;
    setPicker(null);
    try {
      const items = await Promise.all(urls.map(itemFromUrl));
      if (target === 'cover') set('cover', items[0]);
      else setForm((f) => ({ ...f, gallery: [...f.gallery, ...items].slice(0, MAX_GALLERY) }));
    } catch (e) {
      say('err', e instanceof Error ? e.message : 'Could not load that image.');
    }
  };

  const moveGallery = (i: number, d: number) =>
    setForm((f) => {
      const g = [...f.gallery];
      const j = i + d;
      if (j < 0 || j >= g.length) return f;
      [g[i], g[j]] = [g[j], g[i]];
      return { ...f, gallery: g };
    });

  const removeGallery = (i: number) =>
    setForm((f) => {
      const it = f.gallery[i];
      if (it?.file) URL.revokeObjectURL(it.src);
      return { ...f, gallery: f.gallery.filter((_, k) => k !== i) };
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const slug = form.slug.trim();
    if (!form.title.trim()) return say('err', 'Add a project title.');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return say('err', 'The slug can only use lowercase letters, numbers and dashes.');
    if (projects.some((p) => p.slug === slug && p.slug !== editing)) return say('err', `Another project already uses “${slug}”.`);
    if (!form.cover) return say('err', 'Add a cover image.');
    if (form.link.trim() && !/^https?:\/\//i.test(form.link.trim())) return say('err', 'The project link must start with http:// or https://');

    setBusy(true);
    setNotice(null);
    try {
      const total = form.gallery.length;
      setProgress('Uploading cover…');
      const cover = await uploadItem(form.cover, slug);
      const gallery = [];
      for (let i = 0; i < total; i++) {
        if (form.gallery[i].file) setProgress(`Uploading image ${i + 1} of ${total}…`);
        gallery.push(await uploadItem(form.gallery[i], slug));
      }
      setProgress('Saving…');
      const old = editing ? projects.find((p) => p.slug === editing) : undefined;
      const project: Project = {
        slug,
        title: form.title.trim(),
        year: form.year.trim() || undefined,
        link: form.link.trim() || undefined,
        industry: form.industry.trim() || undefined,
        scope: form.scope.trim() || undefined,
        description: form.description.trim() || undefined,
        focus: old?.focus,
        featured: form.featured,
        cover,
        gallery,
      };
      const next = editing ? projects.map((p) => (p.slug === editing ? project : p)) : [project, ...projects];
      const saved = await persist(next);
      if (!saved) return;
      setProjects(saved);
      say('ok', editing ? `Saved “${project.title}”.` : `Added “${project.title}”, it is live now.`);
      resetForm();
    } catch (err) {
      say('err', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const remove = (p: Project) => {
    if (editing === p.slug) resetForm();
    void quick(
      projects.filter((x) => x.slug !== p.slug),
      `Deleted “${p.title}”.`,
    );
  };

  const toggleFeatured = (p: Project) =>
    void quick(
      projects.map((x) => (x.slug === p.slug ? { ...x, featured: !x.featured } : x)),
      p.featured ? `“${p.title}” removed from the landing page.` : `“${p.title}” is now featured on the landing page.`,
    );

  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= projects.length) return;
    const next = [...projects];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    void quick(next, 'Order saved.');
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
  };

  const featuredCount = projects.filter((p) => p.featured).length;
  const tabNames = { projects: 'Projects', analytics: 'Analytics' } as const;
  // the landing page cards are 565 x 748 (portrait): a cover within 2% of that ratio is shown uncropped
  const coverOk = form.cover && Math.abs(form.cover.w / form.cover.h / (565 / 748) - 1) < 0.02;

  return (
    <div className="adm-page">
      <div className="adm-wide">
        <header className="adm-top">
          <Heading level={2}>Admin Dashboard</Heading>
          <div className="adm-top__links">
            <Button type="button" variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => window.location.assign('/')}>
              Back to Website
            </Button>
          </div>
        </header>

        <Tabs tabs={[tabNames.projects, tabNames.analytics]} value={tabNames[tab]} onChange={(t: string) => setTab(t === tabNames.analytics ? 'analytics' : 'projects')} />

        {notice && (
          <div className="adm-notice">
            <AlertBanner variant={notice.kind === 'ok' ? 'success' : 'danger'} description={notice.text} />
            <IconButton icon="×" size={28} label="Dismiss" onClick={() => setNotice(null)} style={{ position: 'absolute', top: 6, right: 6 }} />
          </div>
        )}

        {tab === 'analytics' ? (
          <div style={{ marginTop: 24 }}>
            <AdminAnalytics />
          </div>
        ) : (
          <div className="adm-grid">
            {/* ------------------------------------------------ form */}
            <div ref={formTop}>
              <Card>
                <div className="adm-row adm-row--between" style={{ marginBottom: 20 }}>
                  <Heading level={4}>{editing ? 'Edit Project' : 'Add New Project'}</Heading>
                  {editing && (
                    <Button type="button" variant="ghost" size="sm" onClick={resetForm} disabled={busy}>
                      Cancel
                    </Button>
                  )}
                </div>
                <form onSubmit={submit} className="adm-form">
                  <TextInput label="Project Title *" value={form.title} onChange={onTitle} />

                  <div className="adm-row">
                    <TextInput
                      label="Project Slug *"
                      value={form.slug}
                      placeholder="e.g., my-awesome-project"
                      onChange={(v: string) => {
                        setSlugTouched(true);
                        set('slug', v.toLowerCase());
                      }}
                      caption={`This will be used in the URL: alexneto-v2.vercel.app/projects/${form.slug || 'project-slug'}`}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setSlugTouched(false);
                        set('slug', slugify(form.title));
                      }}
                      style={{ marginBottom: 24 }}
                    >
                      Auto
                    </Button>
                  </div>

                  <TextInput label="Year" value={form.year} placeholder="e.g., 2025 or 2022–25" onChange={(v: string) => set('year', v)} />
                  <TextInput label="Project Link (optional)" value={form.link} placeholder="https://" onChange={(v: string) => set('link', v)} />
                  <TextInput label="Industry (optional)" value={form.industry} placeholder="e.g., Technology, Healthcare, Finance" onChange={(v: string) => set('industry', v)} />
                  <TextInput label="Scope of Work (optional)" value={form.scope} placeholder="e.g., Product design" onChange={(v: string) => set('scope', v)} />
                  <TextArea label="Description (optional)" value={form.description} placeholder="A sentence or two about the project" rows={3} caption="Shown under the title on the project page." onChange={(v: string) => set('description', v.slice(0, 600))} />

                  <div>
                    <Label>Cover Image *</Label>
                    <Hint>Ideal: portrait 565:748, like the cards on the landing page (e.g. 1130×1496) · Max 10MB · JPG, PNG, GIF, WebP</Hint>
                    {form.cover ? (
                      <div className="adm-cover">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.cover.file ? form.cover.src : thumb(form.cover.src, 640)} alt="Cover preview" />
                        <div className="adm-cover__meta">
                          <Hint>
                            {form.cover.w}×{form.cover.h}
                            {form.cover.file ? ' · will upload on save' : ''}
                            {coverOk ? ' · matches the landing page cards ✓' : ' · not 565:748, it will be cropped to fit the landing page cards'}
                          </Hint>
                          <Button type="button" variant="outline" size="sm" onClick={() => set('cover', null)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="adm-row adm-row--wrap">
                        <input ref={coverInput} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => pickCover(e.target.files?.[0])} />
                        <Button type="button" variant="secondary" size="sm" onClick={() => coverInput.current?.click()}>
                          Upload image
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setPicker('cover')}>
                          Choose from library
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Additional Images</Label>
                    <Hint>Recommended 2400×1350, 16:9 · up to {MAX_GALLERY} · Max 10MB each</Hint>
                    {form.gallery.length > 0 && (
                      <ol className="adm-gal">
                        {form.gallery.map((g, i) => (
                          <li key={g.key}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={g.file ? g.src : thumb(g.src)} alt="" />
                            <span className="adm-gal__n">{i + 1}</span>
                            <span className="adm-gal__tools">
                              <button type="button" aria-label="Move earlier" onClick={() => moveGallery(i, -1)} disabled={i === 0}>
                                ←
                              </button>
                              <button type="button" aria-label="Move later" onClick={() => moveGallery(i, 1)} disabled={i === form.gallery.length - 1}>
                                →
                              </button>
                              <button type="button" aria-label="Remove image" onClick={() => removeGallery(i)}>
                                ×
                              </button>
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                    <div className="adm-row adm-row--wrap">
                      <input
                        ref={galleryInput}
                        hidden
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        key={form.gallery.length}
                        onChange={(e) => addFiles(e.target.files)}
                        disabled={form.gallery.length >= MAX_GALLERY}
                      />
                      <Button type="button" variant="secondary" size="sm" onClick={() => galleryInput.current?.click()} disabled={form.gallery.length >= MAX_GALLERY}>
                        Upload images
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => setPicker('gallery')} disabled={form.gallery.length >= MAX_GALLERY}>
                        Choose from library
                      </Button>
                    </div>
                  </div>

                  <Checkbox
                    checked={form.featured}
                    onChange={(v: boolean) => set('featured', v)}
                    label={
                      <span style={{ display: 'grid', gap: 2 }}>
                        <span style={{ fontWeight: 500 }}>Feature on the landing page</span>
                        <Hint>Shows this project in “Selected work” on the home page.</Hint>
                      </span>
                    }
                  />

                  <div className="adm-row adm-row--wrap" style={{ alignItems: 'center' }}>
                    <Button type="submit" loading={busy} disabled={!storageReady}>
                      {busy ? progress || 'Saving…' : editing ? 'Save Changes' : 'Add Project'}
                    </Button>
                    {!storageReady && <Hint>Storage is not configured.</Hint>}
                  </div>
                </form>
              </Card>
            </div>

            {/* ------------------------------------------------ list */}
            <Card>
              <div className="adm-row adm-row--between">
                <Heading level={4}>Manage Projects</Heading>
                <Hint>Drag to reorder</Hint>
              </div>
              <p style={{ fontSize: 13, opacity: 0.65, marginTop: 6 }}>
                {projects.length} project{projects.length === 1 ? '' : 's'} · {featuredCount} featured on the landing page
              </p>

              {projects.length === 0 && <p style={{ fontSize: 13, opacity: 0.65, marginTop: 16 }}>No projects yet. Add your first one on the left.</p>}

              <ul className="adm-list">
                {projects.map((p, i) => (
                  <li
                    key={p.slug}
                    className={`adm-item${dragFrom === i ? ' is-dragging' : ''}${dragOver === i && dragFrom !== null && dragFrom !== i ? ' is-over' : ''}${editing === p.slug ? ' is-editing' : ''}`}
                    draggable={!busy}
                    onDragStart={(e) => {
                      setDragFrom(i);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', p.slug);
                    }}
                    onDragOver={(e) => {
                      if (dragFrom === null) return;
                      e.preventDefault();
                      setDragOver(i);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragFrom !== null) reorder(dragFrom, i);
                      setDragFrom(null);
                      setDragOver(null);
                    }}
                    onDragEnd={() => {
                      setDragFrom(null);
                      setDragOver(null);
                    }}
                  >
                    <span className="adm-handle" aria-hidden="true" title="Drag to reorder">
                      ⋮⋮
                    </span>
                    <div className="adm-item__body">
                      <div className="adm-item__top">
                        <div>
                          <h3 className="adm-item__title">
                            <span style={{ fontSize: 16, fontWeight: 600 }}>{p.title}</span>
                            {p.featured && <Badge>Featured</Badge>}
                          </h3>
                          <Hint>{[p.year, p.scope, p.industry].filter(Boolean).join(' · ') || '—'}</Hint>
                        </div>
                        <div className="adm-item__actions">
                          <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(p)} disabled={busy}>
                            Edit
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setDeleting(p)} disabled={busy}>
                            Delete
                          </Button>
                        </div>
                      </div>
                      <Hint>
                        Slug: <code>{p.slug}</code> · URL:{' '}
                        <a className="adm-link" href={`/projects/${p.slug}`} target="_blank" rel="noopener noreferrer">
                          /projects/{p.slug}
                        </a>
                      </Hint>
                      <div className="adm-item__foot">
                        <div className="adm-thumbs" aria-hidden="true">
                          {[p.cover, ...p.gallery.slice(0, 3)].map((g, k) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={g.src + k} src={thumb(g.src, 192)} alt="" loading="lazy" />
                          ))}
                        </div>
                        <div className="adm-item__tools">
                          <SwitchToggle checked={Boolean(p.featured)} onChange={() => !busy && toggleFeatured(p)} label="Landing page" aria-label={`Show ${p.title} in Selected work on the landing page`} />
                          <span style={{ display: 'flex' }}>
                            <IconButton icon="↑" size={30} label={`Move ${p.title} up`} onClick={() => !busy && i > 0 && reorder(i, i - 1)} style={{ opacity: busy || i === 0 ? 0.3 : 1 }} />
                            <IconButton icon="↓" size={30} label={`Move ${p.title} down`} onClick={() => !busy && i < projects.length - 1 && reorder(i, i + 1)} style={{ opacity: busy || i === projects.length - 1 ? 0.3 : 1 }} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>

      {picker && (
        <AdminPortal>
          <MediaLibrary multiple={picker === 'gallery'} onClose={() => setPicker(null)} onPick={fromLibrary} />
        </AdminPortal>
      )}

      {deleting && (
        <AdminPortal>
          <AlertDialog
            open
            onClose={() => setDeleting(null)}
            title={`Delete “${deleting.title}”?`}
            description="Its uploaded images are removed too. This can’t be undone."
            variant="info"
            confirmLabel="Delete"
            onConfirm={() => remove(deleting)}
          />
        </AdminPortal>
      )}
    </div>
  );
}

/** Small field label / helper line, matching the kit's own Label and Caption. */
function Label({ children }: { children: React.ReactNode }) {
  return <KitLabel style={{ marginBottom: 2 }}>{children}</KitLabel>;
}
function Hint({ children }: { children: React.ReactNode }) {
  return <Caption style={{ display: 'block', marginBottom: 6 }}>{children}</Caption>;
}
