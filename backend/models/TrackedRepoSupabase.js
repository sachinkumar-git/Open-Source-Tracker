const supabase = require('../config/supabaseClient');

class TrackedRepo {
    static async findByUserId(userId) {
        const { data, error } = await supabase
            .from('tracked_repos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data;
    }

    static async findById(id) {
        const { data, error } = await supabase
            .from('tracked_repos')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data;
    }

    static async create(repoData) {
        const { data, error } = await supabase
            .from('tracked_repos')
            .insert([repoData])
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    static async update(id, updateData) {
        const { data, error } = await supabase
            .from('tracked_repos')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    static async delete(id) {
        const { error } = await supabase
            .from('tracked_repos')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
}

module.exports = TrackedRepo;
