// import { ReactNode } from "react" // Không dùng, xoá

export type QuickCreateType = "invoice" | "tenant" | "expenses"
export type QuickCreateField = {
  label: string
  name: string
  value: string | boolean
  type?: string
  autoComplete?: string
  required?: boolean
  options?: Array<{ value: string | number; label: string }>
}

export type QuickCreateSheetState = {
  open: boolean
  type?: QuickCreateType
  title?: string
  description?: string
  fields?: QuickCreateField[]
  loading?: boolean
  saveLabel?: string
  closeLabel?: string
  onSave?: (values: Record<string, string>) => Promise<void> | void
}

// Simple event emitter pattern for global state (no external lib)
type Listener = (state: QuickCreateSheetState) => void

class QuickCreateServiceClass {
  private state: QuickCreateSheetState = { open: false }
  private listeners: Listener[] = []

  subscribe(listener: Listener) {
    this.listeners.push(listener)
    // Immediately call with current state
    listener(this.state)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private setState(newState: Partial<QuickCreateSheetState>) {
    this.state = { ...this.state, ...newState }
    this.listeners.forEach(l => l(this.state))
  }

  open(type: QuickCreateType, config: Omit<QuickCreateSheetState, "open" | "type">) {
    this.setState({ open: true, type, ...config })
  }

  close() {
    this.setState({ open: false })
  }

  setLoading(loading: boolean) {
    this.setState({ loading })
  }
}

export const QuickCreateService = new QuickCreateServiceClass() 