# 3D Building Editor

A standalone React component library for creating interactive 3D building block editors. Extracted from a construction project management system and made reusable for any project requiring 3D building visualization and manipulation.

## Features

- **Interactive 3D Building Blocks**: Create, resize, and position building units in 3D space
- **Advanced Collision Detection**: Automatic block repositioning to prevent overlaps
- **3D Text Labels**: Add and position text labels in the 3D scene
- **Real-time Editing**: Live preview of dimension changes and block modifications
- **Face-based Block Addition**: Click on any face of a block to add adjacent blocks
- **Comprehensive Control Panel**: Easy-to-use interface for block and text management
- **Customizable Configuration**: Flexible theming and behavior options
- **TypeScript Support**: Full type definitions included

## Installation

```bash
npm install 3d-building-editor
# or
yarn add 3d-building-editor
```

## Dependencies

This package requires the following peer dependencies:

```bash
npm install react react-dom three @react-three/fiber @react-three/drei antd
```

## Quick Start

```jsx
import React, { useState } from 'react';
import { BuildingCanvas } from '3d-building-editor';
import 'antd/dist/reset.css';

function App() {
  const [blocks, setBlocks] = useState([
    {
      id: 'block-1',
      position: [0, 0, 0],
      dimensions: { width: 2, height: 3, depth: 2 },
      type: 'apartment',
      status: 'available',
      unitNumber: 'A1'
    }
  ]);

  const handleBlockSave = (block) => {
    setBlocks(prev => [...prev, block]);
  };

  const handleBlockUpdate = (blockId, updates) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  };

  const handleBlockDelete = (blockId) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <BuildingCanvas
        initialBlocks={blocks}
        onBlockSave={handleBlockSave}
        onBlockUpdate={handleBlockUpdate}
        onBlockDelete={handleBlockDelete}
        showControlPanel={true}
        permissions={{ canEdit: true, canDelete: true }}
      />
    </div>
  );
}

export default App;
```

## Advanced Usage

### Custom Configuration

```jsx
const config = {
  ground: { 
    size: 20, 
    color: '#f0f0f0' 
  },
  blocks: { 
    colors: { 
      available: '#52c41a', 
      sold: '#ff4d4f',
      reserved: '#faad14'
    },
    minSize: 0.5,
    maxSize: 10
  },
  controls: { 
    enabled: true,
    position: 'left'
  }
};

<BuildingCanvas config={config} />
```

### Using Hooks for Advanced State Management

```jsx
import { useBlockManagement, useTextManagement } from '3d-building-editor';

function AdvancedEditor() {
  const {
    blocks,
    selectedBlock,
    addBlock,
    updateBlock,
    deleteBlock,
    selectBlock
  } = useBlockManagement();

  const {
    texts,
    selectedText,
    addText,
    updateText,
    deleteText
  } = useTextManagement();

  return (
    <BuildingCanvas
      initialBlocks={blocks}
      initialTexts={texts}
      onBlockSave={addBlock}
      onBlockUpdate={updateBlock}
      onBlockDelete={deleteBlock}
      onTextSave={addText}
      onTextUpdate={updateText}
      onTextDelete={deleteText}
    />
  );
}
```

### Individual Components

You can also use individual components:

```jsx
import { BuildingBlock, Text3D, ControlPanel } from '3d-building-editor';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function CustomEditor() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <BuildingBlock
        position={[0, 0, 0]}
        dimensions={{ width: 2, height: 3, depth: 2 }}
        unitNumber="A1"
        status="available"
      />
      
      <Text3D
        text="Building A"
        position={[0, 4, 0]}
        color="#ffffff"
        fontSize={0.5}
      />
      
      <OrbitControls />
    </Canvas>
  );
}
```

## API Reference

### BuildingCanvas Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialBlocks` | `Block[]` | `[]` | Initial array of building blocks |
| `initialTexts` | `Text[]` | `[]` | Initial array of 3D text labels |
| `onBlockSave` | `(block: Block) => void` | - | Callback when a new block is created |
| `onBlockUpdate` | `(id: string, updates: Partial<Block>) => void` | - | Callback when a block is updated |
| `onBlockDelete` | `(id: string) => void` | - | Callback when a block is deleted |
| `onBlockSell` | `(id: string) => void` | - | Callback when block sell is requested |
| `onTextSave` | `(text: Text) => void` | - | Callback when a new text is created |
| `onTextUpdate` | `(id: string, updates: Partial<Text>) => void` | - | Callback when text is updated |
| `onTextDelete` | `(id: string) => void` | - | Callback when text is deleted |
| `showControlPanel` | `boolean` | `true` | Whether to show the control panel |
| `config` | `Config` | `{}` | Configuration object for customization |
| `permissions` | `Permissions` | `{ canEdit: true, canDelete: true }` | User permissions |
| `theme` | `'light' \| 'dark'` | `'light'` | UI theme |

### Block Type

```typescript
interface Block {
  id: string;
  position: [number, number, number];
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  type: 'apartment' | 'store' | 'office' | 'parking';
  status: 'available' | 'sold' | 'reserved' | 'under_construction';
  unitNumber?: string;
  owner?: any;
}
```

### Text Type

```typescript
interface Text {
  id: string;
  position: [number, number, number];
  text: string;
  color: string;
  fontSize: number;
}
```

## Controls

### Edit Mode
- **Toggle Edit Mode**: Enable/disable editing capabilities
- **Add Block Mode**: Click on ground or block faces to add new blocks
- **Add Text Mode**: Click on ground to add text labels

### Block Editing
- **Selection**: Click on blocks to select them
- **Dimension Changes**: Use control panel to modify width, height, and depth
- **Details**: Update unit number, type, and status
- **Deletion**: Delete selected blocks

### Text Editing
- **Selection**: Click on text to select
- **Content**: Edit text content and styling
- **Positioning**: Drag text to reposition
- **Deletion**: Remove text labels

### Camera Controls
- **Orbit**: Click and drag to rotate camera
- **Zoom**: Mouse wheel to zoom in/out
- **Pan**: Right-click and drag to pan

## Advanced Features

### Collision Detection
The editor includes sophisticated collision detection that automatically moves blocks when dimensions change to prevent overlaps. This includes:

- **Iterative Resolution**: Handles chain reactions when blocks push other blocks
- **Boundary Checking**: Prevents blocks from going below ground level
- **Directional Movement**: Blocks move in appropriate directions based on changes

### Face-based Block Addition
Click on any face of an existing block to add a new block adjacent to that face. The system automatically calculates the correct position and orientation.

### 3D Text Management
- Text always faces the camera (billboard effect)
- Drag and drop repositioning
- Full customization of content, color, and size

## Development

### Running the Example

```bash
git clone <repository>
cd 3d-building-editor
npm install
npm run dev
```

### Building the Library

```bash
npm run build
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please use the GitHub issue tracker.