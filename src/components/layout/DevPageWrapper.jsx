import DevSidebar from './DevSidebar'
import TopBar from './TopBar'

export default function DevPageWrapper({ children }) {
  return (
    <div className="gradient-bg flex min-h-screen">
      <DevSidebar />
      <div className="flex flex-1 flex-col overflow-auto">
        <TopBar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
