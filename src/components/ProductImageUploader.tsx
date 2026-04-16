import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, X, Plus, ImageIcon, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type GalleryImage = { url: string; alt: string };

interface Props {
  // Imagen principal
  mainUrl:    string;
  mainAlt:    string;
  onMainChange: (url: string, alt: string) => void;
  // Galería adicional
  gallery:    GalleryImage[];
  onGalleryChange: (gallery: GalleryImage[]) => void;
}

const MAX_GALLERY = 5;
const cardStyle   = { border: "0.5px solid rgba(255,255,255,0.08)" };

async function uploadToStorage(file: File): Promise<string> {
  const ext      = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from("products")
    .upload(fileName, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(`Storage: ${error.message}`);
  const { data: pub } = supabase.storage.from("products").getPublicUrl(data.path);
  return pub.publicUrl;
}

export default function ProductImageUploader({ mainUrl, mainAlt, onMainChange, gallery, onGalleryChange }: Props) {
  const { toast }                  = useToast();
  const mainInputRef               = useRef<HTMLInputElement>(null);
  const galleryInputRef            = useRef<HTMLInputElement>(null);
  const [uploadingMain,    setUploadingMain]    = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadError,      setUploadError]      = useState<string | null>(null);

  /* ─── Subir imagen principal ─────────────────────────────────── */
  const handleMainUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    setUploadError(null);
    try {
      const url = await uploadToStorage(file);
      onMainChange(url, mainAlt);
      toast({ title: "✓ Imagen subida" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setUploadError(msg);
      toast({ title: "Error al subir imagen", description: msg, variant: "destructive" });
    } finally {
      setUploadingMain(false);
      if (mainInputRef.current) mainInputRef.current.value = "";
    }
  };

  /* ─── Subir imagen a galería ─────────────────────────────────── */
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingGallery(true);
    setUploadError(null);
    try {
      const newItems: GalleryImage[] = [];
      for (const file of files.slice(0, MAX_GALLERY - gallery.length)) {
        const url = await uploadToStorage(file);
        newItems.push({ url, alt: "" });
      }
      onGalleryChange([...gallery, ...newItems]);
      toast({ title: `✓ ${newItems.length} imagen(es) agregada(s)` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setUploadError(msg);
      toast({ title: "Error al subir galería", description: msg, variant: "destructive" });
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  /* ─── Eliminar imagen de galería ─────────────────────────────── */
  const removeGallery = (idx: number) => {
    onGalleryChange(gallery.filter((_, i) => i !== idx));
  };

  /* ─── Actualizar alt de galería ──────────────────────────────── */
  const updateGalleryAlt = (idx: number, alt: string) => {
    onGalleryChange(gallery.map((g, i) => i === idx ? { ...g, alt } : g));
  };

  return (
    <div className="space-y-5">
      {uploadError && (
        <div className="flex items-start gap-2 p-3 rounded-xl text-[11px] font-jakarta text-destructive" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Error al subir imagen</p>
            <p className="opacity-80">{uploadError}</p>
            <p className="mt-1 opacity-60">Asegúrate de que el bucket <code className="bg-black/20 px-1 rounded">products</code> existe en Supabase Storage.</p>
          </div>
        </div>
      )}

      {/* ── Imagen principal ───────────────────────────────────── */}
      <div>
        <label className="font-jakarta text-xs text-wo-crema-muted uppercase font-bold tracking-wider block mb-2">
          Imagen principal
        </label>

        <div className="flex gap-3 items-start">
          {/* Preview */}
          <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-wo-carbon" style={cardStyle}>
            {mainUrl ? (
              <>
                <img src={mainUrl} alt={mainAlt} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onMainChange("", mainAlt)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-destructive/80 transition-colors"
                >
                  <X size={10} className="text-white" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-wo-crema/20">
                <ImageIcon size={20} />
                <span className="font-jakarta text-[9px]">Sin imagen</span>
              </div>
            )}
            {uploadingMain && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 size={18} className="text-primary animate-spin" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-1 space-y-2">
            {/* Upload button */}
            <button
              type="button"
              onClick={() => mainInputRef.current?.click()}
              disabled={uploadingMain}
              className="w-full flex items-center justify-center gap-2 font-jakarta text-xs font-bold py-2.5 rounded-xl transition-colors hover:bg-primary/20 disabled:opacity-50"
              style={{ background: "rgba(232,116,26,0.08)", color: "hsl(var(--wo-oro))", border: "0.5px solid rgba(232,116,26,0.3)" }}
            >
              {uploadingMain ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {uploadingMain ? "Subiendo..." : "Subir imagen"}
            </button>
            <input ref={mainInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleMainUpload} />

            {/* URL manual */}
            <input
              type="url"
              value={mainUrl}
              onChange={(e) => onMainChange(e.target.value, mainAlt)}
              placeholder="o pega una URL..."
              className="w-full bg-wo-carbon text-wo-crema font-jakarta text-xs px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-primary placeholder:text-wo-crema/25"
              style={cardStyle}
            />

            {/* Alt text SEO */}
            <input
              type="text"
              value={mainAlt}
              onChange={(e) => onMainChange(mainUrl, e.target.value)}
              placeholder="Alt text SEO (ej: Aceite de coco orgánico 500ml)"
              className="w-full bg-wo-carbon text-wo-crema font-jakarta text-xs px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-secondary placeholder:text-wo-crema/25"
              style={{ border: "0.5px solid rgba(30,192,213,0.2)" }}
            />
            <p className="font-jakarta text-[10px] text-wo-crema/30">
              💡 El alt text mejora el SEO y accesibilidad
            </p>
          </div>
        </div>
      </div>

      {/* ── Galería adicional ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-jakarta text-xs text-wo-crema-muted uppercase font-bold tracking-wider">
            Galería ({gallery.length}/{MAX_GALLERY})
          </label>
          {gallery.length < MAX_GALLERY && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploadingGallery}
              className="flex items-center gap-1 font-jakarta text-[10px] font-bold px-2.5 py-1 rounded-lg hover:bg-secondary/20 transition-colors disabled:opacity-50"
              style={{ color: "rgb(30,192,213)", border: "0.5px solid rgba(30,192,213,0.3)" }}
            >
              {uploadingGallery ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
              {uploadingGallery ? "Subiendo..." : "Agregar"}
            </button>
          )}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleGalleryUpload}
          />
        </div>

        {gallery.length === 0 ? (
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploadingGallery}
            className="w-full flex items-center justify-center gap-2 font-jakarta text-xs text-wo-crema/30 py-6 rounded-xl border-2 border-dashed border-wo-crema/10 hover:border-secondary/30 hover:text-wo-crema/50 transition-colors"
          >
            <Plus size={14} /> Agregar imágenes a la galería
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {gallery.map((img, idx) => (
              <div key={idx} className="space-y-1">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-wo-carbon" style={cardStyle}>
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGallery(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-destructive/80 transition-colors"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
                <input
                  type="text"
                  value={img.alt}
                  onChange={(e) => updateGalleryAlt(idx, e.target.value)}
                  placeholder="Alt SEO..."
                  className="w-full bg-wo-carbon text-wo-crema font-jakarta text-[10px] px-2 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-secondary placeholder:text-wo-crema/20"
                  style={{ border: "0.5px solid rgba(30,192,213,0.15)" }}
                />
              </div>
            ))}
            {gallery.length < MAX_GALLERY && (
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingGallery}
                className="aspect-square rounded-xl border-2 border-dashed border-wo-crema/10 hover:border-secondary/30 flex flex-col items-center justify-center gap-1 text-wo-crema/25 hover:text-wo-crema/50 transition-colors"
              >
                <Plus size={18} />
                <span className="font-jakarta text-[9px]">Agregar</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
