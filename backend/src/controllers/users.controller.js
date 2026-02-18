const User = require('../models/User');
const path = require('path');

// Maps each category chip to the skill keywords users actually store
const CATEGORY_PATTERNS = {
  Coding:      /react|node|mongo|angular|vue|html|css|javascript|typescript|python|java|c\+\+|arduino|django|flutter|dart|firebase|pytorch|tensorflow|nlp|opencv|postgresql|mysql|sql|redux|graphql|devops|docker|aws|cloud|kotlin|swift|rails|php|golang|rust|scala/i,
  Design:      /figma|adobe|photoshop|illustrator|xd|canva|sketch|ui|ux|design|css|graphic|logo|brand|prototype|indesign|affinity|zeplin/i,
  Languages:   /english|spanish|french|german|japanese|chinese|arabic|hindi|mandarin|korean|italian|portuguese|language|translat|russian|turkish|dutch/i,
  Music:       /music|guitar|piano|violin|drum|singing|voice|bass|compos|chord|melody|beat|instrument|ukulele|cello|flute|saxophone/i,
  Marketing:   /marketing|seo|social media|digital|branding|advertis|campaign|amazon|listing|analytics|growth|email|content|copywrite|ppc|ads/i,
  Writing:     /writing|write|essay|blog|content|copy|creative|technical|journalism|editorial|proofreading|novel|fiction|screenplay/i,
  Mathematics: /math|calculus|algebra|statistic|probability|geometry|matlab|numeric|equation|trigonometry|linear algebra/i,
  Science:     /physics|chemistry|biology|science|data|machine learning|tensorflow|power bi|excel|financial|autocad|solidworks|tally|modelling|modeling|analysis|lab|research/i,
};

// GET /api/users  — browse students (supports ?category=&search=&page=&limit=)
exports.getStudents = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;
    const filter = {};

    // Exclude the logged-in user's own profile from browse results
    if (req.user?.id) {
      filter._id = { $ne: req.user.id };
    }

    if (search) {
      filter.$or = [
        { name:          { $regex: search, $options: 'i' } },
        { skillsOffered: { $elemMatch: { $regex: search, $options: 'i' } } },
        { skillsWanted:  { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }

    if (category && category !== 'All') {
      const pattern = CATEGORY_PATTERNS[category];
      if (pattern) {
        filter.skillsOffered = { $elemMatch: { $regex: pattern.source, $options: 'i' } };
      } else {
        // Fallback: match the category name directly
        filter.skillsOffered = { $elemMatch: { $regex: category, $options: 'i' } };
      }
    }

    const [data, total] = await Promise.all([
      User.find(filter)
        .select('name university major skillsOffered skillsWanted rating totalSwaps avatar isOnline')
        .skip((+page - 1) * +limit)
        .limit(+limit),
      User.countDocuments(filter),
    ]);

    // Shape to match StudentProfile interface
    const shaped = data.map(u => ({
      _id:        u._id,
      name:       u.name,
      university: u.university,
      major:      u.major,
      teaches:    u.skillsOffered,
      wants:      u.skillsWanted,
      rating:     u.rating,
      totalSwaps: u.totalSwaps,
      avatar:     u.avatar,
      isOnline:   u.isOnline,
    }));

    res.json({ data: shaped, total, page: +page, pages: Math.ceil(total / +limit), limit: +limit });
  } catch (err) { next(err); }
};

// GET /api/users/:id
exports.getStudentById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email university major skillsOffered skillsWanted rating totalSwaps avatar isOnline bio level');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Shape to match StudentProfile interface (teaches/wants)
    const shaped = {
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      university: user.university,
      major:      user.major,
      bio:        user.bio,
      teaches:    user.skillsOffered  ?? [],
      wants:      user.skillsWanted   ?? [],
      rating:     user.rating         ?? 0,
      totalSwaps: user.totalSwaps     ?? 0,
      avatar:     user.avatar,
      isOnline:   user.isOnline,
      level:      user.level,
    };

    res.json({ user: shaped });
  } catch (err) { next(err); }
};

// GET /api/users/me  (requires auth)
exports.getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
};

// PATCH /api/users/me  (requires auth)
exports.updateMyProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'university', 'major', 'bio', 'skillsOffered', 'skillsWanted'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ user });
  } catch (err) { next(err); }
};

// PUT /api/users/update  (requires auth) — full profile update with optional image upload
exports.updateProfile = async (req, res, next) => {
  try {
    const ALLOWED_TEXT_FIELDS = ['name', 'bio', 'university', 'major', 'level'];
    const updates = {};

    // Pull in allowed text fields
    ALLOWED_TEXT_FIELDS.forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    // Array fields may arrive as JSON-encoded strings (FormData) or real arrays (JSON body)
    ['skillsOffered', 'skillsWanted'].forEach(k => {
      if (req.body[k] === undefined) return;
      if (typeof req.body[k] === 'string') {
        try { updates[k] = JSON.parse(req.body[k]); } catch { updates[k] = [req.body[k]]; }
      } else {
        updates[k] = req.body[k];
      }
    });

    // If multer parsed a profileImage file, save the public URL into avatar
    if (req.file) {
      // Normalise path separators so URLs always use forward slashes
      const relativePath = path.join('uploads', 'avatars', req.file.filename).replace(/\\/g, '/');
      updates.avatar = `/${relativePath}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) { next(err); }
};

// GET /api/users/me/matches  — suggested matches based on skillsWanted ↔ skillsOffered
exports.getSuggestedMatches = async (req, res, next) => {
  try {
    const me = await User.findById(req.user.id).select('skillsOffered skillsWanted');
    if (!me) return res.status(404).json({ message: 'User not found' });

    const matches = await User.find({
      _id: { $ne: me._id },
      skillsOffered: { $elemMatch: { $in: me.skillsWanted } },
    })
      .select('name university major skillsOffered skillsWanted rating totalSwaps avatar isOnline')
      .limit(8);

    const shaped = matches.map(u => ({
      _id:        u._id,
      name:       u.name,
      university: u.university,
      major:      u.major,
      teaches:    u.skillsOffered,
      wants:      u.skillsWanted,
      rating:     u.rating,
      totalSwaps: u.totalSwaps,
      avatar:     u.avatar,
      isOnline:   u.isOnline,
    }));

    res.json({ data: shaped });
  } catch (err) { next(err); }
};
