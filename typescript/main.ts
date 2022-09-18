import { Boot, newAudioContext, preloadImagesOfCssFile } from "./lib/boot.js"

const showProgress = (() => {
    const progress: SVGSVGElement = document.querySelector("svg.preloader") as SVGSVGElement
    window.onerror = () => progress.classList.add("error")
    window.onunhandledrejection = () => progress.classList.add("error")
    return (percentage: number) => progress.style.setProperty("--percentage", percentage.toFixed(2))
})();

(async () => {
    console.debug("booting...")

    // --- BOOT STARTS ---

    const boot = new Boot()
    boot.await('css', preloadImagesOfCssFile("./bin/main.css"))
    const context = newAudioContext()
    await boot.awaitCompletion()

    // --- BOOT ENDS ---
    const frame = () => {
        (document.querySelector(".center") as HTMLElement).textContent = `
            menubar.visible: ${window.menubar.visible}\n
            devicePixelRatio: ${window.devicePixelRatio}\n
            screenTop: ${window.screenTop}, screenLeft: ${window.screenLeft}\n
            iw: ${window.innerWidth}, ih: ${window.innerHeight}\n
            saw: ${window.screen.availWidth}, sah: ${window.screen.availHeight}\n
            sw: ${window.screen.width}, sh: ${window.screen.height}`
        requestAnimationFrame(frame)
    }
    frame()

    // prevent dragging entire document on mobile
    document.addEventListener('touchmove', (event: TouchEvent) => event.preventDefault(), { passive: false })
    document.addEventListener('dblclick', (event: Event) => event.preventDefault(), { passive: false })
    const resize = () => document.body.style.height = `${window.innerHeight}px`
    window.addEventListener("resize", resize)
    resize()
    requestAnimationFrame(() => {
        document.querySelectorAll("body svg.preloader").forEach(element => element.remove())
        document.querySelectorAll("body main").forEach(element => element.classList.remove("invisible"))
    })
    console.debug("boot complete.")
})()