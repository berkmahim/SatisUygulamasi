import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prisma.js';
import { createLog } from './logController.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
export const getProjects = asyncHandler(async (req, res) => {
    const projects = await prisma.project.findMany({
        include: {
            blocks: {
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
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
    
    res.status(200).json(projects);
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
export const getProject = asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
        where: {
            id: req.params.id
        },
        include: {
            blocks: {
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
                            customer: true
                        }
                    }
                }
            },
            sales: {
                include: {
                    customer: true,
                    block: true,
                    payments: true
                }
            },
            tasks: {
                include: {
                    assignedTo: {
                        select: {
                            id: true,
                            fullName: true
                        }
                    }
                }
            }
        }
    });
    
    if (!project) {
        res.status(404);
        throw new Error('Proje bulunamadı');
    }

    res.status(200).json(project);
});

// @desc    Create project
// @route   POST /api/projects
// @access  Public
export const createProject = asyncHandler(async (req, res) => {
    const { name, location, description, backgroundImage } = req.body;

    if (!name || !location || !description) {
        res.status(400);
        throw new Error('Lütfen tüm alanları doldurun');
    }

    const project = await prisma.project.create({
        data: {
            name,
            location,
            description,
            backgroundImage
        }
    });

    // Log kaydı oluştur
    await createLog({
        type: 'PROJECT',
        action: 'CREATE',
        description: `${project.name} isimli yeni proje oluşturuldu.`,
        entityId: project.id,
        userId: req.user?.id
    }, req);

    res.status(201).json(project);
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Public
export const updateProject = asyncHandler(async (req, res) => {
    const { name, location, description, backgroundImage } = req.body;

    const existingProject = await prisma.project.findUnique({
        where: {
            id: req.params.id
        }
    });

    if (!existingProject) {
        res.status(404);
        throw new Error('Proje bulunamadı');
    }

    const updatedProject = await prisma.project.update({
        where: {
            id: req.params.id
        },
        data: {
            name: name || existingProject.name,
            location: location || existingProject.location,
            description: description || existingProject.description,
            backgroundImage: backgroundImage !== undefined ? backgroundImage : existingProject.backgroundImage
        }
    });

    // Log kaydı oluştur
    await createLog({
        type: 'PROJECT',
        action: 'UPDATE',
        description: `${updatedProject.name} isimli proje güncellendi.`,
        entityId: updatedProject.id,
        userId: req.user?.id
    }, req);

    res.json(updatedProject);
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Public
export const deleteProject = asyncHandler(async (req, res) => {
    const projectId = req.params.id;

    const project = await prisma.project.findUnique({
        where: {
            id: projectId
        },
        include: {
            blocks: true,
            sales: true
        }
    });

    if (!project) {
        res.status(404);
        throw new Error('Proje bulunamadı');
    }

    try {
        // Prisma will handle cascade deletes automatically based on schema
        await prisma.project.delete({
            where: {
                id: projectId
            }
        });

        // Log kaydı oluştur
        await createLog({
            type: 'PROJECT',
            action: 'DELETE',
            description: `${project.name} isimli proje silindi.`,
            entityId: projectId,
            userId: req.user?.id
        }, req);

        res.json({ message: 'Proje başarıyla silindi' });
    } catch (error) {
        console.error('Proje silme hatası:', error);
        res.status(500);
        throw new Error(`Proje silinirken bir hata oluştu: ${error.message}`);
    }
});

// @desc    Get project statistics
// @route   GET /api/projects/:id/stats
// @access  Public
export const getProjectStats = asyncHandler(async (req, res) => {
    const projectId = req.params.id;

    const project = await prisma.project.findUnique({
        where: {
            id: projectId
        }
    });

    if (!project) {
        res.status(404);
        throw new Error('Proje bulunamadı');
    }

    // Get project statistics using Prisma aggregations
    const stats = await prisma.$transaction(async (tx) => {
        const totalBlocks = await tx.block.count({
            where: { projectId }
        });

        const soldBlocks = await tx.block.count({
            where: {
                projectId,
                sales: {
                    some: {
                        status: 'ACTIVE'
                    }
                }
            }
        });

        const totalSales = await tx.sale.count({
            where: { projectId }
        });

        const totalSalesAmount = await tx.sale.aggregate({
            where: { projectId },
            _sum: {
                totalAmount: true
            }
        });

        const totalPaidAmount = await tx.sale.aggregate({
            where: { projectId },
            _sum: {
                totalPaidAmount: true
            }
        });

        const overduePayments = await tx.salePayment.count({
            where: {
                sale: {
                    projectId
                },
                status: 'OVERDUE'
            }
        });

        return {
            totalBlocks,
            soldBlocks,
            availableBlocks: totalBlocks - soldBlocks,
            totalSales,
            totalSalesAmount: totalSalesAmount._sum.totalAmount || 0,
            totalPaidAmount: totalPaidAmount._sum.totalPaidAmount || 0,
            pendingAmount: (totalSalesAmount._sum.totalAmount || 0) - (totalPaidAmount._sum.totalPaidAmount || 0),
            overduePayments
        };
    });

    res.json({
        project: {
            id: project.id,
            name: project.name,
            location: project.location
        },
        stats
    });
});