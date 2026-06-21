import Sidebar from './Sidebar'
import ResponsiveLayout from './ResponsiveLayout'

export default function PageWrapper({ children }) {
  return (
    <ResponsiveLayout sidebar={Sidebar}>
      {children}
    </ResponsiveLayout>
  )
}
