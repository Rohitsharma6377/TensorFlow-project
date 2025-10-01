"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, AppBar, Toolbar, IconButton, Typography, Button, TextField } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { api } from "@/lib/api";

export default function BuilderCodeEditorPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const qs = useSearchParams();
  const router = useRouter();

  const template = qs?.get("template") || "home"; // home | products | product
  const blockId = qs?.get("block") || "";

  const [raw, setRaw] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [lastImageUrl, setLastImageUrl] = useState<string>("");

  useEffect(() => {
    try {
      const key = `builder:${id}`;
      const v = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      setRaw(v || "");
    } catch {
      setRaw("");
    }
  }, [id]);

  const parsed = useMemo(() => {
    try { return raw ? JSON.parse(raw) : { home: { blocks: [] } }; } catch { return { home: { blocks: [] } }; }
  }, [raw]);

  const targetBlock = useMemo(() => {
    const section = (parsed as any)[template] || { blocks: [] };
    return Array.isArray(section.blocks) ? section.blocks.find((b: any) => b.id === blockId) : undefined;
  }, [parsed, template, blockId]);

  useEffect(() => {
    if (!targetBlock) return;
    // Default to editing entire block JSON
    setCode(JSON.stringify(targetBlock, null, 2));
  }, [targetBlock]);

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;');

  const save = () => {
    try {
      let edited: any;
      try {
        edited = JSON.parse(code);
      } catch {
        // Fallback: treat as Liquid/HTML snippet -> wrap into RichText block
        const html = `<pre><code>${escapeHtml(code)}</code></pre>`;
        edited = { id: blockId, type: 'RichText', props: { html } };
      }
      const data = { ...parsed } as any;
      if (!data[template]) data[template] = { blocks: [] };
      const blocks = data[template].blocks as any[];
      const idx = blocks.findIndex((b: any) => b.id === blockId);
      if (idx >= 0) blocks[idx] = edited; else blocks.push(edited);
      localStorage.setItem(`builder:${id}`, JSON.stringify(data, null, 2));
      router.back();
    } catch (e) {
      alert("Could not save. Please try again.");
    }
  };

  const injectImageUrl = (url: string) => {
    try {
      const obj = JSON.parse(code || '{}');
      if (!obj.props) obj.props = {};
      // prefer props.image if present, otherwise logoUrl
      if (typeof obj.props.image !== 'undefined') {
        obj.props.image = url;
      } else if (typeof obj.props.logoUrl !== 'undefined') {
        obj.props.logoUrl = url;
      } else {
        obj.props.image = url;
      }
      setCode(JSON.stringify(obj, null, 2));
      setLastImageUrl(url);
    } catch {}
  };

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'builder');
      const res: any = await api('/api/v1/uploads', { method: 'POST', body: fd as any });
      const url = res?.url || res?.secure_url || res?.location || res?.path;
      if (url) injectImageUrl(url);
    } finally {
      setUploading(false);
    }
  }, [code]);

  const onUploadClick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'builder');
      const res: any = await api('/api/v1/uploads', { method: 'POST', body: fd as any });
      const url = res?.url || res?.secure_url || res?.location || res?.path;
      if (url) injectImageUrl(url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.back()} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>Edit code • {template} • {blockId}</Typography>
          <Button startIcon={<SaveIcon />} variant="contained" onClick={save}>Save</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Edit the block JSON. This mimics a Liquid/section file. Saving updates local preview data.
        </Typography>
        <Box
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          sx={{
            mb: 1,
            p: 2,
            border: '1px dashed #cbd5e1',
            borderRadius: 1,
            bgcolor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <div>
            <Typography variant="subtitle2">Drag & drop an image here to set props.image</Typography>
            {lastImageUrl && <Typography variant="caption" color="text.secondary">Last uploaded: {lastImageUrl}</Typography>}
          </div>
          <label>
            <input type="file" accept="image/*" hidden onChange={onUploadClick} />
            <Button variant="outlined" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload image'}</Button>
          </label>
        </Box>
        <TextField
          value={code}
          onChange={(e) => setCode(e.target.value)}
          multiline
          minRows={24}
          fullWidth
          placeholder='{"id":"hero-xyz","type":"Hero","props":{}}'
          sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
        />
      </Box>
    </Box>
  );
}
