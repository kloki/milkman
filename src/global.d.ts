import type { MilkmanApi } from './shared/types'

declare global {
  interface Window {
    milkman: MilkmanApi
  }
}

export {}