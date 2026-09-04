'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
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
import { MediaPickerField } from '@/components/admin/MediaPickerField';
import { CategoryPickerField } from '@/components/admin/CategoryPickerField';
import { generateSlug } from '@/lib/slug';
import { koboToNaira, nairaToKobo, formatNaira } from '@/lib/money';
import { formatApiError } from '@/lib/api-error';
import type { Laptop } from '@/payload-types';

export type LaptopFormOption = { id: number; name: string; thumbnailURL?: string | null };

type Props = {
  initial: Laptop | null;
  brands: LaptopFormOption[];
  categories: LaptopFormOption[];
  media: LaptopFormOption[];
};

export function LaptopForm({
  initial,
  brands: initialBrands,
  categories: initialCategories,
  media: initialMedia,
}: Props) {
  const router = useRouter();
  const isNew = !initial;

  // Uploads made from inside this form are appended here so they show up in
  // every media dropdown immediately, without a round-trip to the server.
  const [media, setMedia] = useState<LaptopFormOption[]>(initialMedia);
  const addMedia = (option: LaptopFormOption) =>
    setMedia((prev) => (prev.some((m) => m.id === option.id) ? prev : [...prev, option]));

  // Same for brands and use-case categories created from the dialogs below.
  const [brands, setBrands] = useState<LaptopFormOption[]>(initialBrands);
  const addBrand = (option: LaptopFormOption) =>
    setBrands((prev) => (prev.some((b) => b.id === option.id) ? prev : [...prev, option]));
  const [categoryOptions, setCategoryOptions] = useState<LaptopFormOption[]>(initialCategories);
  const addCategory = (option: LaptopFormOption) =>
    setCategoryOptions((prev) => (prev.some((c) => c.id === option.id) ? prev : [...prev, option]));

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [brand, setBrand] = useState(String(initial?.brand && typeof initial.brand === 'object' ? initial.brand.id : initial?.brand ?? ''));
  const [category, setCategory] = useState(String(initial?.category && typeof initial.category === 'object' ? initial.category.id : initial?.category ?? ''));
  const [price, setPrice] = useState(initial ? String(koboToNaira(initial.price)) : '');
  const [compareAtPrice, setCompareAtPrice] = useState(
    initial?.compareAtPrice != null ? String(koboToNaira(initial.compareAtPrice)) : '',
  );
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
  const [warrantyDays, setWarrantyDays] = useState(initial?.warrantyDays != null ? String(initial.warrantyDays) : '30');
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
        price: nairaToKobo(Number(price)),
        compareAtPrice: compareAtPrice ? nairaToKobo(Number(compareAtPrice)) : null,
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
        router.push('/admin/laptops');
        router.refresh();
      } else {
        const json = await res.json().catch(() => null);
        setError(formatApiError(json, 'Save failed. Check the form for errors.'));
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
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Details
            </Typography>
            <Stack spacing={3}>
              <TextField
                label="Title *"
                value={title}
                onChange={(e) => {
                  const next = e.target.value;
                  setTitle(next);
                  // Mirror the title into the slug until the admin edits the
                  // slug by hand, matching the collection's beforeValidate hook.
                  if (isNew && !slugTouched) setSlug(generateSlug(next));
                }}
                required
                fullWidth
              />
              <TextField
                label="Slug (auto from title)"
                value={slug}
                onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
                fullWidth
              />
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CategoryPickerField
                    label="Brand *"
                    categoryType="brand"
                    value={brand}
                    options={brands}
                    required
                    onChange={setBrand}
                    onCreated={addBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CategoryPickerField
                    label="Category"
                    categoryType="useCase"
                    value={category}
                    options={categoryOptions}
                    emptyLabel="None"
                    onChange={setCategory}
                    onCreated={addCategory}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Price (₦) *"
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    helperText={price ? formatNaira(nairaToKobo(Number(price))) : 'Enter the price in Naira'}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Compare-at price (₦)"
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    helperText={compareAtPrice ? formatNaira(nairaToKobo(Number(compareAtPrice))) : 'Strike-through price, if any'}
                    fullWidth
                  />
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
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Processor" value={specs.processor} onChange={(e) => setSpecs({ ...specs, processor: e.target.value })} fullWidth /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="RAM (GB)" type="number" value={specs.ram} onChange={(e) => setSpecs({ ...specs, ram: e.target.value })} fullWidth /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Storage" value={specs.storage} onChange={(e) => setSpecs({ ...specs, storage: e.target.value })} fullWidth /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Screen size (inches)" type="number" value={specs.screenSize} onChange={(e) => setSpecs({ ...specs, screenSize: e.target.value })} fullWidth /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Battery health (%)" type="number" value={specs.batteryHealth} onChange={(e) => setSpecs({ ...specs, batteryHealth: e.target.value })} fullWidth /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Operating system" value={specs.os} onChange={(e) => setSpecs({ ...specs, os: e.target.value })} fullWidth /></Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Gallery
            </Typography>
            <Stack spacing={2}>
              {gallery.map((mediaId, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', width: '100%' }}>
                  <MediaPickerField
                    label={`Photo ${index + 1}`}
                    value={mediaId}
                    media={media}
                    onChange={(id) => setGalleryItem(index, id)}
                    onUploaded={addMedia}
                  />
                  <IconButton
                    aria-label="Remove photo"
                    onClick={() => setGallery(gallery.filter((_, i) => i !== index))}
                    disabled={gallery.length === 1}
                    sx={{ mt: 0.75 }}
                  >
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
            <Stack spacing={3}>
              <TextField label="Meta title" value={seo.metaTitle} onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })} fullWidth />
              <TextField label="Meta description" multiline minRows={2} value={seo.metaDescription} onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })} fullWidth />
              <MediaPickerField
                label="OG image"
                value={seo.ogImage}
                media={media}
                onChange={(id) => setSeo({ ...seo, ogImage: id })}
                onUploaded={addMedia}
              />
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Status & inventory
            </Typography>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Status *</InputLabel>
                <Select label="Status *" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                </Select>
              </FormControl>
              <Grid container spacing={3}>
                <Grid size={6}><TextField label="Stock *" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required fullWidth /></Grid>
                <Grid size={6}><TextField label="Warranty (days) *" type="number" value={warrantyDays} onChange={(e) => setWarrantyDays(e.target.value)} required fullWidth /></Grid>
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