import { NavLink, useNavigate } from 'react-router-dom'
import { FonciaLogo } from './FonciaLogo'
import { useAuth } from '../hooks/useAuth'

interface NavItem {
  to: string
  icon: string
  label: string
  badge?: number
}

interface SidebarProps {
  items: NavItem[]
  title?: string
}

export function Sidebar({ items, title }: SidebarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="hidden md:flex w-64 bg-foncia-navy min-h-screen flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <FonciaLogo size="sm" />
        {title && (
          <p className="text-white/60 text-xs mt-2 font-medium uppercase tracking-wider">
            {title}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.endsWith('dashboard') || item.to.endsWith('admin')}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 mx-2 rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-foncia-orange text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className="text-xl w-6 text-center">{item.icon}</span>
            <span className="text-sm font-medium flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="bg-foncia-orange text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center font-bold">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-foncia-blue flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-white/50 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-left text-white/60 hover:text-white text-xs flex items-center gap-2 py-1 transition-colors"
        >
          <span>🚪</span>
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  )
}
