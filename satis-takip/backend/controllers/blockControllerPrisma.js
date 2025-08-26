import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prisma.js';
import { createLog } from './logController.js';

// @desc    Get all blocks for a project
// @route   GET /api/blocks/project/:projectId
// @access  Public
export const getBlocksByProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const blocks = await prisma.block.findMany({
        where: {
            projectId
        },
        include: {
            owner: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true
                }
            },
            sales: {
                include: {
                    customer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            }
        }
    });

    res.status(200).json(blocks);
});

// @desc    Get single block
// @route   GET /api/blocks/:id
// @access  Public
export const getBlock = asyncHandler(async (req, res) => {
    const block = await prisma.block.findUnique({
        where: {
            id: req.params.id
        },
        include: {
            project: true,
            owner: true,
            sales: {
                include: {
                    customer: true,
                    payments: true
                }
            }
        }
    });

    if (!block) {
        res.status(404);
        throw new Error('Blok bulunamadı');
    }

    res.status(200).json(block);
});

// @desc    Create block
// @route   POST /api/blocks
// @access  Public
export const createBlock = asyncHandler(async (req, res) => {
    const {
        projectId,
        unitNumber,
        type = 'APARTMENT',
        squareMeters,
        roomCount,
        positionX = 0,
        positionY = 0,
        positionZ = 0,
        width = 1,
        height = 1,
        depth = 1
    } = req.body;

    if (!projectId) {
        res.status(400);
        throw new Error('Proje ID gerekli');
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });

    if (!project) {
        res.status(404);
        throw new Error('Proje bulunamadı');
    }

    const block = await prisma.block.create({
        data: {
            projectId,
            unitNumber,
            type,
            squareMeters,
            roomCount,
            positionX,
            positionY,
            positionZ,
            width,
            height,
            depth
        },
        include: {
            project: true
        }
    });

    // Log kaydı oluştur
    await createLog({
        type: 'BLOCK',
        action: 'CREATE',
        description: `${project.name} projesinde yeni blok oluşturuldu.`,
        entityId: block.id,
        userId: req.user?.id
    }, req);

    res.status(201).json(block);
});

// @desc    Update block
// @route   PUT /api/blocks/:id
// @access  Public
export const updateBlock = asyncHandler(async (req, res) => {
    const {
        unitNumber,
        type,
        squareMeters,
        roomCount,
        positionX,
        positionY,
        positionZ,
        width,
        height,
        depth,
        ownerId,
        iskanPaymentDone
    } = req.body;

    const existingBlock = await prisma.block.findUnique({
        where: {
            id: req.params.id
        },
        include: {
            project: true
        }
    });

    if (!existingBlock) {
        res.status(404);
        throw new Error('Blok bulunamadı');
    }

    // If ownerId is provided, check if customer exists
    if (ownerId) {
        const customer = await prisma.customer.findUnique({
            where: { id: ownerId }
        });

        if (!customer) {
            res.status(404);
            throw new Error('Müşteri bulunamadı');
        }
    }

    const updatedBlock = await prisma.block.update({
        where: {
            id: req.params.id
        },
        data: {
            unitNumber: unitNumber !== undefined ? unitNumber : existingBlock.unitNumber,
            type: type || existingBlock.type,
            squareMeters: squareMeters !== undefined ? squareMeters : existingBlock.squareMeters,
            roomCount: roomCount !== undefined ? roomCount : existingBlock.roomCount,
            positionX: positionX !== undefined ? positionX : existingBlock.positionX,
            positionY: positionY !== undefined ? positionY : existingBlock.positionY,
            positionZ: positionZ !== undefined ? positionZ : existingBlock.positionZ,
            width: width !== undefined ? width : existingBlock.width,
            height: height !== undefined ? height : existingBlock.height,
            depth: depth !== undefined ? depth : existingBlock.depth,
            ownerId: ownerId !== undefined ? ownerId : existingBlock.ownerId,
            iskanPaymentDone: iskanPaymentDone !== undefined ? iskanPaymentDone : existingBlock.iskanPaymentDone
        },
        include: {
            project: true,
            owner: true
        }
    });

    // Log kaydı oluştur
    await createLog({
        type: 'BLOCK',
        action: 'UPDATE',
        description: `${existingBlock.project.name} projesindeki blok güncellendi.`,
        entityId: updatedBlock.id,
        userId: req.user?.id
    }, req);

    res.json(updatedBlock);
});

// @desc    Update block position (for 3D canvas)
// @route   PUT /api/blocks/:id/position
// @access  Public
export const updateBlockPosition = asyncHandler(async (req, res) => {
    const { position, dimensions } = req.body;

    const existingBlock = await prisma.block.findUnique({
        where: {
            id: req.params.id
        }
    });

    if (!existingBlock) {
        res.status(404);
        throw new Error('Blok bulunamadı');
    }

    const updateData = {};

    // Update position if provided
    if (position && Array.isArray(position) && position.length === 3) {
        updateData.positionX = position[0];
        updateData.positionY = position[1];
        updateData.positionZ = position[2];
    }

    // Update dimensions if provided
    if (dimensions) {
        if (dimensions.width !== undefined) updateData.width = dimensions.width;
        if (dimensions.height !== undefined) updateData.height = dimensions.height;
        if (dimensions.depth !== undefined) updateData.depth = dimensions.depth;
    }

    const updatedBlock = await prisma.block.update({
        where: {
            id: req.params.id
        },
        data: updateData
    });

    res.json(updatedBlock);
});

// @desc    Delete block
// @route   DELETE /api/blocks/:id
// @access  Public
export const deleteBlock = asyncHandler(async (req, res) => {
    const blockId = req.params.id;

    const block = await prisma.block.findUnique({
        where: {
            id: blockId
        },
        include: {
            project: true,
            sales: true
        }
    });

    if (!block) {
        res.status(404);
        throw new Error('Blok bulunamadı');
    }

    // Check if block has active sales
    const activeSales = block.sales.filter(sale => sale.status === 'ACTIVE');
    if (activeSales.length > 0) {
        res.status(400);
        throw new Error('Bu blokta aktif satışlar bulunuyor. Önce satışları iptal edin.');
    }

    try {
        await prisma.block.delete({
            where: {
                id: blockId
            }
        });

        // Log kaydı oluştur
        await createLog({
            type: 'BLOCK',
            action: 'DELETE',
            description: `${block.project.name} projesindeki blok silindi.`,
            entityId: blockId,
            userId: req.user?.id
        }, req);

        res.json({ message: 'Blok başarıyla silindi' });
    } catch (error) {
        console.error('Blok silme hatası:', error);
        res.status(500);
        throw new Error(`Blok silinirken bir hata oluştu: ${error.message}`);
    }
});

// @desc    Get blocks for 3D canvas
// @route   GET /api/blocks/canvas/:projectId
// @access  Public
export const getBlocksForCanvas = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const blocks = await prisma.block.findMany({
        where: {
            projectId
        },
        select: {
            id: true,
            unitNumber: true,
            type: true,
            positionX: true,
            positionY: true,
            positionZ: true,
            width: true,
            height: true,
            depth: true,
            owner: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            }
        }
    });

    // Transform data for 3D canvas compatibility
    const transformedBlocks = blocks.map(block => ({
        _id: block.id,
        id: block.id,
        unitNumber: block.unitNumber,
        type: block.type.toLowerCase(),
        position: [block.positionX, block.positionY, block.positionZ],
        dimensions: {
            width: block.width,
            height: block.height,
            depth: block.depth
        },
        owner: block.owner
    }));

    res.status(200).json(transformedBlocks);
});