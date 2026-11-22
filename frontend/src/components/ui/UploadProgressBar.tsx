import { formatBytes, type UploadProgress } from '../../lib/upload'
import styles from './UploadProgressBar.module.css'

interface Props {
  progress: UploadProgress
  /** What is being uploaded, used in the label. */
  label?: string
  onCancel?: () => void
}

/**
 * Determinate bar while bytes are going out, then an indeterminate sweep while
 * the server processes the image (sharp resize), so it never sits at 100%
 * looking stuck.
 */
export function UploadProgressBar({ progress, label = 'photo', onCancel }: Props) {
  const { loaded, total, percent, processing } = progress
  const determinate = !processing && percent !== null

  const text = processing
    ? `Processing ${label}…`
    : percent !== null
      ? `Uploading ${label}… ${percent}%`
      : `Uploading ${label}…`

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.text} aria-hidden>{text}</span>
        {!processing && total > 0 && (
          <span className={`${styles.bytes} tabular`} aria-hidden>
            {formatBytes(loaded)} / {formatBytes(total)}
          </span>
        )}
        {onCancel && !processing && (
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={`Uploading ${label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={determinate ? percent! : undefined}
        aria-valuetext={text}
        data-indeterminate={!determinate || undefined}
      >
        <span className={styles.fill} style={determinate ? { width: `${percent}%` } : undefined} />
      </div>
    </div>
  )
}
