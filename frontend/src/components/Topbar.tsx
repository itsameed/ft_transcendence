import { Icon } from './Icon'
import { greeting } from '../lib/format'
import { me } from '../data/mock'
import './Topbar.css'

export function Topbar() {
  const firstName = me.name.split(' ')[0]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <header className="topbar">
      <div>
        <p className="topbar__date">{today}</p>
        <h1 className="topbar__title">
          {greeting()}, {firstName}
        </h1>
      </div>

      <div className="topbar__actions">
        <label className="search glass">
          <Icon name="search" size={17} />
          <input type="search" placeholder="Search groups, friends…" />
        </label>
        <button type="button" className="icon-btn glass pressable" aria-label="Notifications, 2 unread">
          <Icon name="bell" />
          <span className="icon-btn__dot" />
        </button>
        <button type="button" className="btn btn--primary pressable">
          <Icon name="plus" size={18} />
          <span>Add expense</span>
        </button>
      </div>
    </header>
  )
}
