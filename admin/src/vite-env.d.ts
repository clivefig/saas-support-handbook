/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'easymde' {
  export default class EasyMDE {
    constructor(options?: Record<string, unknown>)
    value(): string
    value(val: string): void
    toTextArea(): void
  }
}

declare module 'shepherd.js' {
  export default class Shepherd {
    static Tour: new (options?: Record<string, unknown>) => {
      addStep: (step: Record<string, unknown>) => void
      start: () => void
      next: () => void
      back: () => void
      complete: () => void
    }
  }
  const ShepherdNS: {
    Tour: new (options?: Record<string, unknown>) => {
      addStep: (step: Record<string, unknown>) => void
      start: () => void
      next: () => void
      back: () => void
      complete: () => void
    }
  }
  export default ShepherdNS
}
