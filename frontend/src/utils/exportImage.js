import { toBlob } from 'html-to-image'

/**
 * Capture the standings social card DOM element and download as PNG.
 * @param {string} elementId  - DOM element ID to capture
 * @param {string} filename   - Output filename
 */
export async function exportStandingsImage(
  elementId = 'standings-social-card',
  filename = 'EHF_Standings.png'
) {
  const node = document.getElementById(elementId)
  if (!node) {
    console.error(`[EHF] Export element #${elementId} not found in DOM`)
    return
  }

  try {
    // 1. Pre-load all images to ensure they are ready for capture
    const images = Array.from(node.getElementsByTagName('img'))
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve()
      return new Promise(resolve => {
        img.onload = resolve
        img.onerror = resolve
      })
    }))

    // 2. Wait for a final paint cycle
    await new Promise(resolve => setTimeout(resolve, 250))

    // 3. Capture options
    const style = window.getComputedStyle(node)
    const bgColor = style.backgroundColor && style.backgroundColor !== 'transparent' && style.backgroundColor !== 'rgba(0, 0, 0, 0)'
      ? style.backgroundColor 
      : (document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff')

    const options = {
      backgroundColor: bgColor,
      pixelRatio: 2,
      cacheBust: true,
      style: {
        transform: 'none',
        margin: '0',
        padding: '0',
      }
    }

    // 4. Use toBlob for better reliability with large images
    const blob = await toBlob(node, options)
    if (!blob) throw new Error('Failed to generate image blob')

    // 5. Trigger download using a temporary anchor element
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.style.display = 'none'
    link.href = url
    link.download = filename
    
    document.body.appendChild(link)
    link.click()
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 1000)

  } catch (err) {
    console.error('[EHF] PNG Export Error:', err)
    alert(`Export failed: ${err.message || 'Unknown error'}`)
    throw err
  }
}
