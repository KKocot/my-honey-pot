import { Button } from '../ui'

export function TestButtons() {
  return (
    <div class="space-y-4">
      {/* Test 1: SolidJS Button with onClick handler */}
      <div class="bg-bg-card p-4 rounded-lg border border-border">
        <h2 class="text-lg font-semibold mb-2">Test 1: SolidJS Button z onClick</h2>
        <Button onClick={() => console.log('SolidJS button clicked!')}>
          Kliknij mnie (SolidJS)
        </Button>
      </div>

      {/* Test 2: SolidJS Button with alert */}
      <div class="bg-bg-card p-4 rounded-lg border border-border">
        <h2 class="text-lg font-semibold mb-2">Test 2: SolidJS Button z alertem</h2>
        <Button onClick={() => alert('SolidJS button works!')}>
          Kliknij mnie (alert)
        </Button>
      </div>

      {/* Test 3: Multiple buttons */}
      <div class="bg-bg-card p-4 rounded-lg border border-border">
        <h2 class="text-lg font-semibold mb-2">Test 3: Wiele przycisków</h2>
        <div class="flex gap-2">
          <Button variant="primary" onClick={() => console.log('Primary clicked')}>
            Primary
          </Button>
          <Button variant="secondary" onClick={() => console.log('Secondary clicked')}>
            Secondary
          </Button>
          <Button variant="accent" onClick={() => console.log('Accent clicked')}>
            Accent
          </Button>
          <Button variant="ghost" onClick={() => console.log('Ghost clicked')}>
            Ghost
          </Button>
        </div>
      </div>
    </div>
  )
}
