/**
 * All on-screen copy, copied exactly from PRINCESS-DAY-PLAN.md Stage 2.
 * Do not rewrite it — the wording is the gift.
 */

import type { Placement } from './film'

export interface SceneContent {
  id: string
  label?: string
  heading?: string
  /** Body lines, shown one beat after another. */
  body?: string[]
  placement: Placement
  /** Stays on screen once shown (the finale). */
  stays?: boolean
}

export const SCENE_CONTENT: SceneContent[] = [
  {
    id: 'ch1-heading',
    label: 'Chapter I · Dawn',
    heading: 'Good morning, Sachi.',
    placement: 'center',
  },
  {
    id: 'ch1-body',
    body: ['Today is Princess Day, and this whole film was made for you.'],
    placement: 'center',
  },
  {
    id: 'ch2-heading',
    label: 'Chapter II · The Enchanted Wood',
    heading: 'Walk slowly.',
    placement: 'lower-centre',
  },
  {
    id: 'ch2-body',
    body: ['Most days are just days. This one has a whole forest of tulips along its path.'],
    placement: 'lower-centre',
  },
  {
    id: 'ch3-heading',
    label: 'Chapter III · The Lantern Lake',
    heading: 'Your best moments.',
    placement: 'top-left',
  },
  {
    id: 'ch3-body',
    body: [
      'Every lantern on the water holds one of your best moments.',
      '26 March 2025. The day we became a couple.',
      '9 February 2026. The day I first proposed.',
      'Every ordinary day in between.',
    ],
    placement: 'top-left',
  },
  {
    id: 'ch4-heading',
    label: 'Chapter IV · The Crown',
    heading: 'Made to fit you.',
    placement: 'right',
  },
  {
    id: 'ch4-body',
    body: ['A thank-you for being exactly you.'],
    placement: 'right',
  },
  {
    id: 'ch5-heading',
    label: 'Chapter V · The Night Sky',
    heading: 'Happy Princess Day, Sachi.',
    placement: 'center',
  },
  {
    id: 'finale',
    body: [
      "I'm better at building things than at speeches, so I built you a kingdom. It's been over 600 days and I'd choose you the same way I did on 26 March. Happy Princess Day, Sachi.",
    ],
    placement: 'center',
    stays: true,
  },
]

export const SCROLL_HINT = 'Scroll slowly'
