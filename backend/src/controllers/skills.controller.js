const Skill = require('../models/Skill');
const { CATEGORIES, LEVELS } = Skill;

// ── GET /api/skills ─────────────────────────────────────────────────────────
// Query params:
//   search    – text search against title + description (case-insensitive)
//   category  – exact category from enum (ignored when 'All')
//   level     – exact level from enum   (ignored when 'All')
//   page      – 1-based page number (default 1)
//   limit     – page size (default 20, max 100)
exports.getSkills = async (req, res, next) => {
  try {
    const { search, category, level, page = 1, limit = 20 } = req.query;

    const filter = { isApproved: true };

    if (category && category !== 'All') filter.category = category;
    if (level    && level    !== 'All') filter.level    = level;

    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const safeLimit = Math.min(+limit, 100);

    const [data, total] = await Promise.all([
      Skill.find(filter)
        .select('title slug category level description icon teacherCount learnerCount createdBy createdAt')
        .sort({ teacherCount: -1, title: 1 })
        .skip((+page - 1) * safeLimit)
        .limit(safeLimit)
        .populate('createdBy', 'name avatar')
        .lean(),
      Skill.countDocuments(filter),
    ]);

    res.json({
      data,
      total,
      page:   +page,
      pages:  Math.ceil(total / safeLimit),
      limit:  safeLimit,
    });
  } catch (err) { next(err); }
};

// ── GET /api/skills/:id ──────────────────────────────────────────────────────
exports.getSkillById = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('createdBy', 'name avatar university')
      .lean();
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    res.json({ skill });
  } catch (err) { next(err); }
};

// ── POST /api/skills  (auth required) ────────────────────────────────────────
exports.createSkill = async (req, res, next) => {
  try {
    const { title, category, level, description, icon } = req.body;
    const skill = await Skill.create({
      title,
      category,
      level: level || 'beginner',
      description,
      icon,
      createdBy: req.user.id,
    });

    // Populate creator for the response
    await skill.populate('createdBy', 'name avatar');

    res.status(201).json({ skill });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A skill with this title already exists' });
    }
    next(err);
  }
};

// ── DELETE /api/skills/:id  (creator or admin only) ──────────────────────────
exports.deleteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    // Only the creator may delete their own skill
    if (skill.createdBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden — you did not create this skill' });
    }

    await skill.deleteOne();
    res.status(204).send();
  } catch (err) { next(err); }
};

// ── GET /api/skills/categories  (helper — distinct categories with counts) ───
exports.getCategories = async (_req, res, next) => {
  try {
    const result = await Skill.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]);
    res.json({
      categories: result.map(r => ({ name: r._id, count: r.count })),
      all: CATEGORIES,
      levels: LEVELS,
    });
  } catch (err) { next(err); }
};

// ── PATCH /api/skills/:id  (creator or admin — kept for internal use) ─────────
exports.updateSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    if (skill.createdBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden — you did not create this skill' });
    }

    const allowed = ['title', 'category', 'level', 'description', 'icon', 'isApproved'];
    allowed.forEach(k => { if (req.body[k] !== undefined) skill[k] = req.body[k]; });

    await skill.save({ runValidators: true });
    res.json({ skill });
  } catch (err) { next(err); }
};

