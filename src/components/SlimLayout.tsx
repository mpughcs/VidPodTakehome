import Image from "next/image"

const backgroundImage = "/images/koroush.JPG"

type PressQuote = {
  meta?: string
  title?: string
  quote: string
  source?: string
}

const pressPositions = [
  "left-8 top-12 rotate-[-2deg]",
  "right-10 top-1/3 rotate-[2deg]",
  "left-10 bottom-14 rotate-[-1deg]",
] as const

export function SlimLayout({
  children,
  press,
}: {
  children: React.ReactNode
  press?: PressQuote[]
}) {
  return (
    <>
      <div className="relative flex min-h-full shrink-0 justify-center md:px-12 lg:px-0">
        <div className="relative z-10 flex flex-1 flex-col bg-surface px-4 py-10 shadow-2xl sm:justify-center md:flex-none md:px-28">
          <main className="mx-auto w-full max-w-md sm:px-4 md:w-96 md:max-w-sm md:px-0">
            {children}
          </main>
        </div>
        <div className="hidden sm:contents lg:relative lg:block lg:flex-1">
          <Image
            className="absolute inset-0 h-full w-full object-cover"
            src={backgroundImage}
            alt=""
            width={1600}
            height={900}
            unoptimized
          />
          <div
            className="absolute inset-0 bg-linear-to-t from-black/55 via-black/20 to-black/10"
            aria-hidden="true"
          />
          {press?.length ? (
            <div className={`hidden lg:contents lg:absolute lg:inset-0`} aria-hidden="true">
              {press.slice(0, pressPositions.length).map((item, idx) => (
                <figure
                  key={`${idx}-${item.source ?? "press"}`}
                  className={[
                    "absolute",
                    pressPositions[idx] ?? pressPositions[0],
                    // Printed-media aesthetic: paper + ink (no blur / glass).
                    "max-w-[18rem] rounded-md bg-stone-100/90 px-4 py-3 text-stone-900",
                    "ring-1 ring-black/20 shadow-[0_12px_28px_-14px_rgba(0,0,0,0.8)]",
                  ].join(" ")}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    
                    {item.meta ? (
                      <div className="text-[10px] font-medium tracking-wide text-stone-600">
                        {item.meta}
                      </div>
                    ) : null}
                  </div>
                  {item.title ? (
                    <div className="mt-1 text-xs font-semibold leading-snug text-stone-800">
                      {item.title}
                    </div>
                  ) : null}
                  <blockquote className="mt-1 text-pretty font-serif text-sm font-semibold leading-snug text-stone-900/95 [text-shadow:0_0_0.5px_rgba(0,0,0,0.5)]">
                    “{item.quote}”
                  </blockquote>
                  {item.source ? (
                    <figcaption className="mt-2 text-xs font-semibold tracking-wide text-stone-700">
                      — {item.source}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

