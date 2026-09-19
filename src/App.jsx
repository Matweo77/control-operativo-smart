import { Button } from "@/components/ui/button"

export default function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 text-white">
      <h1 className="text-3xl font-bold">¡Control Operativo Smart Listo! 🚀</h1>
      <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
        Botón de Shadcn
      </Button>
    </div>
  )
}