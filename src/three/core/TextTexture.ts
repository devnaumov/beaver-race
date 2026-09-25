import * as THREE from "three"

export class TextTexture {
  static create(text: string, background: string, foreground = "#fff7df", wide = false): THREE.CanvasTexture {
    const canvas = document.createElement("canvas")
    canvas.width = wide ? 512 : 256
    canvas.height = 128
    const context = canvas.getContext("2d")!
    context.fillStyle = background
    context.beginPath()
    context.roundRect(5, 5, canvas.width - 10, canvas.height - 10, 22)
    context.fill()
    context.strokeStyle = "#22180f"
    context.lineWidth = 10
    context.stroke()
    context.fillStyle = foreground
    context.font = `900 ${wide ? 56 : 72}px Arial`
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 3)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    return texture
  }
}
