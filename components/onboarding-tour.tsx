"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

const steps = [
  {
    selector: "#dashboard-cards",
    text: "Aqui você acompanha seu saldo e estatísticas gerais.",
  },
  {
    selector: "#nav-transactions",
    text: "Acesse todas as suas transações por aqui.",
  },
  {
    selector: "#nav-budgets",
    text: "Gerencie seus orçamentos nesta seção.",
  },
  {
    selector: "#nav-reports",
    text: "Veja relatórios e gráficos financeiros.",
  },
  {
    selector: "#nav-new-transaction",
    text: "Registre rapidamente uma nova transação.",
  },
]

export default function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const done = localStorage.getItem("onboardingComplete")
    if (!done) {
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const current = steps[step]
    if (!current) return
    const el = document.querySelector(current.selector) as HTMLElement | null
    if (el) {
      el.classList.add("onboarding-highlight")
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    return () => {
      if (el) el.classList.remove("onboarding-highlight")
    }
  }, [step, open])

  function next() {
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
    } else {
      if (typeof window !== "undefined") {
        localStorage.setItem("onboardingComplete", "true")
      }
      setOpen(false)
    }
  }

  if (!open) return null

  const current = steps[step]

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-lg max-w-sm mx-2">
        <p className="mb-4">{current.text}</p>
        <div className="text-right">
          <Button onClick={next} size="sm">
            {step < steps.length - 1 ? "Próximo" : "Finalizar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
