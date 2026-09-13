const TrackedRepo = require('../models/TrackedRepoSupabase');

// @route   GET api/repos
// @desc    Get all user's tracked repos
exports.getRepos = async (req, res) => {
    try {
        const repos = await TrackedRepo.findByUserId(req.user.id);
        
        // Map postgres snake_case to frontend camelCase expectations
        const formattedRepos = repos.map(r => ({
            _id: r.id,
            user: r.user_id,
            repoName: r.repo_name,
            repoUrl: r.repo_url,
            language: r.language,
            status: r.status,
            notes: r.notes,
            createdAt: r.created_at
        }));
        
        res.json(formattedRepos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST api/repos
// @desc    Add new tracked repo
exports.addRepo = async (req, res) => {
    const { repoName, repoUrl, language, status, notes } = req.body;
    try {
        const repo = await TrackedRepo.create({
            repo_name: repoName,
            repo_url: repoUrl,
            language,
            status,
            notes,
            user_id: req.user.id
        });
        res.json({
            _id: repo.id,
            user: repo.user_id,
            repoName: repo.repo_name,
            repoUrl: repo.repo_url,
            language: repo.language,
            status: repo.status,
            notes: repo.notes,
            createdAt: repo.created_at
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   PUT api/repos/:id
// @desc    Update tracked repo
exports.updateRepo = async (req, res) => {
    const { repoName, repoUrl, language, status, notes } = req.body;
    
    const repoFields = {};
    if (repoName !== undefined) repoFields.repo_name = repoName;
    if (repoUrl !== undefined) repoFields.repo_url = repoUrl;
    if (language !== undefined) repoFields.language = language;
    if (status !== undefined) repoFields.status = status;
    if (notes !== undefined) repoFields.notes = notes;

    try {
        const repo = await TrackedRepo.findById(req.params.id);
        if (!repo) return res.status(404).json({ msg: 'Repo not found' });

        if (repo.user_id !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const updatedRepo = await TrackedRepo.update(req.params.id, repoFields);
        res.json({
            _id: updatedRepo.id,
            user: updatedRepo.user_id,
            repoName: updatedRepo.repo_name,
            repoUrl: updatedRepo.repo_url,
            language: updatedRepo.language,
            status: updatedRepo.status,
            notes: updatedRepo.notes,
            createdAt: updatedRepo.created_at
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   DELETE api/repos/:id
// @desc    Delete tracked repo
exports.deleteRepo = async (req, res) => {
    try {
        const repo = await TrackedRepo.findById(req.params.id);
        if (!repo) return res.status(404).json({ msg: 'Repo not found' });

        if (repo.user_id !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await TrackedRepo.delete(req.params.id);
        res.json({ msg: 'Repo removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
