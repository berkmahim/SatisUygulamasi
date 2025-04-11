import asyncHandler from 'express-async-handler';
import Task from '../models/taskModel.js';
import User from '../models/userModel.js';
import Customer from '../models/customerModel.js';
import Project from '../models/projectModel.js';
import Notification from '../models/notificationModel.js';

// @desc    Get tasks for current user
// @route   GET /api/tasks
// @access  Private
const getUserTasks = asyncHandler(async (req, res) => {
    const { status, priority, due, type } = req.query;
    
    // Filtreleme kriterlerini hazırla
    let filter = {};
    
    // Görev tipine göre filtrele (atanan, oluşturulan veya tümü)
    if (type === 'assigned') {
        // Sadece kullanıcıya atanan görevler
        filter = { assignedTo: req.user._id };
    } else if (type === 'created') {
        // Sadece kullanıcının oluşturduğu görevler
        filter = { createdBy: req.user._id };
    } else {
        // Varsayılan olarak her ikisi de
        filter = {
            $or: [
                { assignedTo: req.user._id },
                { createdBy: req.user._id }
            ]
        };
    }
    
    // Duruma göre filtrele
    if (status) {
        filter.status = status;
    }
    
    // Önceliğe göre filtrele
    if (priority) {
        filter.priority = priority;
    }
    
    // Vade tarihine göre filtrele
    if (due === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        filter.dueDate = { $gte: today, $lt: tomorrow };
    } else if (due === 'week') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        filter.dueDate = { $gte: today, $lt: nextWeek };
    } else if (due === 'overdue') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filter.dueDate = { $lt: today };
        filter.status = { $ne: 'completed' };
    }
    
    const tasks = await Task.find(filter)
        .populate('createdBy', 'fullName username')
        .populate('assignedTo', 'fullName username')
        .populate('relatedCustomer', 'firstName lastName')
        .populate('relatedProject', 'name')
        .sort({ dueDate: 1 });
    
    res.json(tasks);
});

// @desc    Get all tasks (admin/manager)
// @route   GET /api/tasks/all
// @access  Private/Admin
const getAllTasks = asyncHandler(async (req, res) => {
    const { status, assignedTo, due } = req.query;
    
    // Filtreleme kriterlerini hazırla
    const filter = {};
    
    // Duruma göre filtrele
    if (status) {
        filter.status = status;
    }
    
    // Atanan kişiye göre filtrele
    if (assignedTo) {
        filter.assignedTo = assignedTo;
    }
    
    // Vade tarihine göre filtrele
    if (due === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        filter.dueDate = { $gte: today, $lt: tomorrow };
    } else if (due === 'week') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        filter.dueDate = { $gte: today, $lt: nextWeek };
    } else if (due === 'overdue') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filter.dueDate = { $lt: today };
        filter.status = { $ne: 'completed' };
    }
    
    const tasks = await Task.find(filter)
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .populate('relatedCustomer', 'firstName lastName')
        .populate('relatedProject', 'name')
        .sort({ dueDate: 1 });
    
    res.json(tasks);
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
    const { 
        title, 
        description, 
        assignedTo, 
        relatedCustomer, 
        relatedProject, 
        dueDate, 
        priority,
        reminderDate
    } = req.body;
    
    // Atanan kullanıcının varlığını kontrol et
    if (assignedTo) {
        const userExists = await User.findById(assignedTo);
        if (!userExists) {
            res.status(404);
            throw new Error('Atanacak kullanıcı bulunamadı');
        }
    }
    
    // İlgili müşterinin varlığını kontrol et
    if (relatedCustomer) {
        const customerExists = await Customer.findById(relatedCustomer);
        if (!customerExists) {
            res.status(404);
            throw new Error('İlgili müşteri bulunamadı');
        }
    }
    
    // İlgili projenin varlığını kontrol et
    if (relatedProject) {
        const projectExists = await Project.findById(relatedProject);
        if (!projectExists) {
            res.status(404);
            throw new Error('İlgili proje bulunamadı');
        }
    }
    
    const task = await Task.create({
        title,
        description,
        assignedTo: assignedTo || req.user._id,
        createdBy: req.user._id,
        relatedCustomer,
        relatedProject,
        dueDate,
        priority: priority || 'medium',
        reminderDate
    });
    
    if (task) {
        res.status(201).json(task);
    } else {
        res.status(400);
        throw new Error('Geçersiz görev bilgileri');
    }
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
        res.status(404);
        throw new Error('Görev bulunamadı');
    }
    
    // Yetki kontrolü - Görevi sadece oluşturan kişi tüm alanları güncelleyebilir
    // Atanan kişi sadece durum alanını güncelleyebilir
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();
    const isTaskAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isTaskCreator && !isTaskAssignee && !isAdmin) {
        res.status(403);
        throw new Error('Bu görevi güncelleme yetkiniz bulunmamaktadır');
    }
    
    const { 
        title, 
        description, 
        assignedTo, 
        status, 
        priority, 
        dueDate,
        reminderDate
    } = req.body;
    
    // Durum güncellemesi yapılıyorsa ve kullanıcı görevin oluşturucusu değilse ve atanmış kişi de değilse
    if (status && !isTaskAssignee && !isAdmin) {
        res.status(403);
        throw new Error('Sadece göreve atanan kişi görev durumunu değiştirebilir');
    }
    
    // Görevin oluşturucusu tüm alanları değiştirmeye çalışıyorsa ve durum alanını da değiştirmeye çalışıyorsa
    if (isTaskCreator && !isTaskAssignee && !isAdmin && status) {
        res.status(403);
        throw new Error('Görevi oluşturan kişi olarak sadece görev detaylarını düzenleyebilirsiniz, durum değişikliği için atanan kişinin onayı gerekir');
    }
    
    // Sadece status alanını içeren bir istekse ve kullanıcı görevin atanmış kişisi ise
    if (isTaskAssignee && !isTaskCreator && !isAdmin && Object.keys(req.body).some(key => key !== 'status')) {
        res.status(403);
        throw new Error('Göreve atanan kişi olarak sadece görev durumunu değiştirebilirsiniz');
    }
    
    // Durum tamamlandı olarak değiştiriliyorsa tamamlanma tarihini ayarla
    let completedDate = task.completedDate;
    if (status === 'completed' && task.status !== 'completed') {
        completedDate = new Date();
    }
    
    // Değişiklik yapılmadan önceki değerleri saklayalım
    const taskBeforeUpdate = {
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo.toString(),
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
    };
    
    // Görev güncellemesi - sadece oluşturucu veya admin tüm alanları değiştirebilir
    if (isTaskCreator || isAdmin) {
        task.title = title || task.title;
        task.description = description || task.description;
        task.assignedTo = assignedTo || task.assignedTo;
        task.priority = priority || task.priority;
        task.dueDate = dueDate || task.dueDate;
        task.reminderDate = reminderDate !== undefined ? reminderDate : task.reminderDate;
    }
    
    // Durum değişikliği olup olmadığını kontrol et
    const oldStatus = task.status;
    const isStatusChanged = status && oldStatus !== status;
    
    // Durum güncellemesi - hem oluşturucu hem de atanan kişi yapabilir
    if (status && (isTaskAssignee || isAdmin)) {
        task.status = status;
        task.completedDate = completedDate;
    }
    
    const updatedTask = await task.save();
    
    // Görevin atanan kişisi değiştiyse veya öncelik, başlık, açıklama değiştiyse bildirim gönder
    const isAssigneeChanged = assignedTo && taskBeforeUpdate.assignedTo !== assignedTo.toString();
    const isPriorityChanged = priority && taskBeforeUpdate.priority !== priority;
    const isTitleChanged = title && taskBeforeUpdate.title !== title;
    const isDescChanged = description && taskBeforeUpdate.description !== description;
    
    // Görev detayları değiştiyse, atanan kişiye bildirim gönder
    if (isAssigneeChanged || isPriorityChanged || isTitleChanged || isDescChanged) {
        await Notification.createTaskUpdatedNotification(updatedTask, req.user);
    }
    
    // Durum değiştiyse, görevi oluşturan kişiye bildirim gönder
    if (isStatusChanged) {
        await Notification.createTaskStatusChangedNotification(updatedTask, req.user, oldStatus);
    }
    
    res.json(updatedTask);
});

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id)
        .populate('createdBy', 'fullName username')
        .populate('assignedTo', 'fullName username')
        .populate('relatedCustomer', 'firstName lastName')
        .populate('relatedProject', 'name');
    
    if (!task) {
        res.status(404);
        throw new Error('Görev bulunamadı');
    }
    
    // Yetki kontrolü - sadece görevin oluşturucusu, atanan kişi veya admin görebilir
    const isTaskCreator = task.createdBy._id.toString() === req.user._id.toString();
    const isTaskAssignee = task.assignedTo._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isTaskCreator && !isTaskAssignee && !isAdmin) {
        res.status(403);
        throw new Error('Bu görevi görüntüleme yetkiniz bulunmamaktadır');
    }
    
    res.json(task);
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
        res.status(404);
        throw new Error('Görev bulunamadı');
    }
    
    // Görevi sadece oluşturan kişi veya admin silebilir
    if (
        task.createdBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin'
    ) {
        res.status(403);
        throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
    }
    
    await Task.deleteOne({ _id: task._id });
    res.json({ message: 'Görev başarıyla silindi' });
});

// @desc    Process task reminders
// @route   GET /api/tasks/process-reminders
// @access  Private/Admin
const processTaskReminders = asyncHandler(async (req, res) => {
    const now = new Date();
    
    // Hatırlatma zamanı geçmiş ama hatırlatma gönderilmemiş görevleri bul
    const tasksToRemind = await Task.find({
        reminderDate: { $lte: now },
        reminderSent: false,
        status: { $ne: 'completed' }
    }).populate('assignedTo');
    
    // Her görev için hatırlatma işlemi yap
    const results = [];
    for (const task of tasksToRemind) {
        // Bu örnekte sadece hatırlatma gönderilmiş olarak işaretliyoruz
        // Gerçek uygulamada e-posta, bildirim vb. gönderilir
        task.reminderSent = true;
        await task.save();
        
        results.push({
            taskId: task._id,
            title: task.title,
            assignedTo: task.assignedTo ? task.assignedTo.name : 'Atanmamış',
            dueDate: task.dueDate
        });
    }
    
    res.json({
        message: `${results.length} görev için hatırlatma işlemi yapıldı`,
        reminders: results
    });
});

export {
    getUserTasks,
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    processTaskReminders
};
