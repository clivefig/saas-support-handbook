import Shepherd from 'shepherd.js'

function baseTour() {
  return new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      classes: 'shepherd-theme-ssh',
      scrollTo: { behavior: 'smooth', block: 'center' }
    }
  })
}

export function startFirstRunTour() {
  const tour = baseTour()
  tour.addStep({
    id: 'welcome',
    title: 'Welcome to Handbook Admin',
    text: 'This free open-source admin lets you brand the handbook, edit articles, and change navigation. Tours use Shepherd.js (also free and open source).',
    buttons: [{ text: 'Next', action: tour.next }]
  })
  tour.addStep({
    id: 'articles',
    title: 'Articles',
    text: 'Browse every Markdown chapter and edit with EasyMDE.',
    attachTo: { element: '[data-tour="nav-articles"]', on: 'right' },
    buttons: [
      { text: 'Back', action: tour.back, secondary: true },
      { text: 'Next', action: tour.next }
    ]
  })
  tour.addStep({
    id: 'structure',
    title: 'Structure',
    text: 'Add header sections and sidebar groups while keeping the handbook structure.',
    attachTo: { element: '[data-tour="nav-structure"]', on: 'right' },
    buttons: [
      { text: 'Back', action: tour.back, secondary: true },
      { text: 'Next', action: tour.next }
    ]
  })
  tour.addStep({
    id: 'branding',
    title: 'Branding',
    text: 'Colors and logos are customized in code (docs/setup/BRANDING.md), not at runtime.',
    attachTo: { element: '[data-tour="nav-branding"]', on: 'right' },
    buttons: [
      { text: 'Back', action: tour.back, secondary: true },
      { text: 'Done', action: tour.complete }
    ]
  })
  tour.start()
}
