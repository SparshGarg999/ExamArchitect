import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const CITIES = [
    [40.7, -74.0],   // New York
    [51.5, 0.0],   // London
    [48.8, 2.3],   // Paris
    [35.7, 139.7],   // Tokyo
    [22.3, 114.2],   // Hong Kong
    [1.3, 103.8],   // Singapore
    [-33.9, 18.4],   // Cape Town
    [19.4, -99.1],   // Mexico City
    [-23.5, -46.6],   // São Paulo
    [55.7, 37.6],   // Moscow
    [28.6, 77.2],   // New Delhi
    [37.6, -122.4],   // San Francisco
    [-37.8, 144.9],   // Melbourne
    [25.2, 55.3],   // Dubai
    [41.0, 28.9],   // Istanbul
    [31.2, 121.5],   // Shanghai
    [-1.3, 36.8],   // Nairobi
    [60.2, 24.9],   // Helsinki
    [34.0, -118.2],   // Los Angeles
]

const ARC_PAIRS = [
    [0, 1], [1, 2], [3, 4], [4, 5], [10, 11],
    [7, 8], [12, 13], [15, 3], [6, 13], [0, 7],
]

function latLonToVec3(lat, lon, radius = 1.006) {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)
    return new THREE.Vector3(
        -(Math.sin(phi) * Math.cos(theta)) * radius,
        Math.cos(phi) * radius,
        Math.sin(phi) * Math.sin(theta) * radius,
    )
}

/**
 * EarthGlobe — animated interactive 3D globe
 *
 * Props:
 *   height          {string}   CSS height string, e.g. "500px" or "60vh"
 *   className       {string}   Extra Tailwind / CSS classes for the container
 *   autoRotateSpeed {number}   Radians per frame (default 0.003)
 *   dotColor        {number}   Hex color for city dots & rings (default 0x44ccff)
 *   gridColor       {number}   Hex color for lat/lon lines (default 0x2255bb)
 *   arcColor        {number}   Hex color for connection arcs (default 0x44aaff)
 *   onLoaded        {function} Callback fired when the scene is ready
 *
 * Usage:
 *   import EarthGlobe from './EarthGlobe'
 *   <EarthGlobe height="500px" className="rounded-2xl" />
 */
export default function EarthGlobe({
    height = '500px',
    className = '',
    autoRotateSpeed = 0.003,
    dotColor = 0x44ccff,
    gridColor = 0x2255bb,
    arcColor = 0x44aaff,
    onLoaded,
}) {
    const mountRef = useRef(null)
    const rafRef = useRef(null)

    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        const W = () => mount.clientWidth
        const H = () => mount.clientHeight

        // ── Renderer ──────────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(W(), H())
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        mount.appendChild(renderer.domElement)

        // ── Scene & Camera ────────────────────────────────────────────────────────
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, W() / H(), 0.1, 1000)
        camera.position.z = 3.0

        // ── Lighting ──────────────────────────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0x223366, 4))
        const sun = new THREE.DirectionalLight(0x88aaff, 5)
        sun.position.set(5, 3, 5)
        scene.add(sun)
        const backLight = new THREE.DirectionalLight(0x001133, 2)
        backLight.position.set(-3, -2, -3)
        scene.add(backLight)

        // ── Globe group (everything that rotates together) ─────────────────────
        const globeGroup = new THREE.Group()
        scene.add(globeGroup)

        // Dark core
        globeGroup.add(new THREE.Mesh(
            new THREE.SphereGeometry(0.993, 64, 64),
            new THREE.MeshPhongMaterial({ color: 0x060c1a, emissive: 0x030610 }),
        ))

        // Ocean surface
        globeGroup.add(new THREE.Mesh(
            new THREE.SphereGeometry(0.997, 64, 64),
            new THREE.MeshPhongMaterial({
                color: 0x0d3060, emissive: 0x061530,
                specular: 0x4477cc, shininess: 60,
                transparent: true, opacity: 0.9,
            }),
        ))

        // ── Lat / Lon grid ────────────────────────────────────────────────────────
        const lineMat = new THREE.LineBasicMaterial({ color: gridColor, transparent: true, opacity: 0.28 })
        const equatorMat = new THREE.LineBasicMaterial({ color: 0x3388ff, transparent: true, opacity: 0.55 })

        for (let lat = -75; lat <= 75; lat += 15) {
            const r = Math.cos(lat * Math.PI / 180) * 1.001
            const y = Math.sin(lat * Math.PI / 180) * 1.001
            const pts = []
            for (let a = 0; a <= 360; a += 3)
                pts.push(new THREE.Vector3(r * Math.cos(a * Math.PI / 180), y, r * Math.sin(a * Math.PI / 180)))
            globeGroup.add(new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                lat === 0 ? equatorMat : lineMat,
            ))
        }

        for (let lon = 0; lon < 360; lon += 15) {
            const pts = []
            for (let a = 0; a <= 180; a += 3) {
                const phi = a * Math.PI / 180
                const theta = lon * Math.PI / 180
                pts.push(new THREE.Vector3(
                    Math.sin(phi) * Math.cos(theta) * 1.001,
                    Math.cos(phi) * 1.001,
                    Math.sin(phi) * Math.sin(theta) * 1.001,
                ))
            }
            globeGroup.add(new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                lon === 0 ? equatorMat : lineMat,
            ))
        }

        // ── City dots + pulsing rings ─────────────────────────────────────────────
        const rings = []
        const dotGeo = new THREE.SphereGeometry(0.011, 8, 8)
        const dotMat = new THREE.MeshBasicMaterial({ color: dotColor })
        const ringGeo = new THREE.RingGeometry(0.012, 0.02, 20)

        CITIES.forEach(([lat, lon], i) => {
            const pos = latLonToVec3(lat, lon)

            const dot = new THREE.Mesh(dotGeo, dotMat)
            dot.position.copy(pos)
            globeGroup.add(dot)

            const ringMat = new THREE.MeshBasicMaterial({
                color: dotColor, transparent: true, opacity: 0.8, side: THREE.DoubleSide,
            })
            const ring = new THREE.Mesh(ringGeo, ringMat)
            ring.position.copy(pos)
            ring.lookAt(new THREE.Vector3(0, 0, 0))
            ring._offset = i / CITIES.length
            rings.push(ring)
            globeGroup.add(ring)
        })

        // ── Connection arcs ───────────────────────────────────────────────────────
        const arcMat = new THREE.LineBasicMaterial({ color: arcColor, transparent: true, opacity: 0.35 })
        ARC_PAIRS.forEach(([a, b]) => {
            const start = latLonToVec3(CITIES[a][0], CITIES[a][1])
            const end = latLonToVec3(CITIES[b][0], CITIES[b][1])
            const mid = start.clone().add(end).normalize().multiplyScalar(1.35)
            const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
            globeGroup.add(new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)),
                arcMat,
            ))
        })

            // ── Atmosphere layers ─────────────────────────────────────────────────────
            ;[{ r: 1.055, o: 0.07 }, { r: 1.12, o: 0.04 }, { r: 1.22, o: 0.018 }].forEach(({ r, o }) => {
                scene.add(new THREE.Mesh(
                    new THREE.SphereGeometry(r, 64, 64),
                    new THREE.MeshPhongMaterial({ color: 0x1a44cc, transparent: true, opacity: o, side: THREE.BackSide }),
                ))
            })

        // ── Stars ─────────────────────────────────────────────────────────────────
        const STAR_COUNT = 2500
        const starPos = new Float32Array(STAR_COUNT * 3)
        for (let i = 0; i < STAR_COUNT * 3; i++) starPos[i] = (Math.random() - 0.5) * 130
        const starGeo = new THREE.BufferGeometry()
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
        scene.add(new THREE.Points(
            starGeo,
            new THREE.PointsMaterial({ color: 0xffffff, size: 0.065, transparent: true, opacity: 0.82 }),
        ))

        onLoaded?.()

        // ── Drag interaction ──────────────────────────────────────────────────────
        let dragging = false, lx = 0, ly = 0, vx = 0, vy = 0, autoRotate = true
        let resumeTimer = null

        const startDrag = (x, y) => {
            dragging = true; autoRotate = false
            lx = x; ly = y
            mount.style.cursor = 'grabbing'
            clearTimeout(resumeTimer)
        }
        const endDrag = () => {
            dragging = false
            mount.style.cursor = 'grab'
            resumeTimer = setTimeout(() => { autoRotate = true }, 3500)
        }
        const moveDrag = (x, y) => {
            if (!dragging) return
            vx = (y - ly) * 0.005
            vy = (x - lx) * 0.005
            globeGroup.rotation.x += vx
            globeGroup.rotation.y += vy
            lx = x; ly = y
        }

        mount.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY))
        window.addEventListener('mouseup', endDrag)
        window.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY))
        mount.addEventListener('touchstart', e => startDrag(e.touches[0].clientX, e.touches[0].clientY), { passive: true })
        window.addEventListener('touchend', endDrag)
        window.addEventListener('touchmove', e => moveDrag(e.touches[0].clientX, e.touches[0].clientY), { passive: true })

        // ── Resize ────────────────────────────────────────────────────────────────
        const onResize = () => {
            camera.aspect = W() / H()
            camera.updateProjectionMatrix()
            renderer.setSize(W(), H())
        }
        window.addEventListener('resize', onResize)

        // ── Animation loop ────────────────────────────────────────────────────────
        let t = 0
        const animate = () => {
            rafRef.current = requestAnimationFrame(animate)
            t += 0.01

            if (autoRotate) {
                globeGroup.rotation.y += autoRotateSpeed
            } else if (!dragging) {
                vx *= 0.94; vy *= 0.94
                globeGroup.rotation.x += vx
                globeGroup.rotation.y += vy
            }

            rings.forEach(ring => {
                const p = (t * 0.38 + ring._offset) % 1
                ring.scale.set(1 + p * 2.8, 1 + p * 2.8, 1)
                ring.material.opacity = 0.72 * (1 - p)
            })

            renderer.render(scene, camera)
        }
        animate()

        // ── Cleanup ───────────────────────────────────────────────────────────────
        return () => {
            cancelAnimationFrame(rafRef.current)
            clearTimeout(resumeTimer)
            mount.removeEventListener('mousedown', startDrag)
            window.removeEventListener('mouseup', endDrag)
            window.removeEventListener('mousemove', moveDrag)
            mount.removeEventListener('touchstart', startDrag)
            window.removeEventListener('touchend', endDrag)
            window.removeEventListener('touchmove', moveDrag)
            window.removeEventListener('resize', onResize)
            renderer.dispose()
            if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
        }
    }, [autoRotateSpeed, dotColor, gridColor, arcColor]) // re-init if visual props change

    return (
        <div
            ref={mountRef}
            className={className}
            style={{ width: '100%', height, cursor: 'grab' }}
        />
    )
}