// Block Types and Configuration

export const BLOCK_TYPES = {
  APARTMENT: 'apartment',
  STORE: 'store',
  OFFICE: 'office',
  PARKING: 'parking'
};

export const BLOCK_STATUS = {
  AVAILABLE: 'available',
  SOLD: 'sold',
  RESERVED: 'reserved',
  UNDER_CONSTRUCTION: 'under_construction'
};

export const TEXT_PROPERTIES = {
  MIN_FONT_SIZE: 0.1,
  MAX_FONT_SIZE: 2.0,
  DEFAULT_FONT_SIZE: 0.3,
  DEFAULT_COLOR: '#ffffff'
};

export const DIMENSION_LIMITS = {
  MIN_SIZE: 0.5,
  MAX_SIZE: 20,
  DEFAULT_SIZE: 1,
  STEP: 0.5
};

export const DEFAULT_BLOCK = {
  id: null,
  position: [0, 0, 0],
  dimensions: { width: 1, height: 1, depth: 1 },
  type: BLOCK_TYPES.APARTMENT,
  status: BLOCK_STATUS.AVAILABLE,
  unitNumber: '',
  owner: null
};

export const DEFAULT_TEXT = {
  id: null,
  position: [0, 0.5, 0],
  text: 'New Text',
  color: TEXT_PROPERTIES.DEFAULT_COLOR,
  fontSize: TEXT_PROPERTIES.DEFAULT_FONT_SIZE
};

export const COLORS = {
  BLOCK: {
    AVAILABLE: '#52c41a',
    SOLD: '#ff4d4f',
    RESERVED: '#faad14',
    UNDER_CONSTRUCTION: '#722ed1',
    SELECTED: '#1890ff',
    HOVERED: '#40a9ff'
  },
  GRID: {
    CELL: '#6f6f6f',
    SECTION: '#4f4f4f'
  },
  TEXT: {
    DEFAULT: '#ffffff',
    SELECTED: '#ff0000',
    HOVERED: '#4CAF50'
  }
};