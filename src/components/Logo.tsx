import { ImNewspaper } from "react-icons/im";

export function Logo(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <div className="flex items-center gap-2">
      <ImNewspaper className="text-2xl" />
      <h1 className="text-2xl font-yrsa ">Clippings</h1>
    </div>
  )
}

