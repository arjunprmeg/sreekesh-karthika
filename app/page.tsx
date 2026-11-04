"use client"

import dynamic from "next/dynamic"

const Invitation = dynamic(() => import("../src/App"), { ssr: false })

export default function Page() {
  return <Invitation />
}
