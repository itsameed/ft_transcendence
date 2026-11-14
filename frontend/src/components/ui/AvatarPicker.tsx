import { useRef } from 'react'
import { Check, Upload } from 'lucide-react'
import { DEFAULT_AVATARS, defaultAvatarUrl } from '../../lib/avatars'
import styles from './AvatarPicker.module.css'

interface Props {
  /** Currently selected default id, or null when a photo is in use. */
  value: string | null
  onChange: (id: string) => void
  /** Local object URL of a photo the user just picked, if any. */
  preview?: string | null
  onFile: (file: File) => void
  onClearPhoto?: () => void
  disabled?: boolean
  label?: string
}

export function AvatarPicker({ value, onChange, preview, onFile, onClearPhoto, disabled, label = 'Avatar' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={styles.wrap}>
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

      {preview && (
        <div className={styles.previewRow}>
          <img src={preview} alt="Your uploaded photo" className={styles.preview} />
          <div className={styles.previewText}>
            <strong>Your photo</strong>
            <span>It will replace the avatar below.</span>
          </div>
          {onClearPhoto && (
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
