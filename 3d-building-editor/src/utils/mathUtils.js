// Mathematical utility functions for 3D operations

import * as THREE from 'three';

export const roundToGrid = (value, gridSize = 1) => {
  return Math.round(value / gridSize) * gridSize;
};

export const roundPositionToGrid = (position, gridSize = 1) => {
  return position.map(coord => roundToGrid(coord, gridSize));
};

export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

export const distance3D = (pos1, pos2) => {
  const dx = pos1[0] - pos2[0];
  const dy = pos1[1] - pos2[1];
  const dz = pos1[2] - pos2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export const distance2D = (pos1, pos2) => {
  const dx = pos1[0] - pos2[0];
  const dz = pos1[2] - pos2[2];
  return Math.sqrt(dx * dx + dz * dz);
};

export const getBlockCenter = (block) => {
  const [x, y, z] = block.position;
  const { width, height, depth } = block.dimensions;
  
  return [
    x + width / 2,
    y + height / 2,
    z + depth / 2
  ];
};

export const getBlockBounds = (block) => {
  const [x, y, z] = block.position;
  const { width, height, depth } = block.dimensions;
  
  return {
    min: [x, y, z],
    max: [x + width, y + height, z + depth],
    center: getBlockCenter(block)
  };
};

export const isPointInsideBlock = (point, block) => {
  const [px, py, pz] = point;
  const [x, y, z] = block.position;
  const { width, height, depth } = block.dimensions;
  
  return (
    px >= x && px <= x + width &&
    py >= y && py <= y + height &&
    pz >= z && pz <= z + depth
  );
};

export const getFaceNormal = (faceIndex) => {
  const normals = [
    [0, 0, 1],  // Front
    [0, 0, -1], // Back
    [1, 0, 0],  // Right
    [-1, 0, 0], // Left
    [0, 1, 0],  // Top
    [0, -1, 0]  // Bottom
  ];
  
  return normals[faceIndex] || [0, 1, 0];
};

export const getAdjacentPosition = (block, faceNormal) => {
  const [x, y, z] = block.position;
  const { width, height, depth } = block.dimensions;
  const [nx, ny, nz] = faceNormal;
  
  return [
    x + (nx > 0 ? width : nx < 0 ? -width : 0),
    y + (ny > 0 ? height : ny < 0 ? -height : 0),
    z + (nz > 0 ? depth : nz < 0 ? -depth : 0)
  ];
};

export const normalizeVector = (vector) => {
  const length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);
  return length > 0 ? vector.map(component => component / length) : [0, 0, 0];
};

export const dotProduct = (v1, v2) => {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
};

export const crossProduct = (v1, v2) => {
  return [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0]
  ];
};

export const vectorSubtract = (v1, v2) => {
  return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
};

export const vectorAdd = (v1, v2) => {
  return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
};

export const vectorMultiply = (vector, scalar) => {
  return vector.map(component => component * scalar);
};

export const calculateVolume = (dimensions) => {
  return dimensions.width * dimensions.height * dimensions.depth;
};

export const calculateSurfaceArea = (dimensions) => {
  const { width, height, depth } = dimensions;
  return 2 * (width * height + width * depth + height * depth);
};

export const lerp = (start, end, factor) => {
  return start + (end - start) * factor;
};

export const lerpVector = (start, end, factor) => {
  return start.map((component, index) => lerp(component, end[index], factor));
};

export const convertThreeJSToArray = (vector3) => {
  return [vector3.x, vector3.y, vector3.z];
};

export const convertArrayToThreeJS = (array) => {
  return new THREE.Vector3(array[0], array[1], array[2]);
};

export const formatPosition = (position, decimals = 2) => {
  return position.map(coord => parseFloat(coord.toFixed(decimals)));
};

export const formatDimensions = (dimensions, decimals = 2) => {
  return {
    width: parseFloat(dimensions.width.toFixed(decimals)),
    height: parseFloat(dimensions.height.toFixed(decimals)),
    depth: parseFloat(dimensions.depth.toFixed(decimals))
  };
};