import * as THREE from 'three';

// A single watertight N: two upright stems connected by a descending diagonal.
// A shallow bow in the metal catches the studio reflections without obscuring the letter.
export function createMonogramGeometry() {
  const outline = new THREE.Shape();
  const points = [
    [-1.38, -1.65], [-1.38, 1.65], [-.77, 1.65],
    [.77, -.48], [.77, 1.65], [1.38, 1.65],
    [1.38, -1.65], [.77, -1.65], [-.77, .48], [-.77, -1.65]
  ];
  outline.moveTo(...points[0]);
  points.slice(1).forEach(point => outline.lineTo(...point));
  outline.closePath();
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth: .52,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: .095,
    bevelSize: .095,
    bevelSegments: 8,
    curveSegments: 12
  });
  geometry.translate(0, 0, -.26);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i);
    positions.setZ(i, positions.getZ(i) + .13 * Math.cos(x * 1.2) + .045 * Math.sin(y * 1.1));
  }
  geometry.center();
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

// Cut the finished mesh into three exact-fitting pieces. Interpolated normals
// preserve its original lighting when the cuts meet, without a visible seam.
export function createMonogramParts(source) {
  const attributes = source.attributes;
  const cuts = [-.66, .66];
  const epsilon = 1e-6;
  const interpolate = (a, b, t) => ({
    point: a.point.clone().lerp(b.point, t),
    normal: a.normal.clone().lerp(b.normal, t).normalize()
  });
  function clip(polygon, cut, keepRight) {
    const result = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i], b = polygon[(i + 1) % polygon.length];
      const da = (a.point.x - cut) * (keepRight ? 1 : -1);
      const db = (b.point.x - cut) * (keepRight ? 1 : -1);
      if (da >= -epsilon) result.push(a);
      if ((da > epsilon && db < -epsilon) || (da < -epsilon && db > epsilon)) {
        result.push(interpolate(a, b, da / (da - db)));
      }
    }
    return result;
  }
  function cutSurface(cut) {
    const nodes = new Map();
    const key = p => `${Math.round(p.y * 1e5)},${Math.round(p.z * 1e5)}`;
    for (let i = 0; i < attributes.position.count; i += 3) {
      const triangle = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(attributes.position, i + j));
      const intersections = [];
      for (let j = 0; j < 3; j++) {
        const a = triangle[j], b = triangle[(j + 1) % 3];
        if (Math.abs(a.x - cut) < epsilon) intersections.push(a.clone());
        if ((a.x < cut && b.x > cut) || (a.x > cut && b.x < cut)) {
          intersections.push(a.clone().lerp(b, (cut - a.x) / (b.x - a.x)));
        }
      }
      const unique = [...new Map(intersections.map(point => [key(point), point])).values()];
      if (unique.length !== 2) continue;
      const [a, b] = unique;
      if (a.distanceToSquared(b) < epsilon * epsilon) continue;
      for (const [point, other] of [[a, b], [b, a]]) {
        const id = key(point);
        if (!nodes.has(id)) nodes.set(id, {point, adjacent: new Set()});
        nodes.get(id).adjacent.add(key(other));
      }
    }
    const loops = [], visited = new Set();
    for (const first of nodes.keys()) {
      if (visited.has(first)) continue;
      let current = first, previous = null;
      const loop = [];
      while (current && !visited.has(current)) {
        visited.add(current);
        const node = nodes.get(current);
        loop.push(node.point);
        const next = [...node.adjacent].find(id => id !== previous && (!visited.has(id) || id === first));
        previous = current; current = next;
      }
      if (loop.length > 2 && current === first) loops.push(loop);
    }
    return loops;
  }
  const caps = cuts.map(cutSurface);
  return [[-Infinity, cuts[0]], [cuts[0], cuts[1]], [cuts[1], Infinity]].map(([min, max]) => {
    const positions = [], normals = [];
    function addTriangle(vertices) {
      for (const {point, normal} of vertices) {
        positions.push(point.x, point.y, point.z);
        normals.push(normal.x, normal.y, normal.z);
      }
    }
    for (let i = 0; i < attributes.position.count; i += 3) {
      let polygon = [0, 1, 2].map(j => ({
        point: new THREE.Vector3().fromBufferAttribute(attributes.position, i + j),
        normal: new THREE.Vector3().fromBufferAttribute(attributes.normal, i + j)
      }));
      if (Number.isFinite(min)) polygon = clip(polygon, min, true);
      if (Number.isFinite(max)) polygon = clip(polygon, max, false);
      for (let j = 1; j < polygon.length - 1; j++) addTriangle([polygon[0], polygon[j], polygon[j + 1]]);
    }
    for (const [cut, sign] of [[min, -1], [max, 1]]) {
      if (!Number.isFinite(cut)) continue;
      for (const loop of caps[cuts.indexOf(cut)]) {
        const triangles = THREE.ShapeUtils.triangulateShape(loop.map(p => new THREE.Vector2(p.y, p.z)), []);
        const normal = new THREE.Vector3(sign, 0, 0);
        for (const indices of triangles) {
          const points = indices.map(i => loop[i]);
          const face = new THREE.Vector3().subVectors(points[1], points[0]).cross(new THREE.Vector3().subVectors(points[2], points[0]));
          if (face.x * sign < 0) points.reverse();
          addTriangle(points.map(point => ({point, normal})));
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.computeBoundingBox();
    const pivot = geometry.boundingBox.getCenter(new THREE.Vector3());
    geometry.translate(-pivot.x, -pivot.y, -pivot.z);
    geometry.computeBoundingSphere();
    return {geometry, pivot};
  });
}
