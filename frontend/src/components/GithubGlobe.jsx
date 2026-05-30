import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';

export default function GithubGlobe({ width = 450, height = 450 }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing children to prevent duplicate canvases in Strict Mode
    containerRef.current.innerHTML = '';

    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Main Directional Light
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(150, 250, 150);
    scene.add(dirLight1);

    // Accent directional light (purple/blue)
    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 1.2);
    dirLight2.position.set(-150, -250, -150);
    scene.add(dirLight2);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.z = 310;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    // 2. Initialize ThreeGlobe
    const globe = new ThreeGlobe()
      .showGlobe(true)
      .globeMaterial(new THREE.MeshPhongMaterial({
        color: 0x0b0d1e,        // Deep dark indigo matching web background
        transparent: true,
        opacity: 0.85,
        shininess: 15
      }))
      .showAtmosphere(true)
      .atmosphereColor('#818cf8') // var(--accent-indigo)
      .atmosphereAltitude(0.15);

    // Generate markers
    const markers = [
      { lat: 37.7749, lng: -122.4194, color: '#f43f5e', name: 'San Francisco' }, // SF
      { lat: 40.7128, lng: -74.0060, color: '#f43f5e', name: 'New York' },    // NY
      { lat: 51.5074, lng: -0.1278, color: '#10b981', name: 'London' },      // London
      { lat: 35.6762, lng: 139.6503, color: '#a855f7', name: 'Tokyo' },       // Tokyo
      { lat: 12.9716, lng: 77.5946, color: '#ec4899', name: 'Bengaluru' },    // Bengaluru
      { lat: -33.8688, lng: 151.2093, color: '#06b6d4', name: 'Sydney' }      // Sydney
    ];

    // Generate connections
    const arcs = [
      { startLat: 37.7749, startLng: -122.4194, endLat: 51.5074, endLng: -0.1278, color: '#a855f7', altitude: 0.25 },
      { startLat: 40.7128, startLng: -74.0060, endLat: 12.9716, endLng: 77.5946, color: '#818cf8', altitude: 0.3 },
      { startLat: 51.5074, startLng: -0.1278, endLat: 35.6762, endLng: 139.6503, color: '#ec4899', altitude: 0.28 },
      { startLat: 12.9716, startLng: 77.5946, endLat: -33.8688, endLng: 151.2093, color: '#06b6d4', altitude: 0.22 },
      { startLat: 35.6762, startLng: 139.6503, endLat: 37.7749, endLng: -122.4194, color: '#f59e0b', altitude: 0.32 }
    ];

    // Configure points (markers)
    globe
      .pointsData(markers)
      .pointColor(p => p.color)
      .pointAltitude(0.015)
      .pointRadius(0.8);

    // Configure arcs (connections)
    globe
      .arcsData(arcs)
      .arcColor(a => a.color)
      .arcAltitude(a => a.altitude)
      .arcStroke(0.6)
      .arcDashLength(0.4)
      .arcDashGap(0.15)
      .arcDashAnimateTime(2000);

    // Load countries GeoJSON and render hexagonal land polygons
    fetch('/countries.geojson')
      .then(res => res.json())
      .then(countries => {
        globe
          .hexPolygonsData(countries.features)
          .hexPolygonResolution(3)
          .hexPolygonMargin(0.6)
          .hexPolygonUseDots(true) // Render land as dots matching GitHub globe style
          .hexPolygonColor(() => 'rgba(99, 102, 241, 0.45)'); // Semi-transparent indigo
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load countries GeoJSON:', err);
        setLoading(false);
      });

    scene.add(globe);

    // 3. Animation and Drag rotation
    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };

    // Gentle tilt on startup
    globe.rotation.x = 0.3;
    globe.rotation.y = 0.8;

    const domElement = renderer.domElement;

    const handlePointerDown = (e) => {
      isMouseDown = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e) => {
      if (!isMouseDown) return;
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      globe.rotation.y += deltaMove.x * 0.005;
      globe.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globe.rotation.x + deltaMove.y * 0.005));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isMouseDown = false;
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Animation Loop
    let animationId;
    const animate = () => {
      if (!isMouseDown) {
        globe.rotation.y += 0.0018; // Slow auto-rotation
      }
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // 5. Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (containerRef.current && domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(domElement);
      }
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
        maxWidth: '100%'
      }}
    >
      <style>
        {`
          .github-globe-wrapper canvas {
            max-width: 100% !important;
            height: auto !important;
            outline: none;
          }
        `}
      </style>
      {loading && (
        <div style={{ position: 'absolute', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="btn-spinner"></span> Loading 3D Globe...
        </div>
      )}
      <div ref={containerRef} style={{ width: `${width}px`, height: `${height}px` }} />
    </div>
  );
}
