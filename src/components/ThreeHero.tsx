import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene & Camera Setup
    const width = containerRef.current.clientWidth || 500;
    const height = containerRef.current.clientHeight || 500;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;

    // 2. WebGL Renderer with Alpha (for transparent background)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 3. Materials
    const cyanMaterial = new THREE.MeshPhongMaterial({
      color: 0x00f0ff,
      emissive: 0x00a0aa,
      specular: 0xffffff,
      shininess: 80,
      wireframe: true,
    });

    const darkMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2a45,
      roughness: 0.2,
      metalness: 0.8,
      flatShading: true,
    });

    const silverMaterial = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.1,
      metalness: 0.9,
    });

    // 4. Create Vault Lock Mesh Group
    const vaultGroup = new THREE.Group();

    // Core central sphere (representing the secure data core)
    const coreGeo = new THREE.OctahedronGeometry(1.2, 2);
    const coreMesh = new THREE.Mesh(coreGeo, cyanMaterial);
    vaultGroup.add(coreMesh);

    // Outer safe wheel/casing
    const ringGeo = new THREE.TorusGeometry(2, 0.08, 16, 100);
    const ring1 = new THREE.Mesh(ringGeo, silverMaterial);
    vaultGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, darkMetalMaterial);
    ring2.rotation.x = Math.PI / 2;
    vaultGroup.add(ring2);

    const ring3 = new THREE.Mesh(ringGeo, darkMetalMaterial);
    ring3.rotation.y = Math.PI / 2;
    vaultGroup.add(ring3);

    // Vault lock notches/ticks
    const ticksCount = 12;
    const tickGeo = new THREE.BoxGeometry(0.1, 0.2, 0.1);
    for (let i = 0; i < ticksCount; i++) {
      const tick = new THREE.Mesh(tickGeo, silverMaterial);
      const angle = (i / ticksCount) * Math.PI * 2;
      tick.position.x = Math.cos(angle) * 2;
      tick.position.y = Math.sin(angle) * 2;
      tick.rotation.z = angle + Math.PI / 2;
      vaultGroup.add(tick);
    }

    // Dial core cylinder
    const dialCylinderGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.3, 32);
    const dialCylinder = new THREE.Mesh(dialCylinderGeo, darkMetalMaterial);
    dialCylinder.rotation.x = Math.PI / 2;
    dialCylinder.position.z = 0.2;
    vaultGroup.add(dialCylinder);

    // Combination Lock dial handle/crossbars
    const handleGeo = new THREE.BoxGeometry(1.6, 0.15, 0.1);
    const handle1 = new THREE.Mesh(handleGeo, silverMaterial);
    handle1.position.z = 0.4;
    vaultGroup.add(handle1);

    const handle2 = new THREE.Mesh(handleGeo, silverMaterial);
    handle2.rotation.z = Math.PI / 2;
    handle2.position.z = 0.4;
    vaultGroup.add(handle2);

    scene.add(vaultGroup);

    // 5. Light Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const neonLight = new THREE.PointLight(0x00f0ff, 2.5, 8);
    neonLight.position.set(0, 0, 0);
    scene.add(neonLight);

    // 6. Interactive Mouse Tracking
    let targetX = 0;
    let targetY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      // Normalize coordinate: -0.5 to +0.5
      targetX = (event.clientX / window.innerWidth) - 0.5;
      targetY = (event.clientY / window.innerHeight) - 0.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Slow constant floating and rotation
        vaultGroup.rotation.y = elapsedTime * 0.12;
        vaultGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.12;

        // Smooth mouse-follow interpolation (easing)
        currentMouseX += (targetX - currentMouseX) * 0.05;
        currentMouseY += (targetY - currentMouseY) * 0.05;

        // Adjust rotation based on mouse
        vaultGroup.rotation.x = currentMouseY * 0.8;
        vaultGroup.rotation.y += currentMouseX * 0.8;

        // Rotate inner core at a different rate
        coreMesh.rotation.x = elapsedTime * 0.4;
        coreMesh.rotation.y = -elapsedTime * 0.3;
      } else {
        // Safe defaults for reduced motion
        vaultGroup.rotation.y = 0.3;
        vaultGroup.rotation.x = 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 9. Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      // Dispose materials/geometries
      coreGeo.dispose();
      ringGeo.dispose();
      tickGeo.dispose();
      dialCylinderGeo.dispose();
      handleGeo.dispose();
      cyanMaterial.dispose();
      darkMetalMaterial.dispose();
      silverMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '350px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
      }}
      aria-hidden="true"
    />
  );
};
export default ThreeHero;
