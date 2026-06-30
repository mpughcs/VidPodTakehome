import type { ReactNode } from "react"
import { IoIosArrowForward } from "react-icons/io"

const DRAWER_ID = "workspace-drawer"

type WorkspaceLayoutProps = {
  sidebar: ReactNode
  children: ReactNode
}

export function WorkspaceLayout({ sidebar, children }: WorkspaceLayoutProps) {
  return (
    <div className="drawer min-h-[calc(100vh-5rem)] w-full lg:drawer-open">
      <input id={DRAWER_ID} type="checkbox" className="drawer-toggle lg:hidden" />

      <div className="drawer-content min-w-0 w-full bg-[#fafafa]">
        <label htmlFor={DRAWER_ID} className="btn drawer-button lg:hidden">
          <IoIosArrowForward className="text-2xl" />
        </label>
        {children}
      </div>

      <div className="drawer-side z-40">
        <label
          htmlFor={DRAWER_ID}
          aria-label="close sidebar"
          className="drawer-overlay lg:hidden"
        />
        {sidebar}
      </div>
    </div>
  )
}
