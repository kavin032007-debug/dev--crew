import NotificationBell from '../notifications/NotificationBell'

export default function TopBar() {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-end border-b border-white/5 bg-[#0a0a0f]/80 px-8 py-4 backdrop-blur-xl">
      <NotificationBell />
    </div>
  )
}
