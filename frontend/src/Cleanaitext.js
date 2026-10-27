// Removes markdown / LaTeX symbols from AI-generated text (one line at a time).
// Handles: leading bullets, ###, **bold**, *italic*, `code`, $math$, ^2
export default function cleanAiText(input = '') {
  return String(input)
    .replace(/^\s*[-•*]\s+/, '')
    .replace(/^#{1,6}\s*/, '')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\approx/g, '≈')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/R\^2/g, 'R²')
    .replace(/\^2/g, '²')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}