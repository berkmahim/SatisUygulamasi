import asyncHandler from 'express-async-handler';
import Project from '../models/projectModel.js';
import Block from '../models/blockModel.js';
import Sale from '../models/saleModel.js';
import Customer from '../models/customerModel.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
export const getProjects = asyncHandler(async (req, res) => {
    const projects = await Project.find();
    res.status(200).json(projects);
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
export const getProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    
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
    const { name, location, description } = req.body;

    if (!name || !location || !description) {
        res.status(400);
        throw new Error('Lütfen tüm alanları doldurun');
    }

    const project = await Project.create({
        name,
        location,
        description
    });

    res.status(201).json(project);
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Public
export const updateProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        res.status(404);
        throw new Error('Proje bulunamadı');
    }

    const updatedProject = await Project.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.status(200).json(updatedProject);
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Public
export const deleteProject = asyncHandler(async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) {
            res.status(404);
            throw new Error('Proje bulunamadı');
        }

        // 1. Bu projeye ait tüm blokları bul
        const blocks = await Block.find({ projectId });
        const blockIds = blocks.map(block => block._id);

        // 2. Bu bloklara ait tüm satışları bul ve sil
        await Sale.deleteMany({ blockId: { $in: blockIds } });
        console.log(`Silinen satış sayısı: ${await Sale.countDocuments({ blockId: { $in: blockIds } })}`);

        // 3. Blokları sil
        await Block.deleteMany({ projectId });
        console.log(`Silinen blok sayısı: ${blocks.length}`);

        // 4. Projeyi sil
        await project.deleteOne();

        res.status(200).json({ 
            id: projectId,
            message: `Proje ve ilişkili ${blocks.length} blok başarıyla silindi.` 
        });
    } catch (error) {
        console.error('Proje silme hatası:', error);
        res.status(500);
        throw new Error(`Proje silinirken bir hata oluştu: ${error.message}`);
    }
});
