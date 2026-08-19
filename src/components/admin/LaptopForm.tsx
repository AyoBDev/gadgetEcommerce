'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { Laptop } from '@/payload-types';

export type LaptopFormOption = { id: number; name: string; thumbnailURL?: string | null };

type Props = {
  initial: Laptop | null;
  brands: LaptopFormOption[];
  categories: LaptopFormOption[];
  media: LaptopFormOption[];
};

export function LaptopForm({ initial, brands, categories, media }: Props) {
  const router = useRouter();
  const isNew = !initial;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [brand, setBrand] = useState(String(initial?.brand && typeof initial.brand === 'object' ? initial.brand.id : initial?.brand ?? ''));
  const [category, setCategory] = useState(String(initial?.category && typeof initial.category === 'object' ? initial.category.id : initial?.category ?? ''));
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [compareAtPrice, setCompareAtPrice] = useState(initial?.compareAtPrice != null ? String(initial.compareAtPrice) : '');
  const [condition, setCondition] = useState(initial?.condition ?? 'grade-a');
  const [specs, setSpecs] = useState({
    processor: initial?.specs?.processor ?? '',
    ram: initial?.specs?.ram != null ? String(initial.specs.ram) : '',
    storage: initial?.specs?.storage ?? '',
    screenSize: initial?.specs?.screenSize != null ? String(initial.specs.screenSize) : '',
    batteryHealth: initial?.specs?.batteryHealth != null ? String(initial.specs.batteryHealth) : '',
    os: initial?.specs?.os ?? '',
  });
  const [gallery, setGallery] = useState<string[]>(
    initial?.gallery?.map((g) => String(typeof g.image === 'object' ? g.image.id : g.image)) ?? [''],
  );
  const [description, setDescription] = useState(
    initial?.description && typeof initial.description === 'string' ? initial.description : '',
  );
  const [warrantyDays, setWarrantyDays] = useState(initial?.warrantyDays != null ? String(initial.warrantyDays) : '7');
  const [stock, setStock] = useState(initial?.stock != null ? String(initial.stock) : '1');
  const [status, setStatus] = useState(initial?.status ?? 'draft');
  const [seo, setSeo] = useState({
    metaTitle: initial?.seo?.metaTitle ?? '',
    metaDescription: initial?.seo?.metaDescription ?? '',
    ogImage: initial?.seo?.ogImage && typeof initial.seo.ogImage === 'object' ? String(initial.seo.ogImage.id) : initial?.seo?.ogImage ? String(initial.seo.ogImage) : '',
  });
  const [publishedAt, setPublishedAt] = useState(initial?.publishedAt ? initial.publishedAt.slice(0, 16) : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body = {
        title,
        slug,
        brand: Number(brand) || undefined,
        category: category ? Number(category) : null,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        condition,
        specs: {
          processor: specs.processor || null,
          ram: specs.ram ? Number(specs.ram) : null,
          storage: specs.storage || null,
          screenSize: specs.screenSize ? Number(specs.screenSize) : null,
          batteryHealth: specs.batteryHealth ? Number(specs.batteryHealth) : null,
          os: specs.os || null,
        },
        gallery: gallery.filter(Boolean).map((id) => ({ image: Number(id) })),
        description,
        warrantyDays: Number(warrantyDays),
        stock: Number(stock),
        status,
        seo: {
          metaTitle: seo.metaTitle || null,
          metaDescription: seo.metaDescription || null,
          ogImage: seo.ogImage ? Number(seo.ogImage) : null,
        },
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
      };

      const url = isNew ? '/api/laptops' : `/api/laptops/${initial.id}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push('/admin-v2/laptops');
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.message ?? 'Save failed. Check the form for errors.');
      }
    } catch {
      setError('Network error. Could not reach the API.');
    } finally {
      setSaving(false);
    }
  }

  function setGalleryItem(index: number, value: string) {
    setGallery((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>{error}</Paper>
      )}
      <Grid container spacing={3}>
        <Grid xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Details
            </Typography>
            <Stack spacing={2}>
              <TextField label="Title *" value={title} onChange={(e) => { setTitle(e.target.value); if (isNew) setSlug(slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')); }} required fullWidth />
              <TextField label="Slug (auto from title)" value={slug} onChange={(e) => setSlug(e.target.value)} fullWidth />
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Brand *</InputLabel>
                    <Select label="Brand *" value={brand} onChange={(e) => setBrand(String(e.target.value))}>
                      {brands.map((b) => <MenuItem key={b.id} value={String(b.id)}>{b.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select label="Category" value={category} onChange={(e) => setCategory(String(e.target.value))}>
                      <MenuItem value="">None</MenuItem>
                      {categories.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <TextField label="Price (kobo) *" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required fullWidth />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField label="Compare-at price (kobo)" type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} fullWidth />
                </Grid>
              </Grid>
              <FormControl fullWidth>
                <InputLabel>Condition *</InputLabel>
                <Select label="Condition *" value={condition} onChange={(e) => setCondition(e.target.value as typeof condition)}>
                  <MenuItem value="grade-a">Grade A (like new)</MenuItem>
                  <MenuItem value="grade-b">Grade B (light wear)</MenuItem>
                  <MenuItem value="grade-c">Grade C (visible wear)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Description"
                multiline
                minRows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
              />
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Specs
            </Typography>
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}><TextField label="Processor" value={specs.processor} onChange={(e) => setSpecs({ ...specs, processor: e.target.value })} fullWidth /></Grid>
              <Grid xs={12} sm={6}><TextField label="RAM (GB)" type="number" value={specs.ram} onChange={(e) => setSpecs({ ...specs, ram: e.target.value })} fullWidth /></Grid>
              <Grid xs={12} sm={6}><TextField label="Storage" value={specs.storage} onChange={(e) => setSpecs({ ...specs, storage: e.target.value })} fullWidth /></Grid>
              <Grid xs={12} sm={6}><TextField label="Screen size (inches)" type="number" value={specs.screenSize} onChange={(e) => setSpecs({ ...specs, screenSize: e.target.value })} fullWidth /></Grid>
              <Grid xs={12} sm={6}><TextField label="Battery health (%)" type="number" value={specs.batteryHealth} onChange={(e) => setSpecs({ ...specs, batteryHealth: e.target.value })} fullWidth /></Grid>
              <Grid xs={12} sm={6}><TextField label="Operating system" value={specs.os} onChange={(e) => setSpecs({ ...specs, os: e.target.value })} fullWidth /></Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Gallery
            </Typography>
            <Stack spacing={1.5}>
              {gallery.map((mediaId, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl fullWidth>
                    <InputLabel>Photo {index + 1}</InputLabel>
                    <Select
                      label={`Photo ${index + 1}`}
                      value={mediaId}
                      onChange={(e) => setGalleryItem(index, String(e.target.value))}
                    >
                      <MenuItem value="">None</MenuItem>
                      {media.map((m) => <MenuItem key={m.id} value={String(m.id)}>{m.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  {mediaId && (
                    <Box component="img" src={media.find((m) => String(m.id) === mediaId)?.thumbnailURL ?? ''} alt="" width={48} height={36} style={{ objectFit: 'cover', borderRadius: 4 }} />
                  )}
                  <IconButton aria-label="Remove photo" onClick={() => setGallery(gallery.filter((_, i) => i !== index))} disabled={gallery.length === 1}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Box>
              ))}
              <Button startIcon={<AddCircleOutlineIcon />} onClick={() => setGallery([...gallery, ''])}>
                Add photo
              </Button>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              SEO
            </Typography>
            <Stack spacing={2}>
              <TextField label="Meta title" value={seo.metaTitle} onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })} fullWidth />
              <TextField label="Meta description" multiline minRows={2} value={seo.metaDescription} onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })} fullWidth />
              <FormControl fullWidth>
                <InputLabel>OG image</InputLabel>
                <Select label="OG image" value={seo.ogImage} onChange={(e) => setSeo({ ...seo, ogImage: String(e.target.value) })}>
                  <MenuItem value="">None</MenuItem>
                  {media.map((m) => <MenuItem key={m.id} value={String(m.id)}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          </Paper>
        </Grid>

        <Grid xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Status & inventory
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Status *</InputLabel>
                <Select label="Status *" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid xs={6}><TextField label="Stock *" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required fullWidth /></Grid>
                <Grid xs={6}><TextField label="Warranty (days) *" type="number" value={warrantyDays} onChange={(e) => setWarrantyDays(e.target.value)} required fullWidth /></Grid>
              </Grid>
              <TextField label="Published at (auto on first publish)" type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
              <Button type="submit" variant="contained" size="large" disabled={saving}>
                {saving ? 'Saving…' : isNew ? 'Create laptop' : 'Save changes'}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}