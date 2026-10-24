import { useState } from 'react'
import { Icon, type IconName } from './Icon'
import { Avatar } from './Avatar'
import { me } from '../data/mock'
import './Sidebar.css'

const items: { label: string; icon: IconName; badge?: number }[] = [
  { label: 'Dashboard', icon: 'home' },
  { label: 'Groups', icon: 'groups' },
  { label: 'Friends', icon: 'friends' },
  { label: 'Messages', icon: 'chat', badge: 3 },
  { label: 'Activity', icon: 'receipt' },
]

export function Sidebar() {
  // Local state only for now; React Router will own this once we add more pages.
  const [active, setActive] = useState('Dashboard')

  return (
    <nav className="sidebar glass" aria-label="Main">
      <div className="sidebar__brand">
        <span className="sidebar__logo">
          <Icon name="wallet" size={18} />
        </span>
        <span className="sidebar__name">Splitly</span>
      </div>

      <ul className="sidebar__list">
        {items.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              className="sidebar__item pressable"
              aria-current={active === item.label ? 'page' : undefined}
              onClick={() => setActive(item.label)}
            >
              <Icon name={item.icon} />
              <span className="sidebar__label">{item.label}</span>
              {item.badge ? <span className="sidebar__badge">{item.badge}</span> : null}
            </button>
          </li>
        ))}
      </ul>

      <div className="sidebar__footer">
        <button type="button" className="sidebar__item pressable">
          <Icon name="settings" />
          <span className="sidebar__label">Settings</span>
        </button>
        <div className="sidebar__me">
          <Avatar user={me} size={32} />
          <div>
            <div className="sidebar__me-name">{me.name}</div>
            <div className="sidebar__me-sub">Personal</div>
          </div>
        </div>
      </div>
    </nav>
  )
}
