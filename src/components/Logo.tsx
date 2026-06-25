import { IoPrismOutline } from "react-icons/io5";

export function Logo(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <div className="flex items-center gap-2">
      <IoPrismOutline className="text-2xl" />
      <h1 className="text-2xl font-roboto-mono font-medium">Vidpod</h1>
    </div>
  )
}

