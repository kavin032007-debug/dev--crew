import SASidebar from './SASidebar'
import ResponsiveLayout from './ResponsiveLayout'

export default function SAPageWrapper({ children }) {
  return (
    <ResponsiveLayout sidebar={SASidebar}>
      {children}
    </ResponsiveLayout>
  )
}
