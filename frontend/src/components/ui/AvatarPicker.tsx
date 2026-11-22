import { useRef, useState, type DragEvent } from 'react'
import { Check, Upload } from 'lucide-react'
import { DEFAULT_AVATARS, defaultAvatarUrl } from '../../lib/avatars'
import { formatBytes, type UploadProgress } from '../../lib/upload'
import { UploadProgressBar } from './UploadProgressBar'
import styles from './AvatarPicker.module.css'

interface Props {
  /** Currently selected default id, or null when a photo is in use. */
  value: string | null
  onChange: (id: string) => void
  /** Local object URL of a photo the user just picked, if any. */
  preview?: string | null
  onFile: (file: File) => void
  onClearPhoto?: () => void
  /** Name and size of the picked photo, shown next to the preview. */
  fileInfo?: { name: string; size: number } | null
  /** Set while the photo is uploading. */
  progress?: UploadProgress | null
  onCancelUpload?: () => void
  disabled?: boolean
  label?: string
}

export function AvatarPicker({
  value,
  onChange,
  preview,
  onFile,
  onClearPhoto,
  fileInfo,
  progress,
  onCancelUpload,
  disabled,
  label = 'Avatar',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const onDragOver = (event: DragEvent) => {
    if (disabled || !event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    setDragging(true)
  }
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file && !disabled) onFile(file)
  }

  return (
    <div
      className={`${styles.wrap} ${dragging ? styles.dragging : ''}`}
      onDragOver={onDragOver}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
      }}
      onDrop={onDrop}
    >
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <button
          type="button"
          className={styles.upload}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Upload size={14} aria-hidden />
          {preview ? 'Choose another photo' : 'Upload a photo'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="visually-hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onFile(file)
            event.target.value = ''
          }}
          disabled={disabled}
          tabIndex={-1}
        />
      </div>

      {dragging && <p className={styles.dropHint} aria-hidden>Drop your photo to preview it</p>}

      {preview && (
        <div className={styles.previewRow} data-uploading={progress ? true : undefined}>
          <img src={preview} alt="Preview of your new photo" className={styles.preview} />
          <div className={styles.previewText}>
            {progress ? (
              <UploadProgressBar progress={progress} onCancel={onCancelUpload} />
            ) : (
              <>
                <strong title={fileInfo?.name}>{fileInfo?.name ?? 'Your photo'}</strong>
                <span>
                  {fileInfo ? `${formatBytes(fileInfo.size)} · ` : ''}Not saved yet. It will replace your current avatar.
                </span>
              </>
            )}
          </div>
          {onClearPhoto && !progress && (
            <button type="button" className={styles.clear} onClick={onClearPhoto} disabled={disabled}>
              Remove
            </button>
          )}
        </div>
      )}

      <ul className={styles.grid} role="radiogroup" aria-label="Default avatars">
        {DEFAULT_AVATARS.map((avatar) => {
          const selected = !preview && value === avatar.id
          return (
            <li key={avatar.id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={avatar.label}
                title={avatar.label}
                className={`${styles.option} ${selected ? styles.selected : ''}`}
                onClick={() => onChange(avatar.id)}
                disabled={disabled}
              >
                <img src={defaultAvatarUrl(avatar.id)} alt="" loading="lazy" />
                {selected && <span className={styles.check}><Check size={12} strokeWidth={3} aria-hidden /></span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
