import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { Camera, Shuffle } from 'lucide-react'
import {
  AVATAR_COLORS,
  DEFAULT_AVATARS,
  defaultAvatarUrl,
  generateInitialsAvatar,
  getInitials,
} from '../../lib/avatars'
import { Button } from './Button'
import styles from './AvatarStep.module.css'

/* ── Types ────────────────────────────────────────────────────────── */

export type AvatarResult =
  | { type: 'initials'; colorId: string }
  | { type: 'preset'; id: string }
  | { type: 'photo'; file: File }

interface Props {
  username: string
  onSubmit: (avatar: AvatarResult) => void
  onSkip: () => void
  loading: boolean
  error: string | null
}

/* ── Constants ────────────────────────────────────────────────────── */

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/* ── Helpers ──────────────────────────────────────────────────────── */

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Arrow-key navigation within a role="radiogroup" grid. */
function handleRadioKeyDown(
  e: KeyboardEvent<HTMLElement>,
  index: number,
  total: number,
  onSelect: (i: number) => void,
) {
  const columns = typeof window !== 'undefined' && window.innerWidth <= 460 ? 4 : 8
  let next = index
  switch (e.key) {
    case 'ArrowRight': next = (index + 1) % total; break
    case 'ArrowLeft':  next = (index - 1 + total) % total; break
    case 'ArrowDown':  next = Math.min(index + columns, total - 1); break
    case 'ArrowUp':    next = Math.max(index - columns, 0); break
    default: return
  }
  e.preventDefault()
  onSelect(next)
  // Focus the newly selected element
  const group = e.currentTarget.closest('[role="radiogroup"]')
  const target = group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]
  target?.focus()
}

/* ── Crop modal ───────────────────────────────────────────────────── */

function CropModal({
  imageUrl,
  onConfirm,
  onCancel,
}: {
  imageUrl: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const stateRef = useRef({ scale: 1, offsetX: 0, offsetY: 0, dragging: false, lastX: 0, lastY: 0 })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const s = stateRef.current
    const size = 240
    ctx.clearRect(0, 0, size, size)

    // Cover-fit the image then apply pan & zoom
    const imgAspect = img.naturalWidth / img.naturalHeight
    let drawW: number, drawH: number
    if (imgAspect > 1) {
      drawH = size * s.scale
      drawW = drawH * imgAspect
    } else {
      drawW = size * s.scale
      drawH = drawW / imgAspect
    }
    const x = (size - drawW) / 2 + s.offsetX
    const y = (size - drawH) / 2 + s.offsetY
    ctx.drawImage(img, x, y, drawW, drawH)
  }, [])

  useEffect(() => {
    const img = new Image()
    img.onload = () => { imgRef.current = img; draw() }
    img.src = imageUrl
  }, [imageUrl, draw])

  // Pointer drag
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    stateRef.current.dragging = true
    stateRef.current.lastX = e.clientX
    stateRef.current.lastY = e.clientY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current
    if (!s.dragging) return
    s.offsetX += e.clientX - s.lastX
    s.offsetY += e.clientY - s.lastY
    s.lastX = e.clientX
    s.lastY = e.clientY
    draw()
  }, [draw])

  const onPointerUp = useCallback(() => {
    stateRef.current.dragging = false
  }, [])

  // Scroll zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const s = stateRef.current
    s.scale = Math.max(1, Math.min(3, s.scale - e.deltaY * 0.002))
    draw()
  }, [draw])

  const handleConfirm = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Export circular crop via offscreen canvas
    const out = document.createElement('canvas')
    out.width = 240
    out.height = 240
    const ctx = out.getContext('2d')!
    ctx.beginPath()
    ctx.arc(120, 120, 120, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(canvas, 0, 0)
    out.toBlob((blob) => { if (blob) onConfirm(blob) }, 'image/jpeg', 0.9)
  }, [onConfirm])

  // Focus trap
  const overlayRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    const prev = document.activeElement as HTMLElement | null
    el.focus()
    return () => { prev?.focus() }
  }, [])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel()
  }, [onCancel])

  return (
    <div
      ref={overlayRef}
      className={styles.cropOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Crop photo"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className={styles.cropCard}>
        <h2 className={styles.cropTitle}>Crop photo</h2>
        <div
          className={styles.cropCanvasWrap}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
        >
          <canvas ref={canvasRef} className={styles.cropCanvas} width={240} height={240} />
        </div>
        <p className={styles.cropHint}>Drag to reposition · scroll to zoom</p>
        <div className={styles.cropActions}>
          <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="button" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────── */

export function AvatarStep({ username, onSubmit, onSkip, loading, error }: Props) {
  const [mode, setMode] = useState<'initials' | 'preset' | 'photo'>('initials')
  const [colorId, setColorId] = useState<string>(AVATAR_COLORS[0].id)
  const [presetId, setPresetId] = useState<string>(DEFAULT_AVATARS[0].id)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [fading, setFading] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLButtonElement>(null)

  const initials = useMemo(() => getInitials(username), [username])

  // Revoke object URLs on cleanup
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
      if (cropSrc) URL.revokeObjectURL(cropSrc)
    }
  }, [photoPreview, cropSrc])

  // ── Current preview src ────────────────────────────
  const previewSrc = useMemo(() => {
    if (mode === 'photo' && photoPreview) return photoPreview
    if (mode === 'preset') return defaultAvatarUrl(presetId)
    return generateInitialsAvatar(initials, colorId)
  }, [mode, photoPreview, presetId, initials, colorId])

  // Cross-fade on preview change
  const prevSrc = useRef(previewSrc)
  useEffect(() => {
    if (prevSrc.current !== previewSrc) {
      setFading(true)
      const t = setTimeout(() => setFading(false), 20)
      prevSrc.current = previewSrc
      return () => clearTimeout(t)
    }
  }, [previewSrc])

  // ── File validation ────────────────────────────────
  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid file format. Please upload a JPG, PNG, or WebP photo.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Photo is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image under 5MB or compress it before uploading.`
    }
    return null
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    setUploadError(null)
    const err = validateFile(file)
    if (err) { setUploadError(err); return }
    // Open crop
    setCropSrc(URL.createObjectURL(file))
  }, [validateFile])

  const handleCropConfirm = useCallback((blob: Blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    setPhotoFile(file)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(URL.createObjectURL(file))
    setMode('photo')
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }, [photoPreview, cropSrc])

  const handleCropCancel = useCallback(() => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }, [cropSrc])

  // ── Drag and drop ──────────────────────────────────
  const [dragActive, setDragActive] = useState(false)

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])
  const onDragLeave = useCallback(() => setDragActive(false), [])
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  // ── Shuffle ────────────────────────────────────────
  const handleShuffle = useCallback(() => {
    // Alternates between picking a preset icon avatar and an initials color
    // so every click noticeably changes style and color.
    const switchToPreset = mode === 'initials' ? Math.random() < 0.65 : Math.random() < 0.35
    if (switchToPreset) {
      const available = DEFAULT_AVATARS.filter((a) => a.id !== presetId)
      const nextPreset = randomItem(available)
      setPresetId(nextPreset.id)
      setMode('preset')
    } else {
      const available = AVATAR_COLORS.filter((c) => c.id !== colorId)
      const nextColor = randomItem(available)
      setColorId(nextColor.id)
      setMode('initials')
    }
  }, [mode, colorId, presetId])

  // ── Submit ─────────────────────────────────────────
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'photo' && photoFile) {
      onSubmit({ type: 'photo', file: photoFile })
    } else if (mode === 'preset') {
      onSubmit({ type: 'preset', id: presetId })
    } else {
      onSubmit({ type: 'initials', colorId })
    }
  }, [mode, photoFile, presetId, colorId, onSubmit])

  return (
    <div className={styles.wrap}>
      {/* Heading */}
      <div className={styles.heading}>
        <h2 className={styles.title}>Choose your look</h2>
        <p className={styles.subtitle}>This is how you'll appear in groups</p>
      </div>

      {/* Live preview */}
      <div className={styles.previewWrap}>
        <img
          src={previewSrc}
          alt={`Avatar preview for ${username || 'you'}`}
          className={`${styles.previewImg} ${fading ? styles.previewFading : ''}`}
        />
      </div>

      {/* Context mock */}
      <div className={styles.contextMock} aria-hidden="true">
        <img src={previewSrc} alt="" className={styles.contextAvatar} />
        <div className={styles.contextText}>
          <span className={styles.contextName}>{username || 'You'}</span>
          <span className={styles.contextBalance}>you owe Sam $12.50</span>
        </div>
      </div>

      {/* API / global error */}
      {error && <div className={styles.uploadError} role="alert">{error}</div>}

      {/* Color swatches */}
      <p className={styles.sectionLabel}>Colors</p>
      <ul className={styles.grid} role="radiogroup" aria-label="Initials avatar color options">
        {AVATAR_COLORS.map((color, i) => {
          const selected = mode === 'initials' && colorId === color.id
          return (
            <li key={color.id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${color.label} color`}
                tabIndex={selected || (i === 0 && mode !== 'initials') ? 0 : -1}
                className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                onClick={() => { setMode('initials'); setColorId(color.id) }}
                onKeyDown={(e) =>
                  handleRadioKeyDown(e, i, AVATAR_COLORS.length, (next) => {
                    setMode('initials')
                    setColorId(AVATAR_COLORS[next].id)
                  })
                }
              >
                <span className={styles.swatch} style={{ backgroundColor: color.bg }} />
              </button>
            </li>
          )
        })}
      </ul>

      {/* Preset avatars */}
      <p className={styles.sectionLabel}>Avatars</p>
      <ul className={styles.grid} role="radiogroup" aria-label="Preset avatar style options">
        {DEFAULT_AVATARS.map((avatar, i) => {
          const selected = mode === 'preset' && presetId === avatar.id
          return (
            <li key={avatar.id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${avatar.label} avatar`}
                tabIndex={selected || (i === 0 && mode !== 'preset') ? 0 : -1}
                className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                onClick={() => { setMode('preset'); setPresetId(avatar.id) }}
                onKeyDown={(e) =>
                  handleRadioKeyDown(e, i, DEFAULT_AVATARS.length, (next) => {
                    setMode('preset')
                    setPresetId(DEFAULT_AVATARS[next].id)
                  })
                }
              >
                <img src={defaultAvatarUrl(avatar.id)} alt="" className={styles.presetImg} loading="lazy" />
              </button>
            </li>
          )
        })}
      </ul>

      {/* Action companion row: Upload Photo + Shuffle */}
      <div className={styles.actionRow}>
        <div className={styles.uploadGroup}>
          <button
            ref={uploadRef}
            type="button"
            className={`${styles.uploadBtn} ${mode === 'photo' ? styles.uploadBtnSelected : ''} ${dragActive ? styles.uploadBtnActive : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            aria-label={mode === 'photo' && photoPreview ? 'Change uploaded photo' : 'Upload photo'}
          >
            <Camera size={16} aria-hidden />
            <span>{mode === 'photo' && photoPreview ? 'Change photo' : 'Upload photo'}</span>
          </button>
          {mode === 'photo' && (
            <button
              type="button"
              className={styles.removePhotoBtn}
              onClick={() => {
                setMode('initials')
                setPhotoFile(null)
                if (photoPreview) URL.revokeObjectURL(photoPreview)
                setPhotoPreview(null)
              }}
              title="Remove photo"
            >
              Remove
            </button>
          )}
        </div>

        <button
          type="button"
          className={styles.shuffleBtn}
          onClick={handleShuffle}
          aria-label="Shuffle avatar style"
        >
          <Shuffle size={14} aria-hidden />
          <span>Shuffle</span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="visually-hidden"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = ''
        }}
      />

      {/* Upload error */}
      {uploadError && <div className={styles.uploadError} role="alert">{uploadError}</div>}

      {/* Actions */}
      <form className={styles.actions} onSubmit={handleFormSubmit}>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          aria-busy={loading}
          style={{ width: '100%', height: 44, borderRadius: 'var(--radius-sm)', fontSize: 14 }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
        <button
          type="button"
          className={styles.skipLink}
          onClick={onSkip}
          disabled={loading}
        >
          Skip for now
        </button>
      </form>

      {/* Crop modal */}
      {cropSrc && (
        <CropModal
          imageUrl={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}
