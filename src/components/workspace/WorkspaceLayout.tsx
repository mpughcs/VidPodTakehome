import type { ReactNode } from "react"

const DRAWER_ID = "workspace-drawer"

type WorkspaceLayoutProps = {
  sidebar: ReactNode
  children: ReactNode
}

export function WorkspaceLayout({ sidebar, children }: WorkspaceLayoutProps) {
  return (
    <div className="drawer lg:drawer-open">
      <input id={DRAWER_ID} type="checkbox" className="drawer-toggle" />

      <div className="drawer-content min-h-[calc(100vh-5rem)] w-full bg-slate-50">
        <label htmlFor={DRAWER_ID} className="btn drawer-button lg:hidden">
          Open sidebar
        </label>
        {children}
      </div>

      <div className="drawer-side">
        <label
          htmlFor={DRAWER_ID}
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        {sidebar}
      </div>
    </div>
  )
}
