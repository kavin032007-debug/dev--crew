import SASidebar from './SASidebar'
import TopBar from './TopBar'

export default function SAPageWrapper({ children }) {
  return (
    <div className="gradient-bg flex min-h-screen">
      <SASidebar />
      <div className="flex flex-1 flex-col overflow-auto">
        <TopBar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
