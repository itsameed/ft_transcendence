import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../components/layout/Sidebar'
import styles from './Legal.module.css'


export const LEGAL = {
  contactEmail: 'splitifysupportteam@gmail.com',
  updated: 'November 21, 2026',
}

export interface LegalSection {
  id: string
  title: string
  content: ReactNode
}

interface Props {
  title: string
  intro: string
  summary?: string[]
  sections: LegalSection[]
  other: { to: string; label: string }
}

export function LegalLayout({ title, intro, summary, sections, other }: Props) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · Splitify`
    return () => {
      document.title = previous
    }
  }, [title])

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Link to="/" className={styles.brand} aria-label="Splitify home">
          <Logo />
        </Link>
        <Link to="/" className={styles.back}>
          <ArrowLeft size={16} aria-hidden /> Back to home
        </Link>
      </header>

      <main className={styles.layout}>
        <aside className={styles.toc} aria-label="On this page">
          <p className={styles.tocTitle}>On this page</p>
          <ol>
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>
                  <span>{i + 1}.</span> {s.title}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <article className={styles.article}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.updated}>Last updated {LEGAL.updated}</p>
          <p className={styles.intro}>{intro}</p>

          {summary && (
            <div className={styles.summary}>
              <p className={styles.summaryTitle}>The short version</p>
              <ul>
                {summary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className={styles.section} aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`}>
                <span>{i + 1}.</span> {s.title}
              </h2>
              {s.content}
            </section>
          ))}
        </article>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>© 2026 Splitify. Made for sharing.</p>
          <nav aria-label="Legal">
            <Link to={other.to}>{other.label}</Link>
            <a href={`mailto:${LEGAL.contactEmail}`}>Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
