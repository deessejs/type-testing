import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Component as EtheralShadow } from "@/components/ui/etheral-shadow"
import { InstallBlock } from "@/components/install-block"

export default function Home() {
  return (
    <section>
      <div className="grid grid-cols-10 lg:grid-cols-2">
        {/* Left column - content */}
        <div className="col-span-9 flex h-screen flex-col justify-between p-6 lg:col-span-1">
          {/* Top section - logo and nav */}
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-pixel text-xl font-medium text-foreground">Type Testing</span>
            </Link>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="https://github.com/deessejs/type-testing">
                  GitHub
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild>
                <Link href="https://www.npmjs.com/package/@deessejs/type-testing">
                  npm
                </Link>
              </Button>
            </div>
          </div>

          {/* Middle section - hero */}
          <div className="flex flex-col gap-6 md:gap-8">
            <h3 className="font-pixel text-5xl font-medium leading-tighter md:max-w-lg md:text-6xl text-foreground">
              Type testing for TypeScript developers
            </h3>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button variant="outline" asChild className="h-10">
                <Link href="https://github.com/deessejs/type-testing">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <InstallBlock />
            </div>
          </div>

          {/* Bottom section - install and info */}
          <div className="flex flex-col gap-4">
            <div className="flex max-w-md flex-col gap-2 text-xs md:text-sm">
              <p className="text-muted-foreground">Install via npm</p>
              <p className="font-mono text-xs text-foreground">npm install @deessejs/type-testing</p>
            </div>

            <p className="max-w-md text-xs text-muted-foreground md:text-sm">
              A micro library for compile-time type testing in TypeScript. Test your types with confidence and precision.
            </p>
          </div>
        </div>

        {/* Right column - visual */}
        <div className="col-span-1 h-screen min-h-0 overflow-hidden lg:block hidden border-l border-border/25">
          <EtheralShadow
            color="rgba(128, 128, 128, 1)"
            animation={{ scale: 100, speed: 10 }}
            sizing="fill"
          />
        </div>
      </div>
    </section>
  )
}
