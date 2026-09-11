const supabase = require('../config/supabaseClient');

class User {
    static async findById(id) {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, email, avatar_url, github_id, created_at')
            .eq('id', id)
            .single();
        if (error) return null;
        return data;
    }

    static async findByEmail(email) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error) return null;
        return data;
    }

    static async findByGithubId(githubId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('github_id', githubId)
            .single();
        if (error) return null;
        return data;
    }

    static async create(userData) {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    static async update(id, updateData) {
        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}

module.exports = User;
