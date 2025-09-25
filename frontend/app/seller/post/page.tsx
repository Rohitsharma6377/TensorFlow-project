"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  IconButton,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tabs,
  Tab,
} from "@mui/material"
import Grid from "@mui/material/Grid"
import {
  CloudUpload,
  Delete,
  Image as ImageIcon,
  Audiotrack,
  Movie,
  Inventory,
  Tag,
  Edit,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material"
import { useAppDispatch, useAppSelector } from "@/store"
import { fetchMyShop } from "@/store/slice/shopSlice"
import { ProductAPI, type ProductDTO } from "@/lib/api"
import { createPostMultipart, fetchPosts, deletePost, setPostStatus, updatePostMultipart, type PostItem } from "@/store/slice/postSlice"

export default function SellerPostsPage() {
  const dispatch = useAppDispatch()
  const shop = useAppSelector((s: any) => s.shop?.shop)
  const shopId = shop?._id || shop?.id || shop?.shop?._id || ""
  const posts = useAppSelector((s: any) => s.posts?.items || []) as PostItem[]

  const [caption, setCaption] = useState("")
  const [type, setType] = useState<"product" | "lifestyle">("product")
  const [productId, setProductId] = useState("")
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [hashtagsInput, setHashtagsInput] = useState("")
  const [hashtags, setHashtags] = useState<string[]>([])

  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioName, setAudioName] = useState<string>("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // UI state: modal and editing
  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all')
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('active')

  // Ensure we have current shop
  useEffect(() => {
    if (!shopId) dispatch(fetchMyShop())
  }, [shopId, dispatch])

  // Load posts for this shop
  useEffect(() => {
    if (!shopId) return
    dispatch(fetchPosts({ shop: shopId, status: statusFilter === 'all' ? undefined as any : statusFilter }))
  }, [shopId, statusFilter, dispatch])

  // Load products for selection
  useEffect(() => {
    if (!shopId) return
    ;(async () => {
      try {
        const res = await ProductAPI.list({ shopId, limit: 50 })
        setProducts(res.products || [])
      } catch (e) {
        console.warn("Failed to load products for post", e)
      }
    })()
  }, [shopId])

  // Media previews
  useEffect(() => {
    const urls = mediaFiles.map((f) => URL.createObjectURL(f))
    setMediaPreviews(urls)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [mediaFiles])

  const addHashtag = () => {
    const tokens = hashtagsInput
      .split(/[\s,#]+/)
      .map((t) => t.trim())
      .filter(Boolean)
    if (!tokens.length) return
    const uniq = Array.from(new Set([...hashtags, ...tokens.map((t) => (t.startsWith("#") ? t : `#${t}`))]))
    setHashtags(uniq)
    setHashtagsInput("")
  }
  const removeHashtag = (tag: string) => setHashtags((h) => h.filter((x) => x !== tag))

  const canPost = useMemo(() => {
    return !!shopId && (mediaFiles.length > 0 || editingId !== null) && !loading
  }, [shopId, mediaFiles.length, loading, editingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canPost) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      let ok = false
      if (editingId) {
        const action = await dispatch(updatePostMultipart({ id: editingId, payload: {
          shop: shopId,
          product: productId || undefined as any,
          caption: caption || undefined,
          hashtags: hashtags.length ? hashtags : undefined,
          type,
          status,
          mediaFiles: mediaFiles.length ? mediaFiles : undefined,
          audioFile: audioFile || undefined as any,
        }}))
        ok = updatePostMultipart.fulfilled.match(action)
        if (ok) setSuccess("Post updated!")
      } else {
        const action = await dispatch(createPostMultipart({
          shop: shopId,
          product: productId || undefined,
          caption: caption || undefined,
          hashtags: hashtags.length ? hashtags : undefined,
          type,
          status,
          mediaFiles,
          audioFile,
        }))
        ok = createPostMultipart.fulfilled.match(action)
        if (ok) setSuccess("Post created!")
      }
      if (ok) {
        // refresh list with current filter
        dispatch(fetchPosts({ shop: shopId, status: statusFilter === 'all' ? undefined as any : statusFilter }))
        resetForm()
        setOpenModal(false)
      } else {
        setError("Failed to submit post.")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create post.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setCaption("")
    setType("product")
    setProductId("")
    setHashtags([])
    setMediaFiles([])
    setAudioFile(null)
    setAudioName("")
    setStatus('active')
  }

  const openCreate = () => { resetForm(); setOpenModal(true) }
  const openEdit = (p: PostItem) => {
    setEditingId(p._id || null)
    setCaption(p.caption || "")
    setType((p.type as any) || 'product')
    setProductId(p.product || "")
    setHashtags(p.hashtags || [])
    setMediaFiles([]) // we only add new files on edit
    setAudioFile(null)
    setAudioName("")
    setStatus((p.status as any) || 'active')
    setOpenModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return
    const action = await dispatch(deletePost(id))
    if (deletePost.fulfilled.match(action)) {
      dispatch(fetchPosts({ shop: shopId, status: statusFilter === 'all' ? undefined as any : statusFilter }))
    }
  }

  const handleToggleStatus = async (p: PostItem) => {
    const next = p.status === 'active' ? 'archived' : 'active'
    const action = await dispatch(setPostStatus({ id: String(p._id), status: next as any }))
    if (!setPostStatus.fulfilled.match(action)) {
      alert('Failed to update status')
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa", py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" fontWeight="bold">Posts</Typography>
            <Button variant="contained" onClick={openCreate}>Create Post</Button>
          </Box>

          <Tabs value={statusFilter} onChange={(_, v) => setStatusFilter(v)} sx={{ mb: 2 }}>
            <Tab label="All" value="all" />
            <Tab label="Active" value="active" />
            <Tab label="Draft" value="draft" />
            <Tab label="Archived" value="archived" />
          </Tabs>

          <Divider sx={{ mb: 2 }} />

          {(() => {
            const filtered = statusFilter === 'all' ? posts : posts.filter(p => (p.status || 'active') === statusFilter)
            return filtered.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>No posts found.</Box>
            ) : (
              <Grid container spacing={2}>
                {filtered.map((p) => (
                  <Grid item xs={12} md={6} key={String(p._id)}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" gap={2}>
                          <Box sx={{ width: 120, height: 120, borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover', flexShrink: 0 }}>
                            {p.media && p.media[0] ? (
                              <video src={p.media[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => {
                                const v = e.currentTarget as HTMLVideoElement
                                v.style.display = 'none'
                                const img = document.createElement('img')
                                img.src = p.media?.[0] || ''
                                img.style.width = '100%'
                                img.style.height = '100%'
                                img.style.objectFit = 'cover'
                                v.parentElement?.appendChild(img)
                              }} controls muted />
                            ) : (
                              <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'text.disabled' }}>
                                <ImageIcon />
                              </Box>
                            )}
                          </Box>
                          <Box flex={1} minWidth={0}>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              <Chip size="small" label={p.type?.toUpperCase() || 'POST'} />
                              <Chip size="small" label={p.status || 'active'} color={p.status === 'archived' ? 'default' : (p.status === 'draft' ? 'warning' : 'success')} />
                            </Box>
                            <Typography variant="subtitle1" sx={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.caption || 'No caption'}</Typography>
                            {!!(p.hashtags?.length) && (
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                {p.hashtags!.slice(0, 4).map(h => <Chip key={h} label={h} size="small" />)}
                              </Box>
                            )}
                            <Box mt={1} display="flex" gap={1}>
                              <Button size="small" variant="outlined" startIcon={<Edit />} onClick={() => openEdit(p)}>Edit</Button>
                              <Button size="small" color="error" variant="outlined" startIcon={<Delete />} onClick={() => handleDelete(String(p._id))}>Delete</Button>
                              <Button size="small" variant="outlined" startIcon={p.status === 'active' ? <VisibilityOff /> : <Visibility />} onClick={() => handleToggleStatus(p)}>
                                {p.status === 'active' ? 'Deactivate' : 'Activate'}
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )
          })()}
        </Paper>

        {/* Create/Edit Modal */}
        <Dialog open={openModal} onClose={() => { setOpenModal(false); }} maxWidth="md" fullWidth>
          <DialogTitle>{editingId ? 'Edit Post' : 'Create Post'}</DialogTitle>
          <DialogContent dividers>
            {error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}
            {success && (<Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>)}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                  <Stack spacing={3}>
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ImageIcon color="primary" /> Media
                        </Typography>
                        <Stack spacing={2}>
                          <Button component="label" variant="outlined" startIcon={<CloudUpload />}>Upload Images/Videos
                            <input hidden type="file" accept="image/*,video/*" multiple onChange={(e) => setMediaFiles(e.target.files ? Array.from(e.target.files) : [])} />
                          </Button>
                          {mediaPreviews.length > 0 && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                              {mediaPreviews.map((src, i) => (
                                <video key={`mv-${i}`} src={src} controls style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 8 }} onError={(e) => {
                                  // fallback render as image if not a video
                                  const el = e.currentTarget as HTMLVideoElement
                                  el.style.display = 'none'
                                  const img = document.createElement('img')
                                  img.src = src
                                  img.style.width = '140px'
                                  img.style.height = '140px'
                                  img.style.objectFit = 'cover'
                                  img.style.borderRadius = '8px'
                                  el.parentElement?.appendChild(img)
                                }} />
                              ))}
                            </Box>
                          )}
                          <Button component="label" variant="outlined" startIcon={<Audiotrack />}>Upload Audio (optional)
                            <input hidden type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0] || null; setAudioFile(f); setAudioName(f ? f.name : "") }} />
                          </Button>
                          {audioName && <Chip label={audioName} onDelete={() => { setAudioFile(null); setAudioName("") }} />}
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Tag color="primary" /> Caption & Hashtags
                        </Typography>
                        <Stack spacing={2}>
                          <TextField label="Caption" fullWidth multiline minRows={3} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write something..." />
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TextField label="Add hashtags" placeholder="#sale #new" value={hashtagsInput} onChange={(e) => setHashtagsInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag() } }} fullWidth />
                              <Button variant="outlined" onClick={addHashtag}>Add</Button>
                            </Stack>
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {hashtags.map((tag) => (
                                <Chip key={tag} label={tag} onDelete={() => removeHashtag(tag)} />
                              ))}
                            </Box>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Stack spacing={3}>
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Inventory color="primary" /> Details
                        </Typography>
                        <Stack spacing={2}>
                          <FormControl fullWidth>
                            <InputLabel>Post Type</InputLabel>
                            <Select label="Post Type" value={type} onChange={(e) => setType(e.target.value as any)}>
                              <MenuItem value="product">Product</MenuItem>
                              <MenuItem value="lifestyle">Lifestyle</MenuItem>
                            </Select>
                          </FormControl>
                          <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                              <MenuItem value="active">Published</MenuItem>
                              <MenuItem value="draft">Draft</MenuItem>
                              <MenuItem value="archived">Archived</MenuItem>
                            </Select>
                          </FormControl>
                          <FormControl fullWidth disabled={!products.length}>
                            <InputLabel>Tag Product (optional)</InputLabel>
                            <Select label="Tag Product (optional)" value={productId} onChange={(e) => setProductId(e.target.value)}>
                              <MenuItem value="">None</MenuItem>
                              {products.map((p) => (
                                <MenuItem key={p._id as any} value={String(p._id)}>{p.title}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Preview</Typography>
                        <Stack spacing={1}>
                          <Typography variant="subtitle2" color="text.secondary">{type.toUpperCase()} POST</Typography>
                          {mediaPreviews[0] ? (
                            <video src={mediaPreviews[0]} controls style={{ width: '100%', maxHeight: 320, borderRadius: 8 }} onError={(e) => {
                              const v = e.currentTarget as HTMLVideoElement
                              v.style.display = 'none'
                              const img = document.createElement('img')
                              img.src = mediaPreviews[0]
                              img.style.width = '100%'
                              img.style.maxHeight = '320px'
                              img.style.borderRadius = '8px'
                              img.style.objectFit = 'cover'
                              v.parentElement?.appendChild(img)
                            }} />
                          ) : (
                            <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 4, textAlign: 'center', color: 'text.secondary' }}>
                              No media selected
                            </Box>
                          )}
                          {caption && <Typography>{caption}</Typography>}
                          {!!hashtags.length && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {hashtags.map((t) => (<Chip key={`pv-${t}`} label={t} size="small" />))}
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setOpenModal(false) }}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit as any} disabled={!canPost}>{loading ? (editingId ? 'Saving...' : 'Posting...') : (editingId ? 'Save Changes' : 'Post')}</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}

