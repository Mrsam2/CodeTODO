'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LottieLoader } from '@/components/LottieLoader';
import { Button, Card, Chip, EmptyState, Input, ProgressBar, Row, SectionHeader, CategoryIcon, Modal } from '@/components/ui';
import { categoryCompletionPct } from '@/lib/roadmap';
import { useAppStore } from '@/store/useAppStore';
import { Category } from '@/types';

const PALETTE = ['#2563EB', '#D97706', '#059669', '#DC2626', '#7C3AED', '#DB2777', '#0891B2'];
const ICONS = ['📘', '🧠', '💬', '💻', '🏋️', '🎯', '🎨'];

function BrandIconPreview({ slug, size = 14 }: { slug: string; size?: number }) {
  const url = `https://thesvg.org/icons/${slug}/default.svg`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} style={{ width: size, height: size, objectFit: 'contain', marginRight: 4 }} alt="" />;
}

export default function CategoriesPage() {
  const router = useRouter();
  const store = useAppStore();

  useEffect(() => {
    store.syncWithCloud(['categories', 'roadmapNodes']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const activeCategories = store.categories.filter((c) => !c.isDeleted);
  const [icon, setIcon] = useState(ICONS[0]);
  const [pace, setPace] = useState('60');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState(PALETTE[0]);
  const [editIcon, setEditIcon] = useState(ICONS[0]);
  const [editPace, setEditPace] = useState('60');

  const [brandSearch, setBrandSearch] = useState('');
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [brandPreviewSvg, setBrandPreviewSvg] = useState('');
  const [searchResults, setSearchResults] = useState<{ slug: string; title: string }[]>([]);

  const handleBrandSearchChange = async (text: string) => {
    setBrandSearch(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`https://thesvg.org/api/icons?q=${encodeURIComponent(text.trim())}&limit=8`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setSearchResults(data.map((item: { slug?: string; id?: string; title?: string; name?: string }) => ({
            slug: item.slug || item.id || '',
            title: item.title || item.name || '',
          })));
        } else if (data && Array.isArray(data.icons)) {
          setSearchResults(data.icons.map((item: { slug?: string; id?: string; title?: string; name?: string }) => ({
            slug: item.slug || item.id || '',
            title: item.title || item.name || '',
          })));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch search results:', err);
    }
  };

  const applySearchedIcon = async (slug: string) => {
    setLoadingBrand(true);
    try {
      const response = await fetch(`https://thesvg.org/icons/${slug}/default.svg`);
      if (response.ok) {
        const svgXml = await response.text();
        if (editingId) {
          setEditIcon(svgXml);
        } else {
          setIcon(svgXml);
        }
        setBrandSearch('');
        setSearchResults([]);
        setBrandPreviewSvg('');
      } else {
        window.alert('Failed to retrieve icon from CDN.');
      }
    } catch (err) {
      console.warn('Failed to fetch brand SVG:', err);
      window.alert('Failed to retrieve icon from CDN.');
    } finally {
      setLoadingBrand(false);
    }
  };

  const fetchBrandIcon = async (slug: string) => {
    if (!slug.trim()) return;
    setLoadingBrand(true);
    try {
      const response = await fetch(`https://thesvg.org/icons/${slug.toLowerCase().trim()}/default.svg`);
      if (response.ok) {
        const svgXml = await response.text();
        setBrandPreviewSvg(svgXml);
      } else {
        setBrandPreviewSvg('');
        window.alert(`Brand "${slug}" was not found on thesvg.org.`);
      }
    } catch (err) {
      console.warn('Failed to fetch from thesvg CDN:', err);
      setBrandPreviewSvg('');
      window.alert('Failed to connect to thesvg.org CDN.');
    } finally {
      setLoadingBrand(false);
    }
  };

  const add = () => {
    if (!name.trim()) return;
    store.addCategory({ name: name.trim(), description: description.trim(), color, icon, targetPacePerDayMins: Number(pace) || 60 });
    setName('');
    setDescription('');
    setShowForm(false);
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description || '');
    setEditColor(category.color);
    setEditIcon(category.icon || ICONS[0]);
    setEditPace(String(category.targetPacePerDayMins || 60));
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    store.updateCategory(editingId, {
      name: editName.trim(),
      description: editDescription.trim(),
      color: editColor,
      icon: editIcon,
      targetPacePerDayMins: Number(editPace) || 60,
    });
    setEditingId(null);
  };

  const confirmDelete = (categoryId: string, categoryName: string) => {
    setDeleteConfirmId(categoryId);
    setDeleteConfirmName(categoryName);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      store.deleteCategory(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const brandSearchPanel = (
    <>
      <Row style={{ marginTop: 4, gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Input value={brandSearch} onChangeText={handleBrandSearchChange} placeholder="Search brand icon (e.g. leet)" />
        </div>
        <Button small title={loadingBrand ? '...' : 'Get SVG'} onPress={() => fetchBrandIcon(brandSearch)} />
      </Row>
      {searchResults.length > 0 && (
        <div style={{ marginTop: 4, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
            Matching brand icons (tap to apply):
          </span>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 6, overflowX: 'auto' }}>
            {searchResults.map((result) => (
              <button
                key={result.slug}
                onClick={() => applySearchedIcon(result.slug)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 999,
                  backgroundColor: '#EEF2F6',
                  border: '1px solid #4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <BrandIconPreview slug={result.slug} size={14} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>{result.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {brandPreviewSvg && (
        <Row style={{ gap: 8, alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: 12 }}>Preview:</span>
          <CategoryIcon icon={brandPreviewSvg} size={24} />
          <Button
            small
            variant="secondary"
            title="Apply SVG"
            onPress={() => {
              if (editingId) setEditIcon(brandPreviewSvg);
              else setIcon(brandPreviewSvg);
              setBrandPreviewSvg('');
              setBrandSearch('');
            }}
          />
        </Row>
      )}
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title="Learning tracks" right={<Button small variant="ghost" title={showForm ? 'Cancel' : '+ Category'} onPress={() => setShowForm((v) => !v)} />} />

      {showForm ? (
        <Card>
          <Input value={name} onChangeText={setName} placeholder="Name (e.g. DSA)" />
          <Input value={description} onChangeText={setDescription} placeholder="What are you trying to achieve?" />
          <Input value={pace} onChangeText={setPace} placeholder="Target minutes/day" keyboardType="numeric" />
          <Row style={{ flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {PALETTE.map((c) => (
              <Chip key={c} label={c === color ? '● picked' : '●'} color={c} selected={c === color} onPress={() => setColor(c)} />
            ))}
          </Row>
          <Row style={{ flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {ICONS.map((i) => (
              <Chip key={i} label={i} selected={i === icon} onPress={() => setIcon(i)} />
            ))}
          </Row>
          {brandSearchPanel}
          <Button style={{ marginTop: 8 }} title="Create category" onPress={add} disabled={!name.trim()} />
        </Card>
      ) : null}

      {activeCategories.length === 0 ? (
        store.loadingSections?.categories ? (
          <LottieLoader text="Syncing Categories..." size={120} />
        ) : (
          <EmptyState title="No categories yet" subtitle="Create a track like DSA, English Speaking, or LeetCode." />
        )
      ) : (
        activeCategories.map((category) => {
          const pct = categoryCompletionPct(store.roadmapNodes, category.id);
          const nodeCount = store.roadmapNodes.filter((n) => n.categoryId === category.id).length;
          const isEditing = editingId === category.id;

          return (
            <Card key={category.id}>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Edit Track</span>
                  <Input value={editName} onChangeText={setEditName} placeholder="Name" />
                  <Input value={editDescription} onChangeText={setEditDescription} placeholder="Description" />
                  <Input value={editPace} onChangeText={setEditPace} placeholder="Target minutes/day" keyboardType="numeric" />
                  <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                    {PALETTE.map((c) => (
                      <Chip key={c} label={c === editColor ? '● picked' : '●'} color={c} selected={c === editColor} onPress={() => setEditColor(c)} />
                    ))}
                  </Row>
                  <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                    {ICONS.map((i) => (
                      <Chip key={i} label={i} selected={i === editIcon} onPress={() => setEditIcon(i)} />
                    ))}
                  </Row>
                  {brandSearchPanel}
                  <Row style={{ gap: 8, marginTop: 8 }}>
                    <Button title="Cancel" variant="ghost" onPress={() => setEditingId(null)} />
                    <Button title="Save Changes" onPress={saveEdit} disabled={!editName.trim()} />
                  </Row>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => router.push(`/category/${category.id}`)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                  >
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Row>
                        <CategoryIcon icon={category.icon} size={18} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{category.name}</span>
                      </Row>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {nodeCount ? `${pct}% · ${nodeCount} topics` : 'No roadmap yet'}
                      </span>
                    </Row>
                    <ProgressBar pct={pct} color={category.color} />
                    {category.description ? (
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>{category.description}</span>
                    ) : null}
                  </button>

                  <Row style={{ justifyContent: 'flex-end', gap: 8, marginTop: 8, borderTop: '1px solid #ECECE9', paddingTop: 8 }}>
                    <Button small variant="secondary" title="Edit" onPress={() => startEdit(category)} />
                    <Button small variant="ghost" title="Delete" onPress={() => confirmDelete(category.id, category.name)} />
                  </Row>
                </div>
              )}
            </Card>
          );
        })
      )}

      <Modal
        visible={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Track?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
          <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Are you sure you want to delete the track <strong>&quot;{deleteConfirmName}&quot;</strong>?
            <br /><br />
            This will hide it from your dashboard and move it to the Recycle Bin in Settings, where you can restore it or delete it permanently.
          </span>
          <Row style={{ justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button title="Cancel" variant="secondary" onPress={() => setDeleteConfirmId(null)} />
            <Button title="Delete" onPress={handleDeleteConfirm} style={{ backgroundColor: 'var(--color-error)' }} />
          </Row>
        </div>
      </Modal>
    </div>
  );
}
