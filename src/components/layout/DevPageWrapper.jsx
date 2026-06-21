import DevSidebar from './DevSidebar'
import ResponsiveLayout from './ResponsiveLayout'

export default function DevPageWrapper({ children }) {
  return (
    <ResponsiveLayout sidebar={DevSidebar}>
      {children}
    </ResponsiveLayout>
  )
}
