import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.js',
      name: '3DBuildingEditor',
      fileName: (format) => `3d-building-editor.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei', 'antd'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          three: 'THREE',
          '@react-three/fiber': 'ReactThreeFiber',
          '@react-three/drei': 'ReactThreeDrei',
          antd: 'antd'
        }
      }
    }
  },
  server: {
    port: 3001,
    open: true
  }
})