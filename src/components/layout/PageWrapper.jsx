import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function PageWrapper({ children }) {
  return (
    <div className="gradient-bg flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-auto">
        <TopBar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
