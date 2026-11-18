import { motion } from 'framer-motion'
import type { SceneContent } from '../data/content'

interface Props {
  content: SceneContent
  /** 0 = hidden, 1 = fully visible. */
  visibility: number
  /** 0..1 progress through this scene's film window. */
  localProgress: number
}

const LETTER_VARIANTS = {
  // No blur here: animating filter: blur() on text is the single most
  // expensive thing on a phone — it made the whole site stutter while
  // scrolling (fixed 18 Nov). Opacity + rise is just as elegant.
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.55, ease: 'easeOut' },
  }),
}

function Heading({ text, active }: { text: string; active: boolean }) {
  // Letters animate one by one, but words must never split across lines:
  // each word is a nowrap wrapper, so a heading can only break between words.
  let letterIndex = 0
  return (
    <h2 className="scene-heading" aria-label={text}>
      {text.split(' ').map((word, wi) => (
        <span key={wi} className="scene-word" aria-hidden>
          {word.split('').map((ch) => {
            const i = letterIndex++
            return (
              <motion.span
                key={i}
                className="scene-letter"
                custom={i}
                variants={LETTER_VARIANTS}
                initial="hidden"
                animate={active ? 'visible' : 'hidden'}
                aria-hidden
              >
                {ch}
              </motion.span>
            )
          })}
        </span>
      ))}
    </h2>
  )
}

export default function SceneText({ content, visibility, localProgress }: Props) {
  const active = visibility > 0.45
  const body = content.body ?? []
  return (
    <motion.div
      className={`scene scene--${content.placement}${content.stays ? ' scene--finale' : ''}`}
      data-testid={`scene-${content.id}`}
      data-visible={active ? 'true' : 'false'}
      animate={{
        opacity: visibility,
        // No filter: blur() here — animating a blur on this whole layer
        // while scrolling stutters badly on phones (fixed 18 Nov).
        // Opacity + rise + scale are compositor-only and stay smooth.
        y: (1 - visibility) * 28,
        scale: 0.97 + 0.03 * visibility,
      }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ pointerEvents: 'none' }}
    >
      <div className="scene-pool">
        {content.label && <p className="scene-label">{content.label}</p>}
        {content.heading && <Heading text={content.heading} active={active} />}
        {body.map((line, i) => {
          // Lines arrive one beat after another through the scene window,
          // all of them in by the middle of the window.
          const threshold = body.length === 1 ? 0.12 : 0.08 + i * (0.5 / body.length)
          const lineVisible = localProgress >= threshold
          return (
            <motion.p
              key={i}
              className="scene-body"
              animate={{ opacity: lineVisible ? 1 : 0, y: lineVisible ? 0 : 10 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {line}
            </motion.p>
          )
        })}
      </div>
    </motion.div>
  )
}
