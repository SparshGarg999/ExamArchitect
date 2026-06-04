import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';

export default function GithubGlobe({ width = 450, height = 450 }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    // ── Renderer (performance-tuned) ───────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    // Cap pixel-ratio at 1.5 — the #1 reason WebGL globes lag on retina screens
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    // ── Scene / Camera ─────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.z = 310;

    // ── Lights ─────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(150, 250, 150);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x818cf8, 1.0);
    rim.position.set(-150, -250, -150);
    scene.add(rim);

    // ── Globe ──────────────────────────────────────────────────────────────
    const globe = new ThreeGlobe()
      .showGlobe(true)
      .globeMaterial(new THREE.MeshPhongMaterial({
        color: 0x0b0d1e,
        transparent: true,
        opacity: 0.92,
        shininess: 10,
      }))
      .showAtmosphere(true)
      .atmosphereColor('#818cf8')
      .atmosphereAltitude(0.15);

    // ── City markers ────────────────────────────────────────────────────────
    const markers = [
      { lat: 37.7749,  lng: -122.4194, color: '#f43f5e' }, // SF
      { lat: 40.7128,  lng: -74.0060,  color: '#f43f5e' }, // NY
      { lat: 51.5074,  lng: -0.1278,   color: '#10b981' }, // London
      { lat: 35.6762,  lng: 139.6503,  color: '#a855f7' }, // Tokyo
      { lat: 12.9716,  lng: 77.5946,   color: '#ec4899' }, // Bengaluru
      { lat: -33.8688, lng: 151.2093,  color: '#06b6d4' }, // Sydney
      { lat: 48.8566,  lng: 2.3522,    color: '#10b981' }, // Paris
      { lat: 1.3521,   lng: 103.8198,  color: '#ec4899' }, // Singapore
      { lat: 25.2048,  lng: 55.2708,   color: '#06b6d4' }, // Dubai
      { lat: -23.5505, lng: -46.6333,  color: '#f59e0b' }, // São Paulo
    ];
    globe
      .pointsData(markers)
      .pointColor(p => p.color)
      .pointAltitude(0.018)
      .pointRadius(0.7);

    // ── Connection arcs (fewer = smoother) ─────────────────────────────────
    // NOTE: No GeoJSON hex-polygons — that was the performance killer.
    //       Custom lat/lon grid lines drawn via THREE.Line are used instead.
    const arcs = [
      { startLat: 37.77, startLng: -122.42, endLat: 51.51, endLng: -0.13,   color: '#a855f7', alt: 0.25 },
      { startLat: 40.71, startLng: -74.01,  endLat: 12.97, endLng: 77.59,   color: '#818cf8', alt: 0.30 },
      { startLat: 51.51, startLng: -0.13,   endLat: 35.68, endLng: 139.65,  color: '#ec4899', alt: 0.28 },
      { startLat: 12.97, startLng: 77.59,   endLat: -33.87, endLng: 151.21, color: '#06b6d4', alt: 0.22 },
      { startLat: 35.68, startLng: 139.65,  endLat: 37.77, endLng: -122.42, color: '#f59e0b', alt: 0.32 },
      { startLat: 48.86, startLng: 2.35,    endLat: 40.71, endLng: -74.01,  color: '#10b981', alt: 0.24 },
      { startLat: 1.35,  startLng: 103.82,  endLat: 12.97, endLng: 77.59,   color: '#ec4899', alt: 0.18 },
      { startLat: 25.20, startLng: 55.27,   endLat: 48.86, endLng: 2.35,    color: '#06b6d4', alt: 0.26 },
    ];
    globe
      .arcsData(arcs)
      .arcColor(a => a.color)
      .arcAltitude(a => a.alt)
      .arcStroke(0.5)
      .arcDashLength(0.35)
      .arcDashGap(0.2)
      .arcDashAnimateTime(3000); // slower = less GPU work per frame

    // ── Lightweight grid lines (replaces GeoJSON hex-polygons) ─────────────
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x6366f1, transparent: true, opacity: 0.18,
    });
    const equatorMat = new THREE.LineBasicMaterial({
      color: 0x818cf8, transparent: true, opacity: 0.40,
    });
    const R = 100; // ThreeGlobe unit radius
    const lineR = 100.8; // Floated radius to prevent z-fighting / clipping on bottom hemisphere
    // Latitude lines
    for (let lat = -75; lat <= 75; lat += 15) {
      const r = Math.cos(lat * Math.PI / 180) * lineR;
      const y = Math.sin(lat * Math.PI / 180) * lineR;
      const pts = [];
      for (let a = 0; a <= 360; a += 6)
        pts.push(new THREE.Vector3(r * Math.cos(a * Math.PI / 180), y, r * Math.sin(a * Math.PI / 180)));
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lat === 0 ? equatorMat : lineMat));
    }
    // Longitude lines
    for (let lon = 0; lon < 360; lon += 20) {
      const pts = [];
      for (let a = 0; a <= 180; a += 6) {
        const phi = a * Math.PI / 180;
        const theta = lon * Math.PI / 180;
        pts.push(new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * lineR,
          Math.cos(phi) * lineR,
          Math.sin(phi) * Math.sin(theta) * lineR,
        ));
      }
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    }

    globe.rotation.x = 0.3;
    globe.rotation.y = 0.8;
    scene.add(globe);
    setReady(true);

    // ── Drag interaction ────────────────────────────────────────────────────
    let isDown = false, prevX = 0, prevY = 0;
    const el = renderer.domElement;
    const onDown  = e => { isDown = true;  prevX = e.clientX; prevY = e.clientY; };
    const onMove  = e => {
      if (!isDown) return;
      globe.rotation.y += (e.clientX - prevX) * 0.005;
      globe.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3,
        globe.rotation.x + (e.clientY - prevY) * 0.005));
      prevX = e.clientX; prevY = e.clientY;
    };
    const onUp    = () => { isDown = false; };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    // ── Animation loop ──────────────────────────────────────────────────────
    // Use a fixed time-step to avoid over-rendering on high-refresh screens
    let rafId, lastTime = 0;
    const TARGET_FPS = 60;
    const FRAME_MS   = 1000 / TARGET_FPS;

    const animate = (now) => {
      rafId = requestAnimationFrame(animate);
      if (now - lastTime < FRAME_MS) return; // skip if too early
      lastTime = now;
      if (!isDown) globe.rotation.y += 0.0015;
      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(animate);

    // ── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (containerRef.current?.contains(el)) containerRef.current.removeChild(el);
      scene.clear();
      renderer.dispose();
    };
  }, [width, height]);

  return (
    <div
      className="github-globe-wrapper"
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        maxWidth: '100%',
        willChange: 'transform', // GPU compositing hint
      }}
    >
      <style>{`
        .github-globe-wrapper canvas {
          max-width: 100% !important;
          height: auto !important;
          outline: none;
        }
      `}</style>
      {!ready && (
        <div style={{ position: 'absolute', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="btn-spinner" /> Loading Globe...
        </div>
      )}
      <div ref={containerRef} style={{ width: `${width}px`, height: `${height}px` }} />
    </div>
  );
}
